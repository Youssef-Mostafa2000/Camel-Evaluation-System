import os
import cv2
import torch
import json
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Tuple, Optional
from PIL import Image
from torchvision import transforms
from transformers import ViTModel
from ultralytics import YOLO

# ====================================================
# PART 1: HELPER FUNCTIONS FOR YOLO & MASK PROCESSING
# ====================================================

def enlarge_bbox(bbox, image_width, image_height, percentage):
    """
    Enlarge a bbox by percentage while staying inside image limits.
    bbox: (x_min, y_min, x_max, y_max)
    """
    x_min, y_min, x_max, y_max = bbox
    width = x_max - x_min
    height = y_max - y_min
    enlarge_w = width * percentage
    enlarge_h = height * percentage

    new_x_min = max(0, int(x_min - enlarge_w / 2))
    new_y_min = max(0, int(y_min - enlarge_h / 2))
    new_x_max = min(image_width, int(x_max + enlarge_w / 2))
    new_y_max = min(image_height, int(y_max + enlarge_h / 2))

    return (new_x_min, new_y_min, new_x_max, new_y_max)


def transform_face_coords_to_original(face_results, crop_bbox, original_img_shape):
    """
    Transform face boxes/masks from a cropped region back to original coords.
    crop_bbox is the bbox (x_min,y_min,x_max,y_max) of the crop in the original image.
    """
    transformed_boxes = []
    transformed_masks = []
    transformed_confidences = []
    transformed_class_ids = []

    if face_results.boxes is not None and len(face_results.boxes) > 0:
        x_offset, y_offset = crop_bbox[0], crop_bbox[1]

        for box in face_results.boxes.xyxy.cpu().numpy():
            x1, y1, x2, y2 = box
            transformed_boxes.append([x1 + x_offset, y1 + y_offset, x2 + x_offset, y2 + y_offset])

        transformed_confidences = face_results.boxes.conf.cpu().numpy().tolist()
        transformed_class_ids = face_results.boxes.cls.cpu().numpy().tolist()

    if face_results.masks is not None and len(face_results.masks) > 0:
        for mask_data in face_results.masks.data:
            mask_np = mask_data.cpu().numpy()
            original_mask = np.zeros(original_img_shape[:2], dtype=np.uint8)

            crop_width = crop_bbox[2] - crop_bbox[0]
            crop_height = crop_bbox[3] - crop_bbox[1]
            target_size = (crop_width, crop_height)

            if target_size[0] > 0 and target_size[1] > 0:
                resized_mask = cv2.resize(mask_np, target_size, interpolation=cv2.INTER_LINEAR)
                resized_mask = (resized_mask > 0.5).astype(np.uint8)

                x_min, y_min = int(crop_bbox[0]), int(crop_bbox[1])
                h_crop, w_crop = resized_mask.shape

                y_end = min(y_min + h_crop, original_img_shape[0])
                x_end = min(x_min + w_crop, original_img_shape[1])

                h_paste, w_paste = y_end - y_min, x_end - x_min
                if h_paste > 0 and w_paste > 0:
                    original_mask[y_min:y_end, x_min:x_end] = resized_mask[:h_paste, :w_paste]

                transformed_masks.append(original_mask)

    return transformed_boxes, transformed_masks, transformed_confidences, transformed_class_ids


