import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Camel, Evaluation } from '../lib/supabase';
import { ArrowLeft, TrendingUp, AlertTriangle, Award } from 'lucide-react';

interface EvaluationWithType extends Evaluation {
  evaluation_type: 'ai' | 'expert';
}

function CamelAnalyticsContent() {
  const { id } = useParams();
  const { t, isRTL } = useLanguage();
  const [camel, setCamel] = useState<Camel | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationWithType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [camelResult, evaluationsResult] = await Promise.all([
        supabase.from('camels').select('*').eq('id', id).maybeSingle(),
        supabase.from('evaluations').select('*').eq('camel_id', id).order('created_at', { ascending: true }),
      ]);

      if (camelResult.data) setCamel(camelResult.data);
      if (evaluationsResult.data) setEvaluations(evaluationsResult.data as EvaluationWithType[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  if (!camel || evaluations.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600 font-arabic">{t.analytics.noData}</p>
        </div>
      </Layout>
    );
  }

  const aiEvaluations = evaluations.filter((e) => e.evaluation_type === 'ai');
  const expertEvaluations = evaluations.filter((e) => e.evaluation_type === 'expert');

  const avgScore = evaluations.reduce((sum, e) => sum + e.overall_score, 0) / evaluations.length;
  const bestScore = Math.max(...evaluations.map((e) => e.overall_score));
  const latestScore = evaluations[evaluations.length - 1].overall_score;
  const firstScore = evaluations[0].overall_score;
  const improvement = latestScore - firstScore;

  const regionAverages = {
    head: evaluations.reduce((sum, e) => sum + e.head_score, 0) / evaluations.length,
    neck: evaluations.reduce((sum, e) => sum + e.neck_score, 0) / evaluations.length,
    hump: evaluations.reduce((sum, e) => sum + e.hump_score, 0) / evaluations.length,
    body: evaluations.reduce((sum, e) => sum + e.body_score, 0) / evaluations.length,
    legs: evaluations.reduce((sum, e) => sum + e.legs_score, 0) / evaluations.length,
  };

  const strengths = Object.entries(regionAverages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([region]) => region);

  const weaknesses = Object.entries(regionAverages)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([region]) => region);

  const RegionName = ({ region }: { region: string }) => (
    <span className="font-arabic">{t.evaluations[region as keyof typeof t.evaluations]}</span>
  );

  const generateRadarChart = () => {
    const regions = ['head', 'neck', 'hump', 'body', 'legs'];
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;

    const points = regions.map((region, i) => {
      const angle = (i * 2 * Math.PI) / regions.length - Math.PI / 2;
      const score = regionAverages[region as keyof typeof regionAverages];
      const radius = (score / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y, label: region, score };
    });

    const backgroundLevels = [25, 50, 75, 100];

    return (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {backgroundLevels.map((level) => {
          const radius = (level / 100) * maxRadius;
          const bgPoints = regions.map((_, i) => {
            const angle = (i * 2 * Math.PI) / regions.length - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={level}
              points={bgPoints}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {regions.map((_, i) => {
          const angle = (i * 2 * Math.PI) / regions.length - Math.PI / 2;
          const x = centerX + maxRadius * Math.cos(angle);
          const y = centerY + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
        />

        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="rgb(59, 130, 246)"
          />
        ))}
      </svg>
    );
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link
            to={`/camels/${id}`}
            className={`flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t.common.back}
          </Link>

          <h1 className={`text-4xl font-bold mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.analytics.title}
          </h1>
          <p className={`text-gray-600 mb-8 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
            {camel.name}
          </p>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 font-arabic">{t.analytics.averageScore}</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{avgScore.toFixed(1)}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 font-arabic">{t.analytics.improvement}</p>
              </div>
              <p className={`text-3xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-sm text-gray-600 mb-2 font-arabic">{t.analytics.bestScore}</p>
              <p className="text-3xl font-bold text-green-600">{bestScore.toFixed(1)}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-sm text-gray-600 mb-2 font-arabic">{t.analytics.evaluationCount}</p>
              <p className="text-3xl font-bold text-gray-700">{evaluations.length}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.breeding.traitAnalysis}
              </h2>
              <div className="h-80 flex items-center justify-center">
                {generateRadarChart()}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.breeding.title}
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-3 font-arabic flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Award className="w-5 h-5 text-green-600" />
                    {t.breeding.strengths}
                  </h3>
                  <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                    {strengths.map((region) => (
                      <span
                        key={region}
                        className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold font-arabic"
                      >
                        <RegionName region={region} /> ({regionAverages[region as keyof typeof regionAverages].toFixed(1)})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-semibold mb-3 font-arabic flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    {t.breeding.focusAreas}
                  </h3>
                  <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                    {weaknesses.map((region) => (
                      <span
                        key={region}
                        className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-semibold font-arabic"
                      >
                        <RegionName region={region} /> ({regionAverages[region as keyof typeof regionAverages].toFixed(1)})
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`p-4 bg-blue-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="font-semibold text-blue-900 mb-2 font-arabic">
                    {t.breeding.recommendations}
                  </h3>
                  <p className="text-sm text-blue-800 font-arabic">
                    {isRTL
                      ? `ركز على تحسين ${weaknesses.map((w) => t.evaluations[w as keyof typeof t.evaluations]).join(' و')} من خلال التغذية المناسبة والرعاية المستهدفة`
                      : `Focus on improving ${weaknesses.map((w) => t.evaluations[w as keyof typeof t.evaluations]).join(' and ')} through proper nutrition and targeted care`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {aiEvaluations.length > 0 && expertEvaluations.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.analytics.aiVsExpert}
              </h2>

              <div className="grid md:grid-cols-5 gap-4">
                {['head', 'neck', 'hump', 'body', 'legs'].map((region) => {
                  const aiAvg =
                    aiEvaluations.reduce((sum, e) => {
                      const value = e[`${region}_score` as keyof Evaluation];
                      return sum + (typeof value === 'number' ? value : 0);
                    }, 0) / aiEvaluations.length;
                  const expertAvg =
                    expertEvaluations.reduce((sum, e) => {
                      const value = e[`${region}_score` as keyof Evaluation];
                      return sum + (typeof value === 'number' ? value : 0);
                    }, 0) / expertEvaluations.length;
                  const diff = Math.abs(aiAvg - expertAvg);

                  return (
                    <div key={region} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold mb-3 font-arabic">
                        <RegionName region={region} />
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">AI</p>
                          <p className="text-lg font-bold text-blue-600">{aiAvg.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-arabic">{t.roles.expert}</p>
                          <p className="text-lg font-bold text-green-600">{expertAvg.toFixed(1)}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Δ {diff.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function CamelAnalytics() {
  return (
    <ProtectedRoute>
      <CamelAnalyticsContent />
    </ProtectedRoute>
  );
}
