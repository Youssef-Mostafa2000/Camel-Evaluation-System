import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { countries, getCountryFlag } from '../lib/countries';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+966');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return isRTL
        ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
        : 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return isRTL
        ? 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل'
        : 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return isRTL
        ? 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل'
        : 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return isRTL
        ? 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'
        : 'Password must contain at least one number';
    }
    return null;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    const error = validatePassword(pwd);
    setPasswordError(error || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    const phoneNumberPattern = /^\d+$/;
    if (!phoneNumberPattern.test(phoneNumber)) {
      setError(isRTL ? 'رقم الهاتف يجب أن يحتوي على أرقام فقط' : 'Phone number must contain only numbers');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${phoneCountryCode}${phoneNumber}`;
      await signUp(email, password, {
        firstName,
        lastName,
        phone: fullPhone,
        country,
        gender,
        birthdate,
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {passwordError && (
                <p className={`mt-1 text-sm text-red-600 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {passwordError}
                </p>
              )}
              {!passwordError && password && (
                <p className={`mt-1 text-xs text-gray-500 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL
                    ? 'كلمة المرور يجب أن تحتوي على: 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم'
                    : 'Password must contain: 8+ characters, uppercase, lowercase, and number'}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.auth.phone}
              </label>
              <div className="flex gap-2" dir="ltr">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  required
                  className="w-32 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.dialCode}>
                      {getCountryFlag(c.code)} {c.dialCode}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setPhoneNumber(value);
                    }
                  }}
                  required
                  placeholder={isRTL ? 'رقم الهاتف' : 'Phone number'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.auth.country}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
              >
                <option value="">{isRTL ? 'اختر الدولة' : 'Select Country'}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {getCountryFlag(c.code)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.auth.gender}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                >
                  <option value="">{isRTL ? 'اختر الجنس' : 'Select Gender'}</option>
                  <option value="male">{t.auth.male}</option>
                  <option value="female">{t.auth.female}</option>
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
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-arabic"
            >
              {loading ? t.auth.registering : t.auth.registerButton}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 font-arabic">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              {t.auth.loginHere}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
