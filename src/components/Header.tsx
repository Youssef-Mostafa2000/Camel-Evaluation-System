import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Globe, LogOut, User } from 'lucide-react';

export function Header() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600 font-arabic">
            {language === 'ar' ? 'تقييم الإبل AI' : 'Camel AI'}
          </Link>

          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition font-arabic">
              {t.nav.home}
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 transition font-arabic">
              {t.nav.about}
            </Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-blue-600 transition font-arabic">
              {t.nav.howItWorks}
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition font-arabic">
              {t.nav.contact}
            </Link>

            {user && profile && (
              <>
                {profile.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-blue-600 transition font-arabic">
                    {t.nav.dashboard}
                  </Link>
                )}
                {profile.role === 'expert' && (
                  <Link to="/expert/dashboard" className="text-gray-700 hover:text-blue-600 transition font-arabic">
                    {t.nav.dashboard}
                  </Link>
                )}
                {(profile.role === 'owner' || profile.role === 'visitor') && (
                  <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition font-arabic">
                    {t.nav.dashboard}
                  </Link>
                )}
              </>
            )}

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Globe className="w-5 h-5" />
            </button>

            {user ? (
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <User className="w-4 h-4" />
                  <span className="text-sm font-arabic">{profile?.full_name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title={t.nav.logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition font-arabic"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-arabic"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
