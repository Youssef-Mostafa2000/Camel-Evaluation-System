import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";
import { translations } from "../lib/translations";
import { Layout } from "../components/Layout";
import ImageUploadZone from "../components/ImageUploadZone";
import DetectionResults from "../components/DetectionResults";
import RecommendationDisplay from "../components/RecommendationDisplay";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DetectionResult {
  id: string;
  overall_score: number;
  head_beauty_score: number;
  neck_beauty_score: number;
  body_hump_limbs_score: number;
  body_size_score: number;
  category: "beautiful" | "ugly";
  confidence: number;
  image_url: string;
  bounding_boxes?: any[];
}

export default function CamelDetection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "processing" | "results"
  >("upload");
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [recommendation, setRecommendation] = useState<{
    text: string;
    type: "care" | "breeding" | "health";
  } | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setError("");
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = user ? `${user.id}/${fileName}` : `anonymous/${fileName}`;

    const { data, error } = await supabase.storage
      .from("camel-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("camel-images").getPublicUrl(data.path);

    return publicUrl;
  };

  const detectCamelBeauty = async (
    file: File,
    imageUrl: string
  ): Promise<DetectionResult> => {
    const apiUrl = `${
      import.meta.env.VITE_SUPABASE_URL
    }/functions/v1/detect-camel-aws?mode=single`;
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(t.detection.errors.detectionFailed);
    }

    const data = await response.json();

    if (!data.success || !data.results) {
      throw new Error(t.detection.errors.invalidResponse);
    }

    const scores = data.results.scores_dict;
    const detectionId = `detection_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const result: DetectionResult = {
      id: detectionId,
      overall_score: data.results.total_score_0_100,
      head_beauty_score: scores.head_beauty_score.score_0_100,
      neck_beauty_score: scores.neck_beauty_score.score_0_100,
      body_hump_limbs_score: scores.body_limb_hump_beauty_score.score_0_100,
      body_size_score: scores.body_size_beauty_score.score_0_100,
      category: scores.category_encoded.predicted_label.toLowerCase() as
        | "beautiful"
        | "ugly",
      confidence:
        scores.category_encoded.probs[scores.category_encoded.predicted_class] *
        100,
      image_url: imageUrl,
      bounding_boxes: data.body_bbox
        ? [{ type: "body", coords: data.body_bbox }]
        : [],
    };

    if (user) {
      try {
        const { error: dbError } = await supabase
          .from("camel_detections")
          .insert({
            user_id: user.id,
            overall_score: result.overall_score,
            head_beauty_score: result.head_beauty_score,
            neck_beauty_score: result.neck_beauty_score,
            body_hump_limbs_score: result.body_hump_limbs_score,
            body_size_score: result.body_size_score,
            category: result.category,
            confidence: result.confidence,
            image_url: result.image_url,
            bounding_boxes: result.bounding_boxes,
          });

        if (dbError) {
          console.error("Failed to save detection to database:", dbError);
        }
      } catch (err) {
        console.error("Database save error:", err);
      }
    }

    return result;
  };

  const handleStartDetection = async () => {
    if (selectedFiles.length === 0) {
      setError(t.detection.selectImages);
      return;
    }

    setProcessing(true);
    setCurrentStep("processing");
    setError("");

    try {
      const results: DetectionResult[] = [];

      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const imageUrl = await uploadImageToStorage(file);
        const result = await detectCamelBeauty(file, imageUrl);
        results.push(result);
      } else {
        const apiUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/detect-camel-aws?mode=batch`;
        const formData = new FormData();

        const uploadedUrls: string[] = [];
        for (const file of selectedFiles) {
          const imageUrl = await uploadImageToStorage(file);
          uploadedUrls.push(imageUrl);
          formData.append("images", file);
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(t.detection.errors.batchFailed);
        }

        const data = await response.json();

        console.log("Batch response data:", data);

        if (!data.success) {
          throw new Error(data.error || t.detection.errors.detectionFailed);
        }

        if (!data.items || !Array.isArray(data.items)) {
          console.error("Invalid batch response structure:", data);
          throw new Error(t.detection.errors.invalidResponse);
        }

        data.items.forEach((item: any, index: number) => {
          const scores = item.results.scores_dict;
          const detectionId = `detection_${Date.now()}_${index}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const result: DetectionResult = {
            id: detectionId,
            overall_score: item.results.total_score_0_100,
            head_beauty_score: scores.head_beauty_score.score_0_100,
            neck_beauty_score: scores.neck_beauty_score.score_0_100,
            body_hump_limbs_score:
              scores.body_limb_hump_beauty_score.score_0_100,
            body_size_score: scores.body_size_beauty_score.score_0_100,
            category: scores.category_encoded.predicted_label.toLowerCase() as
              | "beautiful"
              | "ugly",
            confidence:
              scores.category_encoded.probs[
                scores.category_encoded.predicted_class
              ] * 100,
            image_url: uploadedUrls[index],
            bounding_boxes: item.body_bbox
              ? [{ type: "body", coords: item.body_bbox }]
              : [],
          };

          results.push(result);

          if (user) {
            supabase
              .from("camel_detections")
              .insert({
                user_id: user.id,
                overall_score: result.overall_score,
                head_beauty_score: result.head_beauty_score,
                neck_beauty_score: result.neck_beauty_score,
                body_hump_limbs_score: result.body_hump_limbs_score,
                body_size_score: result.body_size_score,
                category: result.category,
                confidence: result.confidence,
                image_url: result.image_url,
                bounding_boxes: result.bounding_boxes,
              })
              .then(({ error: dbError }) => {
                if (dbError) {
                  console.error(
                    "Failed to save detection to database:",
                    dbError
                  );
                }
              });
          }
        });
      }

      const sortedResults = results.sort(
        (a, b) => b.overall_score - a.overall_score
      );

      setDetectionResults(sortedResults);
      setCurrentStep("results");
      setCurrentResultIndex(0);
    } catch (err: any) {
      console.error("Detection error:", err);
      setError(err.message || t.detection.errors.processingFailed);
      setCurrentStep("upload");
    } finally {
      setProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return { bg: "#DCFCE7", text: "#22C55E", border: "#BBF7D0" };
    if (score >= 60)
      return { bg: "#FEF3C7", text: "#EAB308", border: "#FDE68A" };
    return { bg: "#FEE2E2", text: "#EF4444", border: "#FECACA" };
  };

  const getScoreGrade = (score: number, lang: string = "en") => {
    if (lang === "ar") {
      if (score >= 90) return "استثنائي";
      if (score >= 80) return "ممتاز";
      if (score >= 70) return "جيد جداً";
      if (score >= 60) return "جيد";
      if (score >= 50) return "مقبول";
      return "يحتاج تحسين";
    } else {
      if (score >= 90) return "Exceptional";
      if (score >= 80) return "Excellent";
      if (score >= 70) return "Very Good";
      if (score >= 60) return "Good";
      if (score >= 50) return "Fair";
      return "Needs Improvement";
    }
  };

  const handleGenerateRecommendation = async (
    type: "care" | "breeding" | "health"
  ) => {
    const currentResult = detectionResults[currentResultIndex];
    if (!currentResult) return;

    setLoadingRecommendation(true);
    setRecommendation(null);

    try {
      const functionUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/generate-camel-recommendations`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          detectionId: currentResult.id,
          recommendationType: type,
        }),
      });

      if (!response.ok) {
        throw new Error(t.detection.errors.recommendationFailed);
      }

      const data = await response.json();
      setRecommendation({
        text: data.recommendation,
        type,
      });
    } catch (err: any) {
      console.error("Recommendation error:", err);
      setError(t.detection.errors.recommendationFailed);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const generateStyledPDF = async (
    sortedResults: DetectionResult[],
    language: "ar" | "en"
  ) => {
    const pdf = new jsPDF("p", "mm", "a4");

    const isArabic = language === "ar";
    const direction = isArabic ? "rtl" : "ltr";
    const scoreFloat = isArabic ? "left" : "right";

    for (let i = 0; i < sortedResults.length; i++) {
      const result = sortedResults[i];
      const ranking = i + 1;

      if (i > 0) pdf.addPage();

      // ---- Hidden container ----
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.padding = "40px";
      container.style.backgroundColor = "#ffffff";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.direction = direction;

      document.body.appendChild(container);

      const headColor = getScoreColor(result.head_beauty_score);
      const neckColor = getScoreColor(result.neck_beauty_score);
      const bodyColor = getScoreColor(result.body_hump_limbs_score);
      const sizeColor = getScoreColor(result.body_size_score);

      const maxScore = Math.max(
        result.head_beauty_score,
        result.neck_beauty_score,
        result.body_hump_limbs_score,
        result.body_size_score
      );

      const minScore = Math.min(
        result.head_beauty_score,
        result.neck_beauty_score,
        result.body_hump_limbs_score,
        result.body_size_score
      );

      container.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
          <h1 style="color:#654321; font-size:32px; margin-bottom:10px;">
            ${t.detection.pdf.reportTitle}
          </h1>
          <div style="color:#D4AF37; font-size:18px;">
            ${t.detection.ranking
              .replace("{rank}", String(ranking))
              .replace("{total}", String(sortedResults.length))}
          </div>
        </div>
  
        <div style="display:flex; justify-content:center; margin-bottom:30px;">
          <img src="${result.image_url}"
               crossorigin="anonymous"
               style="max-width:400px; max-height:300px; border-radius:8px;" />
        </div>
  
        <div style="
          background:linear-gradient(135deg,#D4AF37,#C4A028);
          padding:20px;
          border-radius:8px;
          text-align:center;
          margin-bottom:30px;
        ">
          <div style="color:white; font-size:20px; margin-bottom: 10px;">
            ${t.detection.pdf.overallScore}
          </div>
          <div style="color:white; font-size:48px; font-weight:bold;">
            ${Math.round(result.overall_score)}
          </div>
          ${Array.from(
            { length: 5 },
            (_, i) => `
              <span style="font-size:24px; color:white;">
                ${i < Math.round((result.overall_score / 100) * 5) ? "★" : "☆"}
              </span>
            `
          ).join("")}
        </div>
  
        <div style="
          background:${result.category === "beautiful" ? "#10B981" : "#EF4444"};
          color:white;
          padding:12px 20px;
          border-radius:8px;
          display:inline-block;
          width:fit-content;
          margin:0 auto 20px auto;
          text-align:center;
        ">
          ${
            result.category === "beautiful"
              ? "✨ " + t.detection.beautiful
              : "⚠️ " + t.detection.pdf.needsImprovement
          }
        </div>
  
        <span style="margin-${
          isArabic ? "right" : "left"
        }:20px; color:#666; font-size:14px;">
          ${t.detection.confidence}: ${Math.round(result.confidence)}%
        </span>
  
        <h2 style="color:#654321; font-size: 20px; margin:30px 0 15px;">
          ${t.detection.pdf.detailedScores}
        </h2>
  
        ${[
          {
            label: t.detection.headBeauty,
            value: result.head_beauty_score,
            icon: "👤",
            color: headColor,
          },
          {
            label: t.detection.neckBeauty,
            value: result.neck_beauty_score,
            icon: "🦒",
            color: neckColor,
          },
          {
            label: t.detection.bodyHumpLimbs,
            value: result.body_hump_limbs_score,
            icon: "🐪",
            color: bodyColor,
          },
          {
            label: t.detection.bodySize,
            value: result.body_size_score,
            icon: "📏",
            color: sizeColor,
          },
        ]
          .map(
            (s) => `
          <div style="
            margin-bottom:15px;
            background:${s.color.bg};
            padding:15px;
            border-radius:8px;
            border:2px solid ${s.color.border};
          ">
            <span style="font-size:16px;">
              ${s.icon} ${s.label}
            </span>
            <span style="
              float:${scoreFloat};
              font-size:20px;
              font-weight:bold;
              color:${s.color.text};
            ">
              ${s.value}
            </span>
            <div style="clear:both; margin-top: 5px; font-size:14px; color:#666;">
              ${getScoreGrade(s.value, language)}
            </div>
          </div>
        `
          )
          .join("")}
  
        <h3 style="color:#654321; font-size: 18px; margin:30px 0 15px;">
          ${t.detection.pdf.quickStats}
        </h3>
  
        <div style="display:flex; gap:20px; margin-bottom: 40px;">
          <div style="flex:1; background:${
            getScoreColor(maxScore).bg
          }; padding:15px; border-radius:8px;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${
              t.detection.pdf.highestScore
            }</div>
            <div style=" color: ${(() => {
              const max = Math.max(
                result.head_beauty_score,
                result.neck_beauty_score,
                result.body_hump_limbs_score,
                result.body_size_score
              );
              return getScoreColor(max).text;
            })()}; font-size:24px; font-weight:bold;">
              ${maxScore}
            </div>
            <div style="color: #666; font-size: 12px; margin-top: 5px;">${getScoreGrade(
              maxScore,
              language
            )}</div>
          </div>
  
          <div style="flex:1; background:${
            getScoreColor(minScore).bg
          }; padding:15px; border-radius:8px;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${
              t.detection.pdf.lowestScore
            }</div>
            <div style="color: ${(() => {
              const min = Math.min(
                result.head_beauty_score,
                result.neck_beauty_score,
                result.body_hump_limbs_score,
                result.body_size_score
              );
              return getScoreColor(min).text;
            })()}; font-size: 24px; font-weight: bold;">
              ${minScore}
            </div>
            <div style="color: #666; font-size: 12px; margin-top: 5px;">${getScoreGrade(
              minScore,
              language
            )}</div>
          </div>
        </div>
  
        <div style="text-align:center; color:#999; font-size:12px; margin-top:40px;">
          ${t.detection.pdf.generatedBy}
        </div>
      `;

      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        const scaledHeight = pageHeight;
        const scaledWidth = (canvas.width * pageHeight) / canvas.height;
        const xOffset = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, "PNG", xOffset, 0, scaledWidth, scaledHeight);
      }
    }

    pdf.save(`camel-detection-${language}-${Date.now()}.pdf`);
  };

  const handleExport = async (format: "pdf" | "json" | "png") => {
    if (format !== "pdf") return;

    const sortedResults = [...detectionResults].sort(
      (a, b) => b.overall_score - a.overall_score
    );

    await generateStyledPDF(sortedResults, language);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
          <div className="mb-8 md:mb-12 text-center">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Sparkles className="w-8 sm:w-10 h-8 sm:h-10 text-gold-600" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brown-800 font-arabic">
                {t.detection.title}
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-sand-700 max-w-2xl mx-auto font-arabic px-4">
              {t.detection.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 md:mb-8 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-center text-sm md:text-base">
                {error}
              </p>
            </div>
          )}

          {currentStep === "upload" && (
            <div className="space-y-6 md:space-y-8">
              <ImageUploadZone onFilesSelected={handleFilesSelected} />

              {selectedFiles.length > 0 && (
                <div className="flex justify-center px-4">
                  <button
                    onClick={handleStartDetection}
                    disabled={processing}
                    className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-arabic"
                  >
                    {t.detection.startDetection}
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
              <Loader2 className="w-12 sm:w-16 h-12 sm:h-16 text-gold-600 animate-spin mb-4 md:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-brown-800 mb-2 font-arabic text-center">
                {t.detection.processing}
              </h2>
              <p className="text-sm sm:text-base text-sand-700 font-arabic text-center">
                {t.detection.processingHint}
              </p>
            </div>
          )}

          {currentStep === "results" && detectionResults.length > 0 && (
            <div className="space-y-8">
              {detectionResults.length > 1 && (
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-brown-800 font-arabic">
                      {t.detection.resultOf
                        .replace("{current}", String(currentResultIndex + 1))
                        .replace("{total}", String(detectionResults.length))}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentResultIndex((prev) => Math.max(0, prev - 1))
                        }
                        disabled={currentResultIndex === 0}
                        className="px-4 py-2 bg-sand-200 text-brown-700 rounded-lg hover:bg-sand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-arabic"
                      >
                        {t.detection.previous}
                      </button>
                      <button
                        onClick={() =>
                          setCurrentResultIndex((prev) =>
                            Math.min(detectionResults.length - 1, prev + 1)
                          )
                        }
                        disabled={
                          currentResultIndex === detectionResults.length - 1
                        }
                        className="px-4 py-2 bg-sand-200 text-brown-700 rounded-lg hover:bg-sand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-arabic"
                      >
                        {t.detection.next}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {detectionResults.map((result, idx) => (
                      <button
                        key={result.id}
                        onClick={() => setCurrentResultIndex(idx)}
                        className={`
                        aspect-square rounded-lg overflow-hidden border-2 transition-all
                        ${
                          idx === currentResultIndex
                            ? "border-gold-500 ring-2 ring-gold-200"
                            : "border-gray-200 hover:border-sand-400"
                        }
                      `}
                      >
                        <img
                          src={result.image_url}
                          alt={`Result ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <DetectionResults
                result={detectionResults[currentResultIndex]}
                onGenerateRecommendation={handleGenerateRecommendation}
                onExport={handleExport}
              />

              {loadingRecommendation && (
                <RecommendationDisplay
                  recommendation=""
                  type="care"
                  loading={true}
                />
              )}

              {recommendation && (
                <RecommendationDisplay
                  recommendation={recommendation.text}
                  type={recommendation.type}
                  onClose={() => setRecommendation(null)}
                />
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setCurrentStep("upload");
                    setDetectionResults([]);
                    setSelectedFiles([]);
                    setRecommendation(null);
                    setCurrentResultIndex(0);
                  }}
                  className="px-8 py-3 bg-white text-brown-700 rounded-xl border-2 border-sand-300 hover:bg-sand-50 transition-colors font-medium font-arabic"
                >
                  {t.detection.analyzeMore}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
