import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import ImageUploadZone from '../components/ImageUploadZone';
import DetectionResults from '../components/DetectionResults';
import RecommendationDisplay from '../components/RecommendationDisplay';
import jsPDF from 'jspdf';

interface DetectionResult {
  id: string;
  overall_score: number;
  head_beauty_score: number;
  neck_beauty_score: number;
  body_hump_limbs_score: number;
  body_size_score: number;
  category: 'beautiful' | 'ugly';
  confidence: number;
  image_url: string;
  bounding_boxes?: any[];
}

export default function CamelDetection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [recommendation, setRecommendation] = useState<{
    text: string;
    type: 'care' | 'breeding' | 'health';
  } | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setError('');
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = user ? `${user.id}/${fileName}` : `anonymous/${fileName}`;

    const { data, error } = await supabase.storage
      .from('camel-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('camel-images')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const detectCamelBeauty = async (file: File, imageUrl: string): Promise<DetectionResult> => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-camel-aws?mode=single`;
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Detection failed. Please try again.');
    }

    const data = await response.json();

    if (!data.success || !data.results) {
      throw new Error('Invalid response from detection service');
    }

    const scores = data.results.scores_dict;
    const detectionId = `detection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result: DetectionResult = {
      id: detectionId,
      overall_score: data.results.total_score_0_100,
      head_beauty_score: scores.head_beauty_score.score_0_100,
      neck_beauty_score: scores.neck_beauty_score.score_0_100,
      body_hump_limbs_score: scores.body_limb_hump_beauty_score.score_0_100,
      body_size_score: scores.body_size_beauty_score.score_0_100,
      category: scores.category_encoded.predicted_label.toLowerCase() as 'beautiful' | 'ugly',
      confidence: scores.category_encoded.probs[scores.category_encoded.predicted_class] * 100,
      image_url: imageUrl,
      bounding_boxes: data.body_bbox ? [{ type: 'body', coords: data.body_bbox }] : [],
    };

    if (user) {
      try {
        const { error: dbError } = await supabase
          .from('camel_detections')
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
          console.error('Failed to save detection to database:', dbError);
        }
      } catch (err) {
        console.error('Database save error:', err);
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
    setCurrentStep('processing');
    setError('');

    try {
      const results: DetectionResult[] = [];

      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const imageUrl = await uploadImageToStorage(file);
        const result = await detectCamelBeauty(file, imageUrl);
        results.push(result);
      } else {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-camel-aws?mode=batch`;
        const formData = new FormData();

        const uploadedUrls: string[] = [];
        for (const file of selectedFiles) {
          const imageUrl = await uploadImageToStorage(file);
          uploadedUrls.push(imageUrl);
          formData.append('images', file);
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Batch detection failed. Please try again.');
        }

        const data = await response.json();

        console.log('Batch response data:', data);

        if (!data.success) {
          throw new Error(data.error || 'Detection failed');
        }

        if (!data.items || !Array.isArray(data.items)) {
          console.error('Invalid batch response structure:', data);
          throw new Error('Invalid response from detection service. Please check console for details.');
        }

        data.items.forEach((item: any, index: number) => {
          const scores = item.results.scores_dict;
          const detectionId = `detection_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;

          const result: DetectionResult = {
            id: detectionId,
            overall_score: item.results.total_score_0_100,
            head_beauty_score: scores.head_beauty_score.score_0_100,
            neck_beauty_score: scores.neck_beauty_score.score_0_100,
            body_hump_limbs_score: scores.body_limb_hump_beauty_score.score_0_100,
            body_size_score: scores.body_size_beauty_score.score_0_100,
            category: scores.category_encoded.predicted_label.toLowerCase() as 'beautiful' | 'ugly',
            confidence: scores.category_encoded.probs[scores.category_encoded.predicted_class] * 100,
            image_url: uploadedUrls[index],
            bounding_boxes: item.body_bbox ? [{ type: 'body', coords: item.body_bbox }] : [],
          };

          results.push(result);

          if (user) {
            supabase
              .from('camel_detections')
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
                  console.error('Failed to save detection to database:', dbError);
                }
              });
          }
        });
      }

      setDetectionResults(results);
      setCurrentStep('results');
      setCurrentResultIndex(0);
    } catch (err: any) {
      console.error('Detection error:', err);
      setError(err.message || 'Failed to process images. Please try again.');
      setCurrentStep('upload');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateRecommendation = async (type: 'care' | 'breeding' | 'health') => {
    const currentResult = detectionResults[currentResultIndex];
    if (!currentResult) return;

    setLoadingRecommendation(true);
    setRecommendation(null);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-camel-recommendations`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          detectionId: currentResult.id,
          recommendationType: type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendation');
      }

      const data = await response.json();
      setRecommendation({
        text: data.recommendation,
        type,
      });
    } catch (err: any) {
      console.error('Recommendation error:', err);
      setError('Failed to generate recommendation. Please try again.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'json' | 'png') => {
    const currentResult = detectionResults[currentResultIndex];
    if (!currentResult) return;

    if (format === 'pdf') {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      pdf.setFontSize(22);
      pdf.setTextColor(101, 67, 33);
      pdf.text('Camel Beauty Detection Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Detection ID: ${currentResult.id}`, pageWidth / 2, yPosition, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });
      yPosition += 20;

      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = currentResult.image_url;
        });

        const imgWidth = 80;
        const imgHeight = (img.height / img.width) * imgWidth;
        const imgX = (pageWidth - imgWidth) / 2;
        pdf.addImage(img, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      } catch (error) {
        console.error('Failed to add image to PDF:', error);
        yPosition += 10;
      }

      pdf.setFillColor(212, 175, 55);
      pdf.rect(15, yPosition, pageWidth - 30, 40, 'F');

      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Overall Beauty Score', 20, yPosition + 12);

      pdf.setFontSize(32);
      pdf.text(currentResult.overall_score.toFixed(1), pageWidth - 25, yPosition + 28, { align: 'right' });

      const stars = Math.round((currentResult.overall_score / 100) * 5);
      pdf.setFontSize(20);
      pdf.text('★'.repeat(stars) + '☆'.repeat(5 - stars), 20, yPosition + 32);
      yPosition += 50;

      if (currentResult.category === 'beautiful') {
        pdf.setFillColor(16, 185, 129);
      } else {
        pdf.setFillColor(239, 68, 68);
      }
      pdf.roundedRect(15, yPosition, 80, 12, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        currentResult.category === 'beautiful' ? '✨ Beautiful' : '⚠️ Needs Improvement',
        20,
        yPosition + 8
      );

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Confidence: ${currentResult.confidence.toFixed(1)}%`, 100, yPosition + 8);
      yPosition += 25;

      pdf.setFontSize(14);
      pdf.setTextColor(101, 67, 33);
      pdf.text('Detailed Beauty Scores', 15, yPosition);
      yPosition += 10;

      const scores = [
        { label: 'Head Beauty', value: currentResult.head_beauty_score, icon: '👤' },
        { label: 'Neck Beauty', value: currentResult.neck_beauty_score, icon: '🦒' },
        { label: 'Body, Hump & Limbs', value: currentResult.body_hump_limbs_score, icon: '🐪' },
        { label: 'Body Size', value: currentResult.body_size_score, icon: '📏' },
      ];

      scores.forEach((score, index) => {
        const boxY = yPosition + (index * 20);

        pdf.setFillColor(250, 245, 235);
        pdf.roundedRect(15, boxY, pageWidth - 30, 15, 2, 2, 'F');

        pdf.setDrawColor(210, 180, 140);
        pdf.roundedRect(15, boxY, pageWidth - 30, 15, 2, 2, 'S');

        pdf.setFontSize(11);
        pdf.setTextColor(101, 67, 33);
        pdf.text(`${score.icon} ${score.label}`, 20, boxY + 10);

        pdf.setFontSize(14);
        pdf.setTextColor(212, 175, 55);
        pdf.text(score.value.toFixed(1), pageWidth - 25, boxY + 10, { align: 'right' });
      });
      yPosition += 90;

      const maxScore = Math.max(
        currentResult.head_beauty_score,
        currentResult.neck_beauty_score,
        currentResult.body_hump_limbs_score,
        currentResult.body_size_score
      );
      const minScore = Math.min(
        currentResult.head_beauty_score,
        currentResult.neck_beauty_score,
        currentResult.body_hump_limbs_score,
        currentResult.body_size_score
      );

      pdf.setFontSize(12);
      pdf.setTextColor(101, 67, 33);
      pdf.text('Quick Statistics', 15, yPosition);
      yPosition += 8;

      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(15, yPosition, (pageWidth - 35) / 2, 20, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Highest Score', 20, yPosition + 8);
      pdf.setFontSize(16);
      pdf.setTextColor(34, 197, 94);
      pdf.text(maxScore.toFixed(1), 20, yPosition + 16);

      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect((pageWidth / 2) + 2.5, yPosition, (pageWidth - 35) / 2, 20, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Lowest Score', (pageWidth / 2) + 7.5, yPosition + 8);
      pdf.setFontSize(16);
      pdf.setTextColor(239, 68, 68);
      pdf.text(minScore.toFixed(1), (pageWidth / 2) + 7.5, yPosition + 16);

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        'This report was generated by the Camel Beauty Detection System',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      pdf.save(`camel-detection-${currentResult.id}.pdf`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brown-700 hover:text-brown-900 mb-6 md:mb-8 transition-colors font-arabic text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
          {t.common.back}
        </button>

        <div className="mb-8 md:mb-12 text-center">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Sparkles className="w-8 sm:w-10 h-8 sm:h-10 text-gold-600" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brown-800 font-arabic">{t.detection.title}</h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-sand-700 max-w-2xl mx-auto font-arabic px-4">
            {t.detection.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 md:mb-8 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center text-sm md:text-base">{error}</p>
          </div>
        )}

        {currentStep === 'upload' && (
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

        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
            <Loader2 className="w-12 sm:w-16 h-12 sm:h-16 text-gold-600 animate-spin mb-4 md:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-brown-800 mb-2 font-arabic text-center">{t.detection.processing}</h2>
            <p className="text-sm sm:text-base text-sand-700 font-arabic text-center">{t.detection.processingHint}</p>
          </div>
        )}

        {currentStep === 'results' && detectionResults.length > 0 && (
          <div className="space-y-8">
            {detectionResults.length > 1 && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-brown-800 font-arabic">
                    {t.detection.resultOf
                      .replace('{current}', String(currentResultIndex + 1))
                      .replace('{total}', String(detectionResults.length))}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentResultIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentResultIndex === 0}
                      className="px-4 py-2 bg-sand-200 text-brown-700 rounded-lg hover:bg-sand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-arabic"
                    >
                      {t.detection.previous}
                    </button>
                    <button
                      onClick={() => setCurrentResultIndex(prev => Math.min(detectionResults.length - 1, prev + 1))}
                      disabled={currentResultIndex === detectionResults.length - 1}
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
                        ${idx === currentResultIndex
                          ? 'border-gold-500 ring-2 ring-gold-200'
                          : 'border-gray-200 hover:border-sand-400'
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
                  setCurrentStep('upload');
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
  );
}
