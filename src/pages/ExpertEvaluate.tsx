import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Camel, CamelImage } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface Assignment {
  id: string;
  camel_id: string;
  status: string;
  camel?: Camel;
  images?: CamelImage[];
}

function ExpertEvaluateContent() {
  const { assignmentId } = useParams();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [headScore, setHeadScore] = useState(80);
  const [neckScore, setNeckScore] = useState(80);
  const [humpScore, setHumpScore] = useState(80);
  const [bodyScore, setBodyScore] = useState(80);
  const [legsScore, setLegsScore] = useState(80);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      const { data: assignmentData } = await supabase
        .from('expert_assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('expert_id', user?.id)
        .maybeSingle();

      if (!assignmentData) {
        setError(t.common.noData);
        setLoading(false);
        return;
      }

      const [camelResult, imagesResult] = await Promise.all([
        supabase.from('camels').select('*').eq('id', assignmentData.camel_id).maybeSingle(),
        supabase.from('camel_images').select('*').eq('camel_id', assignmentData.camel_id).limit(1),
      ]);

      setAssignment({
        ...assignmentData,
        camel: camelResult.data || undefined,
        images: imagesResult.data || [],
      });

      if (assignmentData.status === 'pending') {
        await supabase
          .from('expert_assignments')
          .update({ status: 'in_progress' })
          .eq('id', assignmentId);
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = () => {
    const weights = { head: 0.2, neck: 0.2, hump: 0.25, body: 0.2, legs: 0.15 };
    return Math.round(
      (headScore * weights.head +
        neckScore * weights.neck +
        humpScore * weights.hump +
        bodyScore * weights.body +
        legsScore * weights.legs) * 10
    ) / 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const overallScore = calculateOverallScore();

      const { error: insertError } = await supabase
        .from('expert_evaluations')
        .insert([
          {
            assignment_id: assignmentId,
            camel_id: assignment?.camel_id,
            expert_id: user?.id,
            overall_score: overallScore,
            head_score: headScore,
            neck_score: neckScore,
            hump_score: humpScore,
            body_score: bodyScore,
            legs_score: legsScore,
            notes: notes || null,
          },
        ]);

      if (insertError) throw insertError;

      const { error: evalInsertError } = await supabase
        .from('evaluations')
        .insert([
          {
            camel_id: assignment?.camel_id,
            image_id: assignment?.images?.[0]?.id || null,
            overall_score: overallScore,
            head_score: headScore,
            neck_score: neckScore,
            hump_score: humpScore,
            body_score: bodyScore,
            legs_score: legsScore,
            evaluation_type: 'expert',
            expert_id: user?.id,
            notes: notes || null,
          },
        ]);

      if (evalInsertError) throw evalInsertError;

      navigate('/expert/dashboard');
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError(t.common.error);
    } finally {
      setSubmitting(false);
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

  if (!assignment || !assignment.camel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600 font-arabic">{error || t.common.noData}</p>
        </div>
      </Layout>
    );
  }

  const overallScore = calculateOverallScore();

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/expert/dashboard"
            className={`flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-6 font-arabic ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t.common.back}
          </Link>

          <div className="max-w-4xl mx-auto">
            <h1 className={`text-4xl font-bold mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.expert.provideScore}
            </h1>
            <p className={`text-gray-600 mb-8 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
              {assignment.camel.name} • {assignment.camel.breed}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-arabic">
                {error}
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {assignment.images && assignment.images.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <img
                      src={assignment.images[0].image_url}
                      alt="Camel"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
                  <div>
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <label className="text-lg font-semibold font-arabic">{t.evaluations.head}</label>
                      <span className="text-2xl font-bold text-primary-500">{headScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={headScore}
                      onChange={(e) => setHeadScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <label className="text-lg font-semibold font-arabic">{t.evaluations.neck}</label>
                      <span className="text-2xl font-bold text-blue-600">{neckScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={neckScore}
                      onChange={(e) => setNeckScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <label className="text-lg font-semibold font-arabic">{t.evaluations.hump}</label>
                      <span className="text-2xl font-bold text-blue-600">{humpScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={humpScore}
                      onChange={(e) => setHumpScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <label className="text-lg font-semibold font-arabic">{t.evaluations.body}</label>
                      <span className="text-2xl font-bold text-blue-600">{bodyScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bodyScore}
                      onChange={(e) => setBodyScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <label className="text-lg font-semibold font-arabic">{t.evaluations.legs}</label>
                      <span className="text-2xl font-bold text-blue-600">{legsScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={legsScore}
                      onChange={(e) => setLegsScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t.expert.expertNotes}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-arabic text-lg font-semibold"
                  >
                    {submitting ? t.common.loading : t.expert.submitEvaluation}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                  <h2 className={`text-xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.evaluations.overallScore}
                  </h2>

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4">
                      <span className="text-5xl font-bold">{overallScore}</span>
                    </div>
                    <p className="text-gray-600 font-arabic">{t.evaluations.overallScore}</p>
                  </div>

                  <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-arabic">{t.evaluations.head}</span>
                      <span className="font-semibold">{headScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-arabic">{t.evaluations.neck}</span>
                      <span className="font-semibold">{neckScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-arabic">{t.evaluations.hump}</span>
                      <span className="font-semibold">{humpScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-arabic">{t.evaluations.body}</span>
                      <span className="font-semibold">{bodyScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-arabic">{t.evaluations.legs}</span>
                      <span className="font-semibold">{legsScore}</span>
                    </div>
                  </div>

                  <div className={`mt-6 pt-6 border-t ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-gray-600 font-arabic mb-2">
                      {t.evaluations.weight}
                    </p>
                    <p className="text-xs text-gray-500 font-arabic">
                      {t.evaluations.head}: 20% • {t.evaluations.neck}: 20% • {t.evaluations.hump}: 25% • {t.evaluations.body}: 20% • {t.evaluations.legs}: 15%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function ExpertEvaluate() {
  return (
    <ProtectedRoute requireRole="expert">
      <ExpertEvaluateContent />
    </ProtectedRoute>
  );
}