def get_instance_crops_from_image(
    image_path,
    body_seg_model,
    face_seg_model,
    enlarge_percentage=0.05,
    body_conf_threshold=0.5,
    face_conf_threshold=0.25
):
    """
    Returns a list of instance crops (body and face) from the image:
    [{'cropped_image', 'cropped_mask', 'class_name', 'enlarged_bbox_coords',
      'confidence', 'original_image_path', 'unique_id'}, ...]
    """
    instance_crops_list = []

    original_image = cv2.imread(image_path)
    if original_image is None:
        return []

    original_image_rgb = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
    original_h, original_w, _ = original_image_rgb.shape
    original_base_name = os.path.splitext(os.path.basename(image_path))[0]

    try:
        body_results = body_seg_model.predict(
            original_image_rgb, conf=body_conf_threshold, iou=0.5, verbose=False
        )[0]
    except Exception as e:
        print(f"Error predicting body: {e}")
        return []

    if body_results.boxes is not None and len(body_results.boxes) > 0:
        for i, (box, conf, cls) in enumerate(
            zip(body_results.boxes.xyxy, body_results.boxes.conf, body_results.boxes.cls)
        ):
            class_name = body_seg_model.names[int(cls)]
            if class_name != 'Body_seg':
                continue
            confidence = float(conf)

            body_bbox_orig_coords = tuple(map(int, box.cpu().numpy()))
            enlarged_body_bbox = enlarge_bbox(
                body_bbox_orig_coords, original_w, original_h, enlarge_percentage
            )
            ebx_min, eby_min, ebx_max, eby_max = enlarged_body_bbox
            if (ebx_max - ebx_min) <= 0 or (eby_max - eby_min) <= 0:
                continue

            cropped_body_image_rgb = original_image_rgb[eby_min:eby_max, ebx_min:ebx_max].copy()
            cropped_body_mask = np.zeros(cropped_body_image_rgb.shape[:2], dtype=np.uint8)

            if body_results.masks is not None and i < len(body_results.masks.data):
                body_mask_data = body_results.masks.data[i].cpu().numpy()
                mask_full_size = cv2.resize(
                    body_mask_data, (original_w, original_h), interpolation=cv2.INTER_NEAREST
                )
                mask_crop = mask_full_size[eby_min:eby_max, ebx_min:ebx_max]
                if mask_crop.shape == cropped_body_mask.shape:
                    cropped_body_mask = (mask_crop > 0.5).astype(np.uint8) * 255

            unique_body_id = f"{original_base_name}_{class_name}_{i}"
            instance_crops_list.append({
                'cropped_image': cropped_body_image_rgb,
                'cropped_mask': cropped_body_mask,
                'class_name': class_name,
                'enlarged_bbox_coords': enlarged_body_bbox,
                'confidence': confidence,
                'original_image_path': image_path,
                'unique_id': unique_body_id
            })

            if cropped_body_image_rgb.shape[0] > 0 and cropped_body_image_rgb.shape[1] > 0:
                try:
                    face_results = face_seg_model.predict(
                        cropped_body_image_rgb, conf=face_conf_threshold, iou=0.5, verbose=False
                    )[0]
                except Exception:
                    continue

                if face_results.boxes is not None and len(face_results.boxes) > 0:
                    transformed_face_boxes, transformed_face_masks, transformed_face_confs, transformed_face_clses = \
                        transform_face_coords_to_original(
                            face_results, enlarged_body_bbox, original_image_rgb.shape
                        )

                    for j, (face_box_orig, face_mask_orig, face_conf_orig, face_cls_orig) in enumerate(
                        zip(transformed_face_boxes, transformed_face_masks,
                            transformed_face_confs, transformed_face_clses)
                    ):
                        face_class_name = face_seg_model.names[int(face_cls_orig)]
                        if face_class_name != 'Face_seg':
                            continue

                        face_confidence = float(face_conf_orig)
                        face_bbox_orig_coords = tuple(map(int, face_box_orig))
                        enlarged_face_bbox = enlarge_bbox(
                            face_bbox_orig_coords, original_w, original_h, enlarge_percentage
                        )
                        efx_min, efy_min, efx_max, efy_max = enlarged_face_bbox
                        if (efx_max - efx_min) <= 0 or (efy_max - efy_min) <= 0:
                            continue

                        cropped_face_image_rgb = original_image_rgb[efy_min:efy_max, efx_min:efx_max].copy()

                        if face_mask_orig.shape[:2] == (original_h, original_w):
                            mask_crop = face_mask_orig[efy_min:efy_max, efx_min:efx_max]
                            cropped_face_mask = (mask_crop > 0.5).astype(np.uint8) * 255
                        else:
                            cropped_face_mask = np.zeros(cropped_face_image_rgb.shape[:2], dtype=np.uint8)

                        unique_face_id = f"{original_base_name}_{face_class_name}_{i}_{j}"
                        instance_crops_list.append({
                            'cropped_image': cropped_face_image_rgb,
                            'cropped_mask': cropped_face_mask,
                            'class_name': face_class_name,
                            'enlarged_bbox_coords': enlarged_face_bbox,
                            'confidence': face_confidence,
                            'original_image_path': image_path,
                            'unique_id': unique_face_id
                        })

    return instance_crops_list


# ============================================================
# PART 2: MASKENHANCEDVIT, FUSION, AND SCORER (UNCHANGED)
# ============================================================

