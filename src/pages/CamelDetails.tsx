import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Camel, CamelImage, Evaluation } from '../lib/supabase';
import { Upload, Edit, ArrowLeft } from 'lucide-react';

function CamelDetailsContent() {
  const { id } = useParams();
  const { t, isRTL } = useLanguage();
  const [camel, setCamel] = useState<Camel | null>(null);
  const [images, setImages] = useState<CamelImage[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [camelResult, imagesResult, evaluationsResult] = await Promise.all([
        supabase.from('camels').select('*').eq('id', id).maybeSingle(),
        supabase.from('camel_images').select('*').eq('camel_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('evaluations').select('*').eq('camel_id', id).order('created_at', { ascending: false }),
      ]);

      if (camelResult.data) setCamel(camelResult.data);
      if (imagesResult.data) setImages(imagesResult.data);
      if (evaluationsResult.data) setEvaluations(evaluationsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `camel-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('camels')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('camels')
        .getPublicUrl(filePath);

      const { data: imageData, error: imageError } = await supabase
        .from('camel_images')
        .insert([{ camel_id: id, image_url: publicUrl }])
        .select()
        .single();

      if (imageError) throw imageError;

      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-camel`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: imageData.id,
          camelId: id,
        }),
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      await fetchData();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t.common.error);
    } finally {
      setUploading(false);
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

  if (!camel) {
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
            to="/camels"
            className={`flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t.common.back}
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h1 className={`text-3xl font-bold font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {camel.name}
                  </h1>
                  <Link
                    to={`/camels/${id}/edit`}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                </div>

                <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <p className="text-sm text-gray-600 font-arabic">{t.camels.breed}</p>
                    <p className="text-lg font-semibold font-arabic">{camel.breed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-arabic">{t.camels.gender}</p>
                    <p className="text-lg font-semibold font-arabic">{t.camels[camel.gender]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-arabic">{t.camels.age}</p>
                    <p className="text-lg font-semibold font-arabic">{camel.age} {t.camels.years}</p>
                  </div>
                  {camel.notes && (
                    <div>
                      <p className="text-sm text-gray-600 font-arabic">{t.camels.notes}</p>
                      <p className="text-gray-700 font-arabic">{camel.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <span className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Upload className="w-5 h-5" />
                      {uploading ? t.common.loading : t.camels.uploadImage}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.camels.evaluations}
                </h2>

                {evaluations.length === 0 ? (
                  <p className={`text-gray-600 text-center py-8 font-arabic`}>
                    {t.camels.noEvaluations}
                  </p>
                ) : (
                  <div className="space-y-6">
                    {evaluations.map((evaluation) => {
                      const image = images.find((img) => img.id === evaluation.image_id);
                      return (
                        <div key={evaluation.id} className="border rounded-lg p-6">
                          {image && (
                            <div className="mb-4">
                              <img
                                src={image.image_url}
                                alt="Camel"
                                className="w-full h-64 object-cover rounded-lg"
                              />
                            </div>
                          )}

                          <div className={`mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm text-gray-600 font-arabic">
                              {new Date(evaluation.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600 font-arabic">
                              {evaluation.evaluation_type === 'ai'
                                ? t.evaluations.aiEvaluation
                                : t.evaluations.expertEvaluation}
                            </p>
                          </div>

                          <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 mb-4`}>
                            <div className={`text-center p-3 bg-blue-50 rounded-lg`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.overallScore}</p>
                              <p className="text-2xl font-bold text-blue-600">{evaluation.overall_score}</p>
                            </div>
                            <div className={`text-center p-3 bg-gray-50 rounded-lg`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.head}</p>
                              <p className="text-lg font-semibold">{evaluation.head_score}</p>
                            </div>
                            <div className={`text-center p-3 bg-gray-50 rounded-lg`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.neck}</p>
                              <p className="text-lg font-semibold">{evaluation.neck_score}</p>
                            </div>
                            <div className={`text-center p-3 bg-gray-50 rounded-lg`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.hump}</p>
                              <p className="text-lg font-semibold">{evaluation.hump_score}</p>
                            </div>
                            <div className={`text-center p-3 bg-gray-50 rounded-lg`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.body}</p>
                              <p className="text-lg font-semibold">{evaluation.body_score}</p>
                            </div>
                            <div className={`text-center p-3 bg-gray-50 rounded-lg`}>
                              <p className="text-sm text-gray-600 font-arabic">{t.evaluations.legs}</p>
                              <p className="text-lg font-semibold">{evaluation.legs_score}</p>
                            </div>
                          </div>

                          <Link
                            to={`/evaluations/${evaluation.id}`}
                            className={`mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-arabic`}
                          >
                            {t.evaluations.viewFullReport}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function CamelDetails() {
  return (
    <ProtectedRoute>
      <CamelDetailsContent />
    </ProtectedRoute>
  );
}
