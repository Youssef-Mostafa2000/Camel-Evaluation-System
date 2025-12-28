import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { supabase, Camel, Evaluation } from '../lib/supabase';
import { Plus, TrendingUp, Award, Eye } from 'lucide-react';

export function Dashboard() {
  const { profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [camels, setCamels] = useState<Camel[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: camelsData } = await supabase
        .from('camels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (camelsData) {
        setCamels(camelsData);

        const camelIds = camelsData.map((c) => c.id);
        if (camelIds.length > 0) {
          const { data: evaluationsData } = await supabase
            .from('evaluations')
            .select('*')
            .in('camel_id', camelIds);

          if (evaluationsData) {
            setEvaluations(evaluationsData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCamels = camels.length;
  const totalEvaluations = evaluations.length;
  const avgScore =
    evaluations.length > 0
      ? (
          evaluations.reduce((sum, e) => sum + e.overall_score, 0) /
          evaluations.length
        ).toFixed(1)
      : '0';

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

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h1 className="text-4xl font-bold mb-2 font-arabic">
              {t.dashboard.welcome}, {profile?.full_name}
            </h1>
            <p className="text-gray-600 font-arabic">
              {t.roles[profile?.role || 'visitor']}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-gray-600 font-arabic">{t.dashboard.totalCamels}</p>
                  <p className="text-3xl font-bold text-blue-600">{totalCamels}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-gray-600 font-arabic">{t.dashboard.totalEvaluations}</p>
                  <p className="text-3xl font-bold text-green-600">{totalEvaluations}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-gray-600 font-arabic">{t.dashboard.avgScore}</p>
                  <p className="text-3xl font-bold text-orange-600">{avgScore}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className="text-2xl font-bold font-arabic">{t.dashboard.recentCamels}</h2>
              <Link
                to="/camels/new"
                className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Plus className="w-5 h-5" />
                {t.camels.addCamel}
              </Link>
            </div>

            {camels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4 font-arabic">{t.dashboard.noCamels}</p>
                <Link
                  to="/camels/new"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-arabic"
                >
                  {t.dashboard.addFirstCamel}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {camels.map((camel) => {
                  const camelEvaluations = evaluations.filter((e) => e.camel_id === camel.id);
                  const latestScore = camelEvaluations.length > 0
                    ? camelEvaluations[camelEvaluations.length - 1].overall_score
                    : null;

                  return (
                    <Link
                      key={camel.id}
                      to={`/camels/${camel.id}`}
                      className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <h3 className="font-bold text-lg font-arabic">{camel.name}</h3>
                          <p className="text-gray-600 text-sm font-arabic">
                            {camel.breed} • {camel.age} {t.camels.years} • {t.camels[camel.gender]}
                          </p>
                        </div>
                        {latestScore !== null && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{latestScore}</p>
                            <p className="text-xs text-gray-500 font-arabic">{t.evaluations.overallScore}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
                <Link
                  to="/camels"
                  className="block text-center text-blue-600 hover:text-blue-700 py-2 font-arabic"
                >
                  {t.dashboard.viewAll}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
