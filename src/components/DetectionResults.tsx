import { Download, Share2, Sparkles } from 'lucide-react';
import BeautyScoreCard, { StarRating } from './BeautyScoreCard';
import { useLanguage } from '../contexts/LanguageContext';

interface DetectionResult {
  id?: string;
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

interface DetectionResultsProps {
  result: DetectionResult;
  onGenerateRecommendation?: (type: 'care' | 'breeding' | 'health') => void;
  onExport?: (format: 'pdf' | 'json' | 'png') => void;
  onShare?: () => void;
}

export default function DetectionResults({
  result,
  onGenerateRecommendation,
  onExport,
  onShare,
}: DetectionResultsProps) {
  const { t } = useLanguage();

  const getCategoryColor = (category: string) => {
    return category === 'beautiful' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getCategoryBorder = (category: string) => {
    return category === 'beautiful' ? 'border-green-200' : 'border-red-200';
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-sand-50 to-gold-50 rounded-2xl p-8 border border-sand-200 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-brown-800 font-arabic">{t.detection.results}</h2>
          <div className="flex gap-2">
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 bg-white rounded-lg hover:bg-sand-100 transition-colors border border-sand-200"
                title="Share Results"
              >
                <Share2 className="w-5 h-5 text-sand-700" />
              </button>
            )}
            {onExport && (
              <button
                onClick={() => onExport('pdf')}
                className="p-2 bg-white rounded-lg hover:bg-sand-100 transition-colors border border-sand-200"
                title="Export as PDF"
              >
                <Download className="w-5 h-5 text-sand-700" />
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="relative rounded-xl overflow-hidden shadow-lg">
            <img
              src={result.image_url}
              alt="Camel"
              className="w-full h-full object-cover"
            />
            {result.bounding_boxes && result.bounding_boxes.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {result.bounding_boxes.map((box, idx) => (
                  <div
                    key={idx}
                    className="absolute border-2 border-gold-400"
                    style={{
                      left: `${box.x}px`,
                      top: `${box.y}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 bg-gold-400 text-white text-xs px-2 py-1 rounded">
                      {box.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-brown-800 font-arabic">{t.detection.beautyScore}</h3>
                <span className="text-5xl font-bold text-gold-600">
                  {result.overall_score.toFixed(1)}
                </span>
              </div>
              <StarRating score={result.overall_score} />

              <div className={`mt-4 inline-block px-4 py-2 rounded-lg border ${getCategoryBorder(result.category)} ${getCategoryColor(result.category)} font-semibold font-arabic`}>
                {result.category === 'beautiful' ? `✨ ${t.detection.beautiful}` : `⚠️ ${t.detection.ugly}`}
              </div>

              <div className="mt-4 text-sm text-gray-600 font-arabic">
                <span className="font-medium">{t.detection.confidence}:</span> {result.confidence.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-brown-800 mb-4">{t.detection.pdf.quickStats}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t.detection.pdf.highestScore}</p>
                  <p className="text-xl font-bold text-green-600">
                    {Math.max(
                      result.head_beauty_score,
                      result.neck_beauty_score,
                      result.body_hump_limbs_score,
                      result.body_size_score
                    ).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.detection.pdf.lowestScore}</p>
                  <p className="text-xl font-bold text-red-600">
                    {Math.min(
                      result.head_beauty_score,
                      result.neck_beauty_score,
                      result.body_hump_limbs_score,
                      result.body_size_score
                    ).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <BeautyScoreCard
            score={result.head_beauty_score}
            label={t.detection.headBeauty}
            icon={<span className="text-lg">👤</span>}
          />
          <BeautyScoreCard
            score={result.neck_beauty_score}
            label={t.detection.neckBeauty}
            icon={<span className="text-lg">🦒</span>}
          />
          <BeautyScoreCard
            score={result.body_hump_limbs_score}
            label={t.detection.bodyHumpLimbs}
            icon={<span className="text-lg">🐪</span>}
          />
          <BeautyScoreCard
            score={result.body_size_score}
            label={t.detection.bodySize}
            icon={<span className="text-lg">📏</span>}
          />
        </div>

        {onGenerateRecommendation && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-gold-600" />
              <h3 className="text-lg font-semibold text-brown-800 font-arabic">{t.detection.recommendations}</h3>
            </div>
            <p className="text-gray-600 mb-4 font-arabic">
              {t.detection.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onGenerateRecommendation('care')}
                className="px-6 py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-arabic"
              >
                {t.detection.care}
              </button>
              <button
                onClick={() => onGenerateRecommendation('breeding')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-arabic"
              >
                {t.detection.breeding}
              </button>
              <button
                onClick={() => onGenerateRecommendation('health')}
                className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-arabic"
              >
                {t.detection.health}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
