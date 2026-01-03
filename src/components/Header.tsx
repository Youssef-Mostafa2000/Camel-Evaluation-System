import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { Globe, LogOut, User, Search, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl md:text-2xl font-bold text-primary-500 font-arabic"
            onClick={closeMobileMenu}
          >
            {t.siteName}
          </Link>

          <div className="flex items-center gap-3 md:hidden">
            <Link
              to="/search"
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Search"
              onClick={closeMobileMenu}
            >
              <Search className="w-5 h-5" />
            </Link>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={language === "ar" ? "English" : "العربية"}
            >
              <Globe className="w-5 h-5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div
            className={`hidden md:flex items-center gap-6 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-500 transition font-arabic"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-primary-500 transition font-arabic"
            >
              {t.nav.about}
            </Link>
            <Link
              to="/how-it-works"
              className="text-gray-700 hover:text-primary-500 transition font-arabic"
            >
              {t.nav.howItWorks}
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary-500 transition font-arabic"
            >
              {t.nav.contact}
            </Link>
            {/* <Link
              to="/detection"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-arabic"
            >
              <Sparkles className="w-4 h-4" />
              <span>Beauty Detection</span>
            </Link> */}

            {user && profile && (
              <>
                <Link
                  to="/camels"
                  className="text-gray-700 hover:text-primary-500 transition font-arabic"
                >
                  {t.nav.camels || "Camels"}
                </Link>
                <Link
                  to="/breeding"
                  className="text-gray-700 hover:text-primary-500 transition font-arabic"
                >
                  Breeding
                </Link>
                <Link
                  to="/marketplace"
                  className="text-gray-700 hover:text-primary-500 transition font-arabic"
                >
                  Marketplace
                </Link>
                {profile.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="text-gray-700 hover:text-primary-500 transition font-arabic"
                  >
                    {t.nav.dashboard}
                  </Link>
                )}
                {profile.role === "expert" && (
                  <Link
                    to="/expert/dashboard"
                    className="text-gray-700 hover:text-primary-500 transition font-arabic"
                  >
                    {t.nav.dashboard}
                  </Link>
                )}
                {(profile.role === "owner" || profile.role === "visitor") && (
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-500 transition font-arabic"
                  >
                    {t.nav.dashboard}
                  </Link>
                )}
              </>
            )}

            <Link
              to="/search"
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Link>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title={language === "ar" ? "English" : "العربية"}
            >
              <Globe className="w-5 h-5" />
            </button>

            {user ? (
              <div
                className={`flex items-center gap-3 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
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
              <div
                className={`flex items-center gap-3 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
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

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={closeMobileMenu}
              >
                {t.nav.home}
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={closeMobileMenu}
              >
                {t.nav.about}
              </Link>
              <Link
                to="/how-it-works"
                className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={closeMobileMenu}
              >
                {t.nav.howItWorks}
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={closeMobileMenu}
              >
                {t.nav.contact}
              </Link>

              {user && profile && (
                <>
                  <Link
                    to="/camels"
                    className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    {t.nav.camels || "Camels"}
                  </Link>
                  <Link
                    to="/breeding"
                    className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    Breeding
                  </Link>
                  <Link
                    to="/marketplace"
                    className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    Marketplace
                  </Link>
                  {profile.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      {t.nav.dashboard}
                    </Link>
                  )}
                  {profile.role === "expert" && (
                    <Link
                      to="/expert/dashboard"
                      className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      {t.nav.dashboard}
                    </Link>
                  )}
                  {(profile.role === "owner" || profile.role === "visitor") && (
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      {t.nav.dashboard}
                    </Link>
                  )}
                </>
              )}

              {user ? (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    onClick={closeMobileMenu}
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-arabic"
                  >
                    <LogOut className="w-5 h-5" />
                    {t.nav.logout}
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <Link
                    to="/login"
                    className="block text-center text-gray-700 hover:text-primary-500 transition font-arabic py-2 px-3 rounded-lg hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    className="block text-center bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition font-arabic"
                    onClick={closeMobileMenu}
                  >
                    {t.nav.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