class MaskEnhancedViT(nn.Module):
    """
    Stronger mask-guided ViT:
    - uses standard ViT encoder
    - adds a separate mask-guided pooled token
    - fuses CLS + foreground tokens via MLP
    """
    def __init__(self, pretrained_name='google/vit-base-patch16-224', out_dim=256):
        super().__init__()
        self.vit = ViTModel.from_pretrained(pretrained_name)
        self.hidden_size = self.vit.config.hidden_size

        self.mask_encoder = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=7, stride=4, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 1, kernel_size=3, stride=2, padding=1)
        )

        self.fuse_head = nn.Sequential(
            nn.Linear(self.hidden_size * 2, out_dim),
            nn.LayerNorm(out_dim),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(out_dim, out_dim),
            nn.LayerNorm(out_dim),
            nn.GELU()
        )

    def forward(self, image, mask):
        vit_outputs = self.vit(pixel_values=image, return_dict=True)
        hidden_states = vit_outputs.last_hidden_state    # (B,1+N,D)
        cls_token = hidden_states[:, 0]                  # (B,D)
        patch_tokens = hidden_states[:, 1:]              # (B,N,D)

        B, _, H, W = mask.shape
        mask_feat = self.mask_encoder(mask)              # (B,1,h,w)
        mask_feat = F.adaptive_avg_pool2d(
            mask_feat,
            (int(patch_tokens.size(1) ** 0.5),
             int(patch_tokens.size(1) ** 0.5))
        )                                                # (B,1,h',w')
        mask_flat = mask_feat.flatten(2)                 # (B,1,N)
        mask_weights = torch.sigmoid(mask_flat)          # [0,1]
        mask_weights = mask_weights / (mask_weights.sum(dim=-1, keepdim=True) + 1e-6)

        fg_token = (patch_tokens * mask_weights.transpose(1, 2)).sum(dim=1)  # (B,D)

        fused = torch.cat([cls_token, fg_token], dim=-1)  # (B,2D)
        features = self.fuse_head(fused)                  # (B,out_dim)
        return features


class CrossModalFusion(nn.Module):
    """
    Fuses body and face features using cross-attention.
    """
    def __init__(self, feature_dim=256, num_modalities=2):
        super().__init__()
        self.num_modalities = num_modalities
        self.cross_attention = nn.MultiheadAttention(
            embed_dim=feature_dim,
            num_heads=8,
            dropout=0.1,
            batch_first=True
        )

        self.ffn = nn.Sequential(
            nn.Linear(feature_dim, feature_dim * 4),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(feature_dim * 4, feature_dim)
        )

        self.norm1 = nn.LayerNorm(feature_dim)
        self.norm2 = nn.LayerNorm(feature_dim)

    def forward(self, features_list):
        seq = torch.stack(features_list, dim=1)
        attn_out, _ = self.cross_attention(seq, seq, seq)
        seq = self.norm1(seq + attn_out)
        ffn_out = self.ffn(seq)
        seq = self.norm2(seq + ffn_out)
        fused = seq.mean(dim=1)
        return fused


