import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Globe, LogOut, User, Sparkles } from 'lucide-react';

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
          <Link to="/" className="text-2xl font-bold text-primary-500 font-arabic">
            {t.siteName}
          </Link>

          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link to="/" className="text-gray-700 hover:text-primary-500 transition font-arabic">
              {t.nav.home}
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-500 transition font-arabic">
              {t.nav.about}
            </Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-primary-500 transition font-arabic">
              {t.nav.howItWorks}
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-500 transition font-arabic">
              {t.nav.contact}
            </Link>
            <Link
              to="/detection"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-arabic"
            >
              <Sparkles className="w-4 h-4" />
              <span>Beauty Detection</span>
            </Link>

            {user && profile && (
              <>
                <Link to="/camels" className="text-gray-700 hover:text-primary-500 transition font-arabic">
                  {t.nav.camels || 'Camels'}
                </Link>
                <Link to="/breeding" className="text-gray-700 hover:text-primary-500 transition font-arabic">
                  Breeding
                </Link>
                <Link to="/marketplace" className="text-gray-700 hover:text-primary-500 transition font-arabic">
                  Marketplace
                </Link>
                {profile.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary-500 transition font-arabic">
                    {t.nav.dashboard}
                  </Link>
                )}
                {profile.role === 'expert' && (
                  <Link to="/expert/dashboard" className="text-gray-700 hover:text-primary-500 transition font-arabic">
                    {t.nav.dashboard}
                  </Link>
                )}
                {(profile.role === 'owner' || profile.role === 'visitor') && (
                  <Link to="/dashboard" className="text-gray-700 hover:text-primary-500 transition font-arabic">
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
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm font-arabic">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                </Link>
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
                  className="text-gray-700 hover:text-primary-500 transition font-arabic"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition font-arabic"
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
