import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Camel } from '../lib/supabase';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

function CamelsListContent() {
  const { t, isRTL } = useLanguage();
  const [camels, setCamels] = useState<Camel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCamels();
  }, []);

  const fetchCamels = async () => {
    try {
      const { data } = await supabase
        .from('camels')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setCamels(data);
      }
    } catch (error) {
      console.error('Error fetching camels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.camels.confirmDelete)) {
      try {
        await supabase.from('camels').delete().eq('id', id);
        setCamels(camels.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Error deleting camel:', error);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
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
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h1 className="text-4xl font-bold font-arabic">{t.camels.myCamels}</h1>
            <Link
              to="/camels/new"
              className={`flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className="w-5 h-5" />
              {t.camels.addCamel}
            </Link>
          </div>

          {camels.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600 mb-6 text-lg font-arabic">{t.dashboard.noCamels}</p>
              <Link
                to="/camels/new"
                className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition font-arabic"
              >
                {t.dashboard.addFirstCamel}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {camels.map((camel) => (
                <div key={camel.id} className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className={`text-2xl font-bold mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {camel.name}
                  </h3>
                  <div className={`space-y-2 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-gray-600 font-arabic">
                      <span className="font-semibold">{t.camels.breed}:</span> {camel.breed}
                    </p>
                    <p className="text-gray-600 font-arabic">
                      <span className="font-semibold">{t.camels.gender}:</span> {t.camels[camel.gender]}
                    </p>
                    <p className="text-gray-600 font-arabic">
                      <span className="font-semibold">{t.camels.age}:</span> {camel.age} {t.camels.years}
                    </p>
                  </div>
                  {camel.notes && (
                    <p className={`text-sm text-gray-500 mb-4 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                      {camel.notes}
                    </p>
                  )}
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Link
                      to={`/camels/${camel.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition font-arabic"
                    >
                      <Eye className="w-4 h-4" />
                      {t.camels.viewDetails}
                    </Link>
                    <Link
                      to={`/camels/${camel.id}/edit`}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(camel.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function CamelsList() {
  return (
    <ProtectedRoute>
      <CamelsListContent />
    </ProtectedRoute>
  );
}