class CamelBeautyScorer(nn.Module):
    """
    Complete unified model for camel beauty assessment with mask-guided ViT.
    """
    def __init__(
        self,
        vit_model='google/vit-base-patch16-224',
        feature_dim=256,
        num_beauty_scores_classes=10,
        num_category_classes=2,
        pretrained=True
    ):
        super().__init__()

        print("Initializing Camel Beauty Scorer with MaskEnhancedViT...")

        self.body_encoder = MaskEnhancedViT(
            pretrained_name=vit_model,
            out_dim=feature_dim
        )

        self.face_encoder = MaskEnhancedViT(
            pretrained_name=vit_model,
            out_dim=feature_dim
        )

        self.empty_body_embedding = nn.Parameter(torch.randn(feature_dim))
        self.empty_face_embedding = nn.Parameter(torch.randn(feature_dim))

        self.fusion = CrossModalFusion(feature_dim=feature_dim, num_modalities=2)

        self.shared_mlp = nn.Sequential(
            nn.Linear(feature_dim, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2)
        )

        self.attribute_heads = nn.ModuleDict({
            'head_beauty_score': nn.Linear(256, num_beauty_scores_classes),
            'neck_beauty_score': nn.Linear(256, num_beauty_scores_classes),
            'body_limb_hump_beauty_score': nn.Linear(256, num_beauty_scores_classes),
            'body_size_beauty_score': nn.Linear(256, num_beauty_scores_classes),
            'category_encoded': nn.Linear(256, num_category_classes)
        })

        self._initialize_weights()

    def _initialize_weights(self):
        for head in self.attribute_heads.values():
            nn.init.xavier_uniform_(head.weight)
            nn.init.zeros_(head.bias)

    def forward(
        self,
        body_image: torch.Tensor,
        face_image: torch.Tensor,
        body_mask: torch.Tensor,
        face_mask: torch.Tensor,
        body_present: torch.Tensor,
        face_present: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        batch_size = body_image.shape[0]

        body_features = torch.zeros(
            batch_size, self.empty_body_embedding.shape[0], device=body_image.device
        )
        face_features = torch.zeros(
            batch_size, self.empty_face_embedding.shape[0], device=face_image.device
        )

        if body_present.any():
            body_features[body_present] = self.body_encoder(
                body_image[body_present], body_mask[body_present]
            )
        if (~body_present).any():
            body_features[~body_present] = self.empty_body_embedding.unsqueeze(0).expand(
                (~body_present).sum(), -1
            )

        if face_present.any():
            face_features[face_present] = self.face_encoder(
                face_image[face_present], face_mask[face_present]
            )
        if (~face_present).any():
            face_features[~face_present] = self.empty_face_embedding.unsqueeze(0).expand(
                (~face_present).sum(), -1
            )

        fused_features = self.fusion([body_features, face_features])
        shared_repr = self.shared_mlp(fused_features)

        scores = {}
        for attr_name, head in self.attribute_heads.items():
            scores[attr_name] = head(shared_repr)

        return scores


# ===================================
# PART 3: LABELS & TOP-3 SCORE LOGIC
# ===================================

ARABIC_SCORE_LABELS = {
    'head_beauty_score': 'جمال الرأس',
    'neck_beauty_score': 'جمال الرقبة',
    'body_limb_hump_beauty_score': 'جمال الجسم والأطراف والسنام',
    'body_size_beauty_score': 'جمال ضخامة الجسم',
    'category_encoded': 'الفئة'
}

SCORE_WEIGHTS = {
    'head_beauty_score': 0.50,
    'neck_beauty_score': 0.20,
    'body_limb_hump_beauty_score': 0.15,
    'body_size_beauty_score': 0.15
}


def calculate_beauty_scores(
    outputs: Dict[str, torch.Tensor],
    num_beauty_classes: int = 10,
    arabic_labels: Dict[str, str] = ARABIC_SCORE_LABELS,
    score_weights: Dict[str, float] = SCORE_WEIGHTS,
    top_k: int = 10
):
    """
    Convert logits to per-attribute 0–100 scores using only top-K probabilities.
    - Softmax over all classes.
    - Take top-K classes and probabilities.
    - Renormalize top-K probabilities so they sum to 1.
    - Compute expected class index with only top-K.
    """
    device = next(iter(outputs.values())).device
    scores_dict = {}
    total_weighted = 0.0

    for attr in ['head_beauty_score', 'neck_beauty_score',
                 'body_limb_hump_beauty_score', 'body_size_beauty_score']:
        logits = outputs[attr]          # (1, C)
        probs_full = torch.softmax(logits, dim=-1)[0]  # (C,)

        k = min(top_k, num_beauty_classes)
        top_probs, top_indices = torch.topk(probs_full, k=k, dim=-1)

        top_probs = top_probs / (top_probs.sum() + 1e-8)

        expected_idx = (top_probs * top_indices.float()).sum()
        raw_score_1K = expected_idx.item() + 1.0
        score_0_100 = (raw_score_1K - 1) / (num_beauty_classes - 1) * 100.0

        scores_dict[attr] = {
            'raw_class_score': raw_score_1K,
            'score_0_100': score_0_100,
            'label_ar': arabic_labels.get(attr, attr),
            'top_indices': top_indices.cpu().tolist(),
            'top_probs': top_probs.cpu().tolist()
        }

        w = score_weights.get(attr, 0.0)
        total_weighted += w * score_0_100

    # Category (0 = Beautiful, 1 = Ugly)
    cat_logits = outputs['category_encoded']
    cat_probs = torch.softmax(cat_logits, dim=-1)[0].cpu().numpy()
    cat_pred = int(torch.argmax(cat_logits, dim=-1).item())
    cat_label_txt = "Beautiful" if cat_pred == 0 else "Ugly"

    scores_dict['category_encoded'] = {
        'predicted_class': cat_pred,
        'predicted_label': cat_label_txt,
        'probs': cat_probs.tolist(),
        'label_ar': arabic_labels.get('category_encoded', 'الفئة')
    }

    total_beauty_score = total_weighted
    star_rating = total_beauty_score / 20.0  # 0–5

    return scores_dict, total_beauty_score, star_rating


# ==========================================
# PART 4: VISUALIZATION & FULL INFERENCE RUN
# ==========================================

def visualize_camel_scores(
    original_image_rgb: np.ndarray,
    body_bbox: Optional[Tuple[int, int, int, int]],
    face_bbox: Optional[Tuple[int, int, int, int]],
    scores_dict,
    total_score: float,
    star_rating: float
):
    """
    Overlay body/face boxes + scores on the image.
    - Text block in bottom-left corner.
    - Font size/thickness proportional to image height.
    - Stars shown only as numeric rating.
    - Category: 0 = Beautiful, 1 = Ugly.
    """
    img = original_image_rgb.copy()
    H, W, _ = img.shape

    body_color = (0, 255, 0)
    face_color = (255, 0, 0)

    # Draw body and face boxes with ASCII labels
    if body_bbox is not None:
        x1, y1, x2, y2 = map(int, body_bbox)
        cv2.rectangle(img, (x1, y1), (x2, y2), body_color, 2)
        cv2.putText(img, "Body", (x1, max(0, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, body_color, 2)

    if face_bbox is not None:
        x1, y1, x2, y2 = map(int, face_bbox)
        cv2.rectangle(img, (x1, y1), (x2, y2), face_color, 2)
        cv2.putText(img, "Face", (x1, max(0, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, face_color, 2)

    # Dynamic font size based on image height
    base_font_scale = H / 600.0
    font_scale = max(0.5, min(1.5, base_font_scale))
    thickness = max(1, int(font_scale * 2))

    font = cv2.FONT_HERSHEY_SIMPLEX
    text_color = (255, 255, 255)
    outline_color = (0, 0, 0)

    def put_outlined_text(img, text, org):
        x, y = org
        cv2.putText(img, text, (x+1, y+1), font, font_scale, outline_color, thickness+1, cv2.LINE_AA)
        cv2.putText(img, text, (x, y), font, font_scale, text_color, thickness, cv2.LINE_AA)

    margin = int(0.035 * H)
    x_left = margin
    y_bottom = H - margin
    line_gap = int(40 * font_scale)

    # Build lines from bottom to top
    lines = []

    # Category line
    cat = scores_dict['category_encoded']
    cat_line = f"Category: {cat['predicted_label']}"
    lines.append(cat_line)

    # Attribute scores
    attr_labels_en = {
        'head_beauty_score': 'Head',
        'neck_beauty_score': 'Neck',
        'body_limb_hump_beauty_score': 'Body+Hump',
        'body_size_beauty_score': 'Size'
    }
    for key in ['head_beauty_score', 'neck_beauty_score',
                'body_limb_hump_beauty_score', 'body_size_beauty_score']:
        v = scores_dict[key]
        s100 = v['score_0_100']
        label_en = attr_labels_en.get(key, key)
        lines.append(f"{label_en}: {s100:.1f}/100")

    # Stars as numeric only
    lines.append(f"Stars: {star_rating:.1f} / 5")

    # Total score
    lines.append(f"Total: {total_score:.1f}/100")

    # Draw from bottom up
    y = y_bottom
    for text in lines:
        put_outlined_text(img, text, (x_left, y))
        y -= line_gap

    return img


def run_full_inference_pipeline(
    image_path: str,
    body_yolo_model: YOLO,
    face_yolo_model: YOLO,
    beauty_scorer_model: CamelBeautyScorer,
    image_transform,
    mask_transform,
    num_beauty_classes: int = 10,
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu"),
    visualize: bool = True
):
    """
    End-to-end:
    - YOLO body detection -> enlarged body bbox (for face and scorer).
    - YOLO face detection inside enlarged body.
    - Build body/face crops + masks from same enlarged bboxes.
    - Run CamelBeautyScorer and compute 0–100 + stars using top-3 class probabilities.
    """
    original_image = cv2.imread(image_path)
    if original_image is None:
        print(f"Could not read image: {image_path}")
        return None, None

    original_image_rgb = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
    H, W, _ = original_image_rgb.shape

    body_results = body_yolo_model.predict(
        original_image_rgb, conf=0.5, iou=0.5, verbose=False
    )[0]

    if body_results.boxes is None or len(body_results.boxes) == 0:
        print("No body detected.")
        return original_image_rgb, None

    best_body_idx = int(torch.argmax(body_results.boxes.conf).item())
    best_body_box = body_results.boxes.xyxy[best_body_idx].cpu().numpy()
    bx1, by1, bx2, by2 = map(int, best_body_box)

    enlarged_body_box = enlarge_bbox((bx1, by1, bx2, by2), W, H, percentage=0.05)
    ebx1, eby1, ebx2, eby2 = enlarged_body_box

    body_mask_full = None
    if body_results.masks is not None and len(body_results.masks.data) > best_body_idx:
        m = body_results.masks.data[best_body_idx].cpu().numpy()
        body_mask_full = cv2.resize(m, (W, H), interpolation=cv2.INTER_NEAREST)
        body_mask_full = (body_mask_full > 0.5).astype(np.uint8)

    body_crop = original_image_rgb[eby1:eby2, ebx1:ebx2].copy()
    if body_mask_full is not None:
        body_mask_crop = body_mask_full[eby1:eby2, ebx1:ebx2]
    else:
        body_mask_crop = np.zeros(body_crop.shape[:2], dtype=np.uint8)

    face_results = face_yolo_model.predict(
        body_crop, conf=0.25, iou=0.5, verbose=False
    )[0]

    face_present_flag = False
    face_box_global = None
    face_crop = None
    face_mask_crop = None

    if face_results.boxes is not None and len(face_results.boxes) > 0:
        best_face_idx = int(torch.argmax(face_results.boxes.conf).item())
        fbox_crop = face_results.boxes.xyxy[best_face_idx].cpu().numpy()
        fx1_c, fy1_c, fx2_c, fy2_c = map(int, fbox_crop)

        enlarged_face_bbox_in_crop = enlarge_bbox(
            (fx1_c, fy1_c, fx2_c, fy2_c),
            body_crop.shape[1], body_crop.shape[0],
            percentage=0.05
        )
        efx1_c, efy1_c, efx2_c, efy2_c = enlarged_face_bbox_in_crop

        face_crop = body_crop[efy1_c:efy2_c, efx1_c:efx2_c].copy()
        face_box_global = (ebx1 + efx1_c, eby1 + efy1_c, ebx1 + efx2_c, eby1 + efy2_c)

        if face_results.masks is not None and len(face_results.masks.data) > best_face_idx:
            fm = face_results.masks.data[best_face_idx].cpu().numpy()
            fm_full = cv2.resize(fm, (body_crop.shape[1], body_crop.shape[0]),
                                 interpolation=cv2.INTER_NEAREST)
            fm_full = (fm_full > 0.5).astype(np.uint8)
            face_mask_crop = fm_full[efy1_c:efy2_c, efx1_c:efx2_c]
        else:
            face_mask_crop = np.zeros(face_crop.shape[:2], dtype=np.uint8)

        face_present_flag = True

    beauty_scorer_model = beauty_scorer_model.to(device)
    beauty_scorer_model.eval()

    if body_crop.size == 0 or body_crop.shape[0] == 0 or body_crop.shape[1] == 0:
        body_img_t = torch.zeros(1, 3, 224, 224, device=device)
        body_mask_t = torch.zeros(1, 1, 224, 224, device=device)
        body_present = torch.tensor([False], device=device)
    else:
        body_img_pil = Image.fromarray(body_crop)
        body_img_t = image_transform(body_img_pil).unsqueeze(0).to(device)

        body_mask_pil = Image.fromarray((body_mask_crop * 255).astype(np.uint8))
        body_mask_t = mask_transform(body_mask_pil).unsqueeze(0).to(device)
        body_mask_t = (body_mask_t > 0.5).float()
        body_present = torch.tensor([True], device=device)

    if not face_present_flag or face_crop is None or face_crop.size == 0 \
       or face_crop.shape[0] == 0 or face_crop.shape[1] == 0:
        face_img_t = torch.zeros(1, 3, 224, 224, device=device)
        face_mask_t = torch.zeros(1, 1, 224, 224, device=device)
        face_present = torch.tensor([False], device=device)
    else:
        face_img_pil = Image.fromarray(face_crop)
        face_img_t = image_transform(face_img_pil).unsqueeze(0).to(device)

        face_mask_pil = Image.fromarray((face_mask_crop * 255).astype(np.uint8))
        face_mask_t = mask_transform(face_mask_pil).unsqueeze(0).to(device)
        face_mask_t = (face_mask_t > 0.5).float()
        face_present = torch.tensor([True], device=device)

    with torch.no_grad():
        outputs = beauty_scorer_model(
            body_image=body_img_t,
            face_image=face_img_t,
            body_mask=body_mask_t,
            face_mask=face_mask_t,
            body_present=body_present,
            face_present=face_present
        )

    scores_dict, total_score, star_rating = calculate_beauty_scores(
        outputs, num_beauty_classes=num_beauty_classes
    )

    body_bbox_global = (bx1, by1, bx2, by2)
    result_image = None
    if visualize:
        result_image = visualize_camel_scores(
            original_image_rgb,
            body_bbox_global,
            face_box_global,
            scores_dict,
            total_score,
            star_rating
        )

    return result_image, {
        'scores_dict': scores_dict,
        'total_score_0_100': total_score,
        'star_rating_0_5': star_rating
    }



from typing import Any

# ==========================================================
# PART 6: NON-VISUAL INFERENCE HELPERS
# ==========================================================

def infer_single_image(
    image_path: str,
    body_yolo_model: YOLO,
    face_yolo_model: YOLO,
    beauty_scorer_model: CamelBeautyScorer,
    image_transform,
    mask_transform,
    num_beauty_classes: int = 10,
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
) -> Tuple[Optional[Tuple[int, int, int, int]], Optional[Dict[str, Any]]]:
    """
    Run inference on a single image WITHOUT printing or visualization.

    Returns:
        body_bbox_global: (x1, y1, x2, y2) of the selected camel body in original image coords,
                          or None if no body detected / error.
        result_dict: {
            'scores_dict': <full per-attribute dict>,
            'total_score_0_100': float,
            'star_rating_0_5': float
        } or None if no result.
    """
    original_image = cv2.imread(image_path)
    if original_image is None:
        return None, None

    original_image_rgb = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
    H, W, _ = original_image_rgb.shape

    body_results = body_yolo_model.predict(
        original_image_rgb, conf=0.5, iou=0.5, verbose=False
    )[0]

    if body_results.boxes is None or len(body_results.boxes) == 0:
        return None, None

    best_body_idx = int(torch.argmax(body_results.boxes.conf).item())
    best_body_box = body_results.boxes.xyxy[best_body_idx].cpu().numpy()
    bx1, by1, bx2, by2 = map(int, best_body_box)

    enlarged_body_box = enlarge_bbox((bx1, by1, bx2, by2), W, H, percentage=0.05)
    ebx1, eby1, ebx2, eby2 = enlarged_body_box

    body_mask_full = None
    if body_results.masks is not None and len(body_results.masks.data) > best_body_idx:
        m = body_results.masks.data[best_body_idx].cpu().numpy()
        body_mask_full = cv2.resize(m, (W, H), interpolation=cv2.INTER_NEAREST)
        body_mask_full = (body_mask_full > 0.5).astype(np.uint8)

    body_crop = original_image_rgb[eby1:eby2, ebx1:ebx2].copy()
    if body_mask_full is not None:
        body_mask_crop = body_mask_full[eby1:eby2, ebx1:ebx2]
    else:
        body_mask_crop = None

    face_results = face_yolo_model.predict(
        body_crop, conf=0.25, iou=0.5, verbose=False
    )[0]

    face_present_flag = False
    face_crop = None
    face_mask_crop = None

    if face_results.boxes is not None and len(face_results.boxes) > 0:
        best_face_idx = int(torch.argmax(face_results.boxes.conf).item())
        fbox_crop = face_results.boxes.xyxy[best_face_idx].cpu().numpy()
        fx1_c, fy1_c, fx2_c, fy2_c = map(int, fbox_crop)

        enlarged_face_bbox_in_crop = enlarge_bbox(
            (fx1_c, fy1_c, fx2_c, fy2_c),
            body_crop.shape[1], body_crop.shape[0],
            percentage=0.05
        )
        efx1_c, efy1_c, efx2_c, efy2_c = enlarged_face_bbox_in_crop

        face_crop = body_crop[efy1_c:efy2_c, efx1_c:efx2_c].copy()

        if face_results.masks is not None and len(face_results.masks.data) > best_face_idx:
            fm = face_results.masks.data[best_face_idx].cpu().numpy()
            fm_full = cv2.resize(fm, (body_crop.shape[1], body_crop.shape[0]),
                                 interpolation=cv2.INTER_NEAREST)
            fm_full = (fm_full > 0.5).astype(np.uint8)
            face_mask_crop = fm_full[efy1_c:efy2_c, efx1_c:efx2_c]
        else:
            face_mask_crop = None

        face_present_flag = True

    beauty_scorer_model = beauty_scorer_model.to(device)
    beauty_scorer_model.eval()

    if body_crop.size == 0 or body_crop.shape[0] == 0 or body_crop.shape[1] == 0:
        body_img_t = torch.zeros(1, 3, 224, 224, device=device)
        body_mask_t = torch.zeros(1, 1, 224, 224, device=device)
        body_present = torch.tensor([False], device=device)
    else:
        body_img_pil = Image.fromarray(body_crop)
        body_img_t = image_transform(body_img_pil).unsqueeze(0).to(device)

        body_mask_pil = Image.fromarray((body_mask_crop * 255).astype(np.uint8))
        body_mask_t = mask_transform(body_mask_pil).unsqueeze(0).to(device)
        body_mask_t = (body_mask_t > 0.5).float()
        body_present = torch.tensor([True], device=device)

    if not face_present_flag or face_crop is None or face_crop.size == 0 \
       or face_crop.shape[0] == 0 or face_crop.shape[1] == 0:
        face_img_t = torch.zeros(1, 3, 224, 224, device=device)
        face_mask_t = torch.zeros(1, 1, 224, 224, device=device)
        face_present = torch.tensor([False], device=device)
    else:
        face_img_pil = Image.fromarray(face_crop)
        face_img_t = image_transform(face_img_pil).unsqueeze(0).to(device)

        face_mask_pil = Image.fromarray((face_mask_crop * 255).astype(np.uint8))
        face_mask_t = mask_transform(face_mask_pil).unsqueeze(0).to(device)
        face_mask_t = (face_mask_t > 0.5).float()
        face_present = torch.tensor([True], device=device)

    with torch.no_grad():
        outputs = beauty_scorer_model(
            body_image=body_img_t,
            face_image=face_img_t,
            body_mask=body_mask_t,
            face_mask=face_mask_t,
            body_present=body_present,
            face_present=face_present
        )

    scores_dict, total_score, star_rating = calculate_beauty_scores(
        outputs, num_beauty_classes=num_beauty_classes
    )

    body_bbox_global = (bx1, by1, bx2, by2)

    result_dict = {
        'scores_dict': scores_dict,
        'total_score_0_100': float(total_score),
        'star_rating_0_5': float(star_rating)
    }

    return body_bbox_global, result_dict


def infer_images_sorted_by_score(
    image_paths: List[str],
    body_yolo_model: YOLO,
    face_yolo_model: YOLO,
    beauty_scorer_model: CamelBeautyScorer,
    image_transform,
    mask_transform,
    num_beauty_classes: int = 10,
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
) -> Tuple[List[Tuple[int, int, int, int]], List[Dict[str, Any]]]:
    """
    Run inference on a list of images (no printing/visualization),
    then return:
      - list of body_bbox_global, sorted from highest to lowest total score
      - list of result_dict (same order as bboxes)
    Images where no body is detected are skipped.
    """
    results = []

    for img_path in image_paths:
        bbox, res = infer_single_image(
            image_path=img_path,
            body_yolo_model=body_yolo_model,
            face_yolo_model=face_yolo_model,
            beauty_scorer_model=beauty_scorer_model,
            image_transform=image_transform,
            mask_transform=mask_transform,
            num_beauty_classes=num_beauty_classes,
            device=device
        )
        if bbox is None or res is None:
            continue

        results.append({
            'image_path': img_path,
            'body_bbox': bbox,
            'result': res
        })

    # Sort by total score (descending)
    results_sorted = sorted(
        results,
        key=lambda x: x['result']['total_score_0_100'],
        reverse=True
    )

    bboxes_sorted = [r['body_bbox'] for r in results_sorted]
    results_dicts_sorted = [r['result'] for r in results_sorted]

    return bboxes_sorted, results_dicts_sorted


# ==========================================
# PART 5: GLOBAL MODELS, TRANSFORMS, SETUP
# ==========================================

IMAGE_SIZE = (224, 224)
NUM_BEAUTY_SCORES_CLASSES = 10
NUM_CATEGORY_CLASSES = 2
FEATURE_DIM = 256

image_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

mask_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE, interpolation=transforms.InterpolationMode.NEAREST),
    transforms.ToTensor(),
])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

body_seg_model_path = '/content/runs/segment/train_Body_mosaic_0.6/weights/best.pt'
face_seg_model_path = '/content/runs/segment/train_Face_mosaic_0.6/weights/best.pt'
beauty_scorer_checkpoint_path = '/content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth'

body_yolo_model = YOLO(body_seg_model_path)
face_yolo_model = YOLO(face_seg_model_path)

beauty_scorer_model = CamelBeautyScorer(
    vit_model='google/vit-base-patch16-224',
    feature_dim=FEATURE_DIM,
    num_beauty_scores_classes=NUM_BEAUTY_SCORES_CLASSES,
    num_category_classes=NUM_CATEGORY_CLASSES
)

ckpt = torch.load(beauty_scorer_checkpoint_path, map_location=device)
if 'model_state_dict' in ckpt:
    beauty_scorer_model.load_state_dict(ckpt['model_state_dict'])
else:
    beauty_scorer_model.load_state_dict(ckpt)

beauty_scorer_model.to(device)
beauty_scorer_model.eval()

print(f"Loaded Body_seg YOLO model from: {body_seg_model_path}")
print(f"Loaded Face_seg YOLO model from: {face_seg_model_path}")
print(f"Loaded CamelBeautyScorer model from: {beauty_scorer_checkpoint_path}")
print(f"Models ready on device: {device}")