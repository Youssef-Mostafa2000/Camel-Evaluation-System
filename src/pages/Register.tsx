import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t.auth.passwordMin);
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, {
        firstName,
        lastName,
        phone: phone || undefined,
        country: country || undefined,
        gender: gender || undefined,
        birthdate: birthdate || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(t.auth.registerError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 font-arabic">
            {t.auth.register}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-arabic">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.auth.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.auth.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.auth.phone} {t.auth.optional}
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
                  {t.auth.country} {t.auth.optional}
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-arabic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.auth.gender} {t.auth.optional}
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
                  {t.auth.birthdate} {t.auth.optional}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-arabic"
            >
              {loading ? t.auth.registering : t.auth.registerButton}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 font-arabic">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t.auth.loginHere}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
