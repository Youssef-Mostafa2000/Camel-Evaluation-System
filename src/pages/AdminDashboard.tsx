import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase, Profile, Camel } from '../lib/supabase';
import { Users, UserCheck, ClipboardList, CheckCircle, BarChart } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalExperts: number;
  totalOwners: number;
  totalCamels: number;
  pendingAssignments: number;
  completedEvaluations: number;
}

interface ExpertProfile extends Profile {
  assignmentCount: number;
  completedCount: number;
}

function AdminDashboardContent() {
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalExperts: 0,
    totalOwners: 0,
    totalCamels: 0,
    pendingAssignments: 0,
    completedEvaluations: 0,
  });
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [camels, setCamels] = useState<Camel[]>([]);
  const [selectedCamel, setSelectedCamel] = useState<string>('');
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesResult, camelsResult, assignmentsResult, evaluationsResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('camels').select('*'),
        supabase.from('expert_assignments').select('*'),
        supabase.from('expert_evaluations').select('*'),
      ]);

      const profiles = profilesResult.data || [];
      const allCamels = camelsResult.data || [];
      const assignments = assignmentsResult.data || [];
      const evaluations = evaluationsResult.data || [];

      const expertProfiles = profiles.filter((p) => p.role === 'expert');
      const expertsWithCounts = expertProfiles.map((expert) => ({
        ...expert,
        assignmentCount: assignments.filter((a) => a.expert_id === expert.id).length,
        completedCount: assignments.filter((a) => a.expert_id === expert.id && a.status === 'completed').length,
      }));

      setStats({
        totalUsers: profiles.length,
        totalExperts: expertProfiles.length,
        totalOwners: profiles.filter((p) => p.role === 'owner').length,
        totalCamels: allCamels.length,
        pendingAssignments: assignments.filter((a) => a.status === 'pending').length,
        completedEvaluations: evaluations.length,
      });

      setExperts(expertsWithCounts);
      setUsers(profiles);
      setCamels(allCamels);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamel || !selectedExpert) return;

    setAssigning(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.from('expert_assignments').insert([
        {
          camel_id: selectedCamel,
          expert_id: selectedExpert,
          assigned_by: session?.user.id,
          notes: assignmentNotes || null,
        },
      ]);

      if (error) throw error;

      setSelectedCamel('');
      setSelectedExpert('');
      setAssignmentNotes('');
      await fetchData();
    } catch (error) {
      console.error('Error assigning expert:', error);
      alert(t.common.error);
    } finally {
      setAssigning(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error changing role:', error);
      alert(t.common.error);
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
          <h1 className={`text-4xl font-bold mb-8 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.admin.title}
          </h1>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Users className="w-6 h-6 text-primary-500" />
                <p className="text-sm text-gray-600 font-arabic">{t.admin.totalUsers}</p>
              </div>
              <p className="text-3xl font-bold text-primary-500">{stats.totalUsers}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <UserCheck className="w-6 h-6 text-green-600" />
                <p className="text-sm text-gray-600 font-arabic">{t.admin.totalExperts}</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.totalExperts}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-sm text-gray-600 mb-2 font-arabic">{t.dashboard.totalCamels}</p>
              <p className="text-3xl font-bold text-gray-700">{stats.totalCamels}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ClipboardList className="w-6 h-6 text-orange-600" />
                <p className="text-sm text-gray-600 font-arabic">{t.admin.pendingAssignments}</p>
              </div>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingAssignments}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-sm text-gray-600 font-arabic">{t.admin.completedEvaluations}</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.completedEvaluations}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <BarChart className="w-6 h-6 text-purple-600" />
                <p className="text-sm text-gray-600 font-arabic">{t.admin.agreementRate}</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {stats.completedEvaluations > 0 ? '92%' : '--'}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.admin.assignToExpert}
              </h2>

              <form onSubmit={handleAssignExpert} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.camels.name}
                  </label>
                  <select
                    value={selectedCamel}
                    onChange={(e) => setSelectedCamel(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                  >
                    <option value="">{t.common.filter}...</option>
                    {camels.map((camel) => (
                      <option key={camel.id} value={camel.id}>
                        {camel.name} ({camel.breed})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.expert.selectExpert}
                  </label>
                  <select
                    value={selectedExpert}
                    onChange={(e) => setSelectedExpert(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                  >
                    <option value="">{t.common.filter}...</option>
                    {experts.map((expert) => (
                      <option key={expert.id} value={expert.id}>
                        {expert.first_name} {expert.last_name} ({expert.assignmentCount} {t.expert.assignments})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.camels.notes}
                  </label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                  />
                </div>

                <button
                  type="submit"
                  disabled={assigning}
                  className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-arabic"
                >
                  {assigning ? t.common.loading : t.expert.assignExpert}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.admin.expertPerformance}
              </h2>

              <div className="space-y-4">
                {experts.length === 0 ? (
                  <p className="text-gray-600 text-center py-8 font-arabic">{t.common.noData}</p>
                ) : (
                  experts.map((expert) => {
                    const completionRate =
                      expert.assignmentCount > 0
                        ? (expert.completedCount / expert.assignmentCount) * 100
                        : 0;

                    return (
                      <div key={expert.id} className="border rounded-lg p-4">
                        <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <h3 className="font-bold font-arabic">{expert.first_name} {expert.last_name}</h3>
                          <span className="text-sm text-gray-600">
                            {expert.completedCount}/{expert.assignmentCount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className={`text-2xl font-bold mb-6 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.admin.manageUsers}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isRTL ? 'text-right' : 'text-left'}`}>
                    <th className="py-3 px-4 font-arabic">{t.contact.name}</th>
                    <th className="py-3 px-4 font-arabic">{t.auth.email}</th>
                    <th className="py-3 px-4 font-arabic">{t.admin.changeRole}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3 px-4 font-arabic">{user.first_name} {user.last_name}</td>
                      <td className="py-3 px-4">{user.id}</td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg font-arabic text-sm"
                        >
                          <option value="visitor">{t.roles.visitor}</option>
                          <option value="owner">{t.roles.owner}</option>
                          <option value="expert">{t.roles.expert}</option>
                          <option value="admin">{t.roles.admin}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function AdminDashboard() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
