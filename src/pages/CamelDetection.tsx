import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import ImageUploadZone from '../components/ImageUploadZone';
import DetectionResults from '../components/DetectionResults';
import RecommendationDisplay from '../components/RecommendationDisplay';

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

  const detectCamelBeauty = async (imageUrl: string) => {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-camel-beauty`;
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
        imageUrl,
        saveToDatabase: true,
        isPublic: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Detection failed');
    }

    const data = await response.json();
    return data.saved;
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

      for (const file of selectedFiles) {
        const imageUrl = await uploadImageToStorage(file);
        const result = await detectCamelBeauty(imageUrl);
        results.push(result);
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

  const handleExport = (format: 'pdf' | 'json' | 'png') => {
    const currentResult = detectionResults[currentResultIndex];
    if (!currentResult) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(currentResult, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `camel-detection-${currentResult.id}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brown-700 hover:text-brown-900 mb-8 transition-colors font-arabic"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.common.back}
        </button>

        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-gold-600" />
            <h1 className="text-4xl font-bold text-brown-800 font-arabic">{t.detection.title}</h1>
          </div>
          <p className="text-lg text-sand-700 max-w-2xl mx-auto font-arabic">
            {t.detection.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {currentStep === 'upload' && (
          <div className="space-y-8">
            <ImageUploadZone onFilesSelected={handleFilesSelected} />

            {selectedFiles.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleStartDetection}
                  disabled={processing}
                  className="px-12 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-lg font-semibold rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-arabic"
                >
                  {t.detection.startDetection}
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-gold-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-brown-800 mb-2 font-arabic">{t.detection.processing}</h2>
            <p className="text-sand-700 font-arabic">{t.detection.processingHint}</p>
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

                <div className="mt-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
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
