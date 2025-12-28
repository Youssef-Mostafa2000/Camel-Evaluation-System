import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { User, Mail, Phone, Globe, Calendar, Save, X } from 'lucide-react';

export function Profile() {
  const { profile, updateProfile, user } = useAuth();
  const { t, isRTL } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setPhone(profile.phone || '');
      setCountry(profile.country || '');
      setGender(profile.gender || '');
      setBirthdate(profile.birthdate || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        country: country || undefined,
        gender: gender || undefined,
        birthdate: birthdate || undefined,
      });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(t.profile.updateError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setPhone(profile.phone || '');
      setCountry(profile.country || '');
      setGender(profile.gender || '');
      setBirthdate(profile.birthdate || '');
    }
    setIsEditing(false);
    setError('');
  };

  if (!profile || !user) {
    return null;
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(
    isRTL ? 'ar' : 'en',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8">
              <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600" />
                  )}
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h1 className="text-3xl font-bold text-white font-arabic">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="text-blue-100 mt-1 font-arabic">
                    {t.roles[profile.role]}
                  </p>
                  <p className="text-blue-200 text-sm mt-2 font-arabic">
                    {t.profile.memberSince}: {memberSince}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center font-arabic">
                  {t.profile.updateSuccess}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-arabic">
                  {error}
                </div>
              )}

              <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-2xl font-bold text-gray-900 font-arabic">
                  {t.profile.personalInfo}
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-arabic"
                  >
                    {t.profile.editProfile}
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.auth.firstName}
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-arabic"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.auth.lastName}
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.auth.phone}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.auth.country}
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-arabic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.auth.gender}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-arabic"
                      >
                        <option value=""></option>
                        <option value="male">{t.auth.male}</option>
                        <option value="female">{t.auth.female}</option>
                        <option value="other">{t.auth.other}</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.auth.birthdate}
                      </label>
                      <input
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-arabic"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? t.common.loading : t.profile.updateProfile}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-arabic"
                    >
                      <X className="w-5 h-5" />
                      {t.camels.cancel}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Mail className="w-6 h-6 text-blue-600" />
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-sm text-gray-600 font-arabic">{t.auth.email}</p>
                      <p className="text-lg font-medium" dir="ltr">{profile.email}</p>
                    </div>
                  </div>

                  {profile.phone && (
                    <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Phone className="w-6 h-6 text-blue-600" />
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-600 font-arabic">{t.auth.phone}</p>
                        <p className="text-lg font-medium" dir="ltr">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {profile.country && (
                    <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Globe className="w-6 h-6 text-blue-600" />
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-600 font-arabic">{t.auth.country}</p>
                        <p className="text-lg font-medium font-arabic">{profile.country}</p>
                      </div>
                    </div>
                  )}

                  {profile.gender && (
                    <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <User className="w-6 h-6 text-blue-600" />
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-600 font-arabic">{t.auth.gender}</p>
                        <p className="text-lg font-medium font-arabic">
                          {t.auth[profile.gender as 'male' | 'female' | 'other']}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.birthdate && (
                    <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="text-sm text-gray-600 font-arabic">{t.auth.birthdate}</p>
                        <p className="text-lg font-medium" dir="ltr">
                          {new Date(profile.birthdate).toLocaleDateString(
                            isRTL ? 'ar' : 'en',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
