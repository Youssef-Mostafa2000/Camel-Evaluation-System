import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Camel } from '../lib/supabase';
import { ClipboardList, Check, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  camel_id: string;
  status: string;
  assigned_at: string;
  notes?: string;
  camel?: Camel;
}

function ExpertDashboardContent() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data } = await supabase
        .from('expert_assignments')
        .select(`
          *,
          camel:camels(*)
        `)
        .eq('expert_id', user?.id)
        .order('assigned_at', { ascending: false });

      if (data) {
        setAssignments(data.map((a: any) => ({
          ...a,
          camel: a.camel
        })));
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <ClipboardList className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  const pendingAssignments = assignments.filter((a) => a.status === 'pending');
  const inProgressAssignments = assignments.filter((a) => a.status === 'in_progress');
  const completedAssignments = assignments.filter((a) => a.status === 'completed');

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className={`text-4xl font-bold mb-8 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.expert.myAssignments}
          </h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-gray-600 font-arabic">{t.expert.pending}</p>
                  <p className="text-3xl font-bold text-gray-600">{pendingAssignments.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-gray-600 font-arabic">{t.expert.inProgress}</p>
                  <p className="text-3xl font-bold text-blue-600">{inProgressAssignments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-gray-600 font-arabic">{t.expert.completed}</p>
                  <p className="text-3xl font-bold text-green-600">{completedAssignments.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-arabic">{t.expert.noAssignments}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`p-2 rounded-lg ${getStatusColor(assignment.status)} border`}>
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h3 className="text-xl font-bold font-arabic">{assignment.camel?.name}</h3>
                        <p className="text-sm text-gray-600 font-arabic">
                          {assignment.camel?.breed} • {assignment.camel?.age} {t.camels.years}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(assignment.status)}`}>
                      <span className="text-sm font-semibold font-arabic">
                        {t.expert[assignment.status as keyof typeof t.expert]}
                      </span>
                    </div>
                  </div>

                  <div className={`mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-gray-600 font-arabic">
                      {t.expert.assignedAt}: {new Date(assignment.assigned_at).toLocaleDateString()}
                    </p>
                    {assignment.notes && (
                      <p className="text-sm text-gray-700 mt-2 font-arabic">{assignment.notes}</p>
                    )}
                  </div>

                  {assignment.status !== 'completed' && (
                    <Link
                      to={`/expert/evaluate/${assignment.id}`}
                      className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-arabic"
                    >
                      {assignment.status === 'in_progress' ? t.expert.provideScore : t.expert.startEvaluation}
                    </Link>
                  )}

                  {assignment.status === 'completed' && (
                    <Link
                      to={`/camels/${assignment.camel_id}`}
                      className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition font-arabic"
                    >
                      {t.camels.viewDetails}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function ExpertDashboard() {
  return (
    <ProtectedRoute requireRole="expert">
      <ExpertDashboardContent />
    </ProtectedRoute>
  );
}
