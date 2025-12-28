import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Evaluation, CamelImage, Camel } from '../lib/supabase';
import { ArrowLeft, Eye, EyeOff, Download } from 'lucide-react';

interface EvaluationDetails {
  regions: {
    [key: string]: {
      score: number;
      confidence: number;
      features: string[];
      explanation: string;
    };
  };
  segmentationMask?: string;
  attentionMap?: string;
  processingSteps?: string[];
}

function EvaluationReportContent() {
  const { evaluationId } = useParams();
  const { t, isRTL } = useLanguage();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [image, setImage] = useState<CamelImage | null>(null);
  const [camel, setCamel] = useState<Camel | null>(null);
  const [details, setDetails] = useState<EvaluationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [showAttention, setShowAttention] = useState(false);

  useEffect(() => {
    if (evaluationId) {
      fetchData();
    }
  }, [evaluationId]);

  const fetchData = async () => {
    try {
      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', evaluationId)
        .maybeSingle();

      if (evalData) {
        setEvaluation(evalData);

        if (evalData.notes) {
          try {
            const parsedDetails = JSON.parse(evalData.notes);
            setDetails(parsedDetails);
          } catch (e) {
            console.error('Error parsing evaluation details:', e);
          }
        }

        const [imageResult, camelResult] = await Promise.all([
          supabase.from('camel_images').select('*').eq('id', evalData.image_id).maybeSingle(),
          supabase.from('camels').select('*').eq('id', evalData.camel_id).maybeSingle(),
        ]);

        if (imageResult.data) setImage(imageResult.data);
        if (camelResult.data) setCamel(camelResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const regionWeights = {
    head: 0.2,
    neck: 0.2,
    hump: 0.25,
    body: 0.2,
    legs: 0.15,
  };

  const handleDownloadPDF = () => {
    alert(t.evaluations.downloadReport + ' - ' + t.common.loading);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-arabic">{t.common.loading}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!evaluation || !image || !camel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600 font-arabic">{t.common.noData}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link
            to={`/camels/${evaluation.camel_id}`}
            className={`flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t.common.back}
          </Link>

          <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h1 className="text-4xl font-bold mb-2 font-arabic">{t.evaluations.detailedReport}</h1>
            <p className="text-gray-600 font-arabic">
              {camel.name} • {new Date(evaluation.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h2 className="text-2xl font-bold font-arabic">{t.evaluations.title}</h2>
                  <button
                    onClick={handleDownloadPDF}
                    className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Download className="w-5 h-5" />
                    {t.evaluations.downloadReport}
                  </button>
                </div>

                <div className="relative">
                  <img
                    src={image.image_url}
                    alt="Camel"
                    className="w-full rounded-lg"
                  />

                  {showSegmentation && details?.segmentationMask && (
                    <img
                      src={details.segmentationMask}
                      alt="Segmentation"
                      className="absolute top-0 left-0 w-full h-full rounded-lg opacity-60"
                    />
                  )}

                  {showAttention && details?.attentionMap && (
                    <img
                      src={details.attentionMap}
                      alt="Attention"
                      className="absolute top-0 left-0 w-full h-full rounded-lg opacity-50"
                    />
                  )}
                </div>

                <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setShowSegmentation(!showSegmentation)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-arabic ${
                      showSegmentation
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    {showSegmentation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showSegmentation ? t.evaluations.hideOverlay : t.evaluations.showSegmentation}
                  </button>
                  <button
                    onClick={() => setShowAttention(!showAttention)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-arabic ${
                      showAttention
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    {showAttention ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showAttention ? t.evaluations.hideOverlay : t.evaluations.showAttention}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.evaluations.regionAnalysis}
                </h2>

                <div className="space-y-6">
                  {['head', 'neck', 'hump', 'body', 'legs'].map((region) => {
                    const regionDetails = details?.regions?.[region];
                    const score = evaluation[`${region}_score` as keyof Evaluation] as number;
                    const weight = regionWeights[region as keyof typeof regionWeights];

                    return (
                      <div key={region} className="border-b pb-6 last:border-b-0">
                        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <h3 className="text-xl font-bold font-arabic">
                            {t.evaluations[region as keyof typeof t.evaluations]}
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.score}</p>
                              <p className="text-2xl font-bold text-blue-600">{score}</p>
                            </div>
                            <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.weight}</p>
                              <p className="text-lg font-semibold">{(weight * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>

                        {regionDetails && (
                          <>
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                            </div>

                            <p className={`text-gray-700 mb-3 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                              {regionDetails.explanation}
                            </p>

                            {regionDetails.confidence && (
                              <p className={`text-sm text-gray-600 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t.evaluations.confidence}: {(regionDetails.confidence * 100).toFixed(0)}%
                              </p>
                            )}

                            {regionDetails.features && regionDetails.features.length > 0 && (
                              <div className={isRTL ? 'text-right' : 'text-left'}>
                                <p className="text-sm font-semibold text-gray-700 mb-2 font-arabic">
                                  {t.evaluations.features}:
                                </p>
                                <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                  {regionDetails.features.map((feature, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-arabic"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {details?.processingSteps && details.processingSteps.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className={`text-2xl font-bold mb-4 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.evaluations.processingSteps}
                  </h2>
                  <ul className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {details.processingSteps.map((step, idx) => (
                      <li key={idx} className={`flex items-center gap-2 text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className={`text-xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.evaluations.overallScore}
                </h2>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4">
                    <span className="text-5xl font-bold">{evaluation.overall_score}</span>
                  </div>
                  <p className="text-gray-600 font-arabic">{t.evaluations.overallScore}</p>
                </div>

                <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-arabic">{t.evaluations.head}</span>
                    <span className="font-semibold">{evaluation.head_score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-arabic">{t.evaluations.neck}</span>
                    <span className="font-semibold">{evaluation.neck_score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-arabic">{t.evaluations.hump}</span>
                    <span className="font-semibold">{evaluation.hump_score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-arabic">{t.evaluations.body}</span>
                    <span className="font-semibold">{evaluation.body_score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-arabic">{t.evaluations.legs}</span>
                    <span className="font-semibold">{evaluation.legs_score}</span>
                  </div>
                </div>

                <div className={`mt-6 pt-6 border-t ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-gray-600 font-arabic mb-1">
                    {t.evaluations.evaluatedAt}
                  </p>
                  <p className="text-sm font-semibold">
                    {new Date(evaluation.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function EvaluationReport() {
  return (
    <ProtectedRoute>
      <EvaluationReportContent />
    </ProtectedRoute>
  );
}
