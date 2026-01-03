import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/Layout";
import { Sparkles, Zap, Eye } from "lucide-react";

export function Landing() {
  const { t, isRTL } = useLanguage();
  const { user, profile } = useAuth();

  return (
    <Layout>
      <div>
        <section
          className="relative w-full px-4 py-12 md:py-20 text-center"
          style={{
            backgroundImage: "url(/back2.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/25 to-white/20"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-4 md:mb-6">
              <div
                className={`inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-cream-200 border border-cream-300 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-primary-500" />
                <span className="text-sm md:text-base text-primary-700 font-semibold font-arabic">
                  {t.landing.badge}
                </span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-arabic leading-tight px-2">
              <span className="text-secondary-800">{t.landing.title}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-secondary-600 mb-6 md:mb-8 max-w-3xl mx-auto font-arabic leading-relaxed px-4">
              {t.landing.subtitle}
            </p>
            <div
              className={`flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center px-4 ${
                isRTL ? "sm:flex-row-reverse" : ""
              }`}
            >
              <Link
                to="/detection"
                className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-6 sm:px-8 md:px-10 py-3 md:py-5 rounded-xl text-base sm:text-lg md:text-xl font-bold hover:from-gold-600 hover:to-gold-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 md:gap-3 font-arabic"
              >
                <Sparkles className="w-5 md:w-6 h-5 md:h-6" />
                <span>{t.landing.cta3}</span>
              </Link>
            </div>
            <div
              className={`flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 justify-center items-stretch sm:items-center mt-3 md:mt-4 px-4 ${
                isRTL ? "sm:flex-row-reverse" : ""
              }`}
            >
              {user && profile ? (
                <>
                  <Link
                    to="/marketplace"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 sm:px-8 md:px-10 py-3 md:py-5 rounded-xl text-base sm:text-lg md:text-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 md:gap-3 font-arabic"
                  >
                    <span>🛒</span>
                    <span>Marketplace</span>
                  </Link>
                  <Link
                    to="/breeding"
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white px-6 sm:px-8 py-3 md:py-4 rounded-lg text-base sm:text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 font-arabic"
                  >
                    <span>🐪</span>
                    <span>Breeding</span>
                  </Link>
                  <Link
                    to={
                      profile.role === "admin"
                        ? "/admin/dashboard"
                        : profile.role === "expert"
                        ? "/expert/dashboard"
                        : "/dashboard"
                    }
                    className="w-full sm:w-auto bg-primary-500 text-white px-6 sm:px-8 py-3 md:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary-600 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-arabic text-center"
                  >
                    {t.nav.dashboard || "Dashboard"}
                  </Link>
                  <Link
                    to="/camels"
                    className="w-full sm:w-auto bg-white text-secondary-800 px-6 sm:px-8 py-3 md:py-4 rounded-lg text-base sm:text-lg font-semibold border-2 border-secondary-800 hover:bg-secondary-50 transition font-arabic text-center"
                  >
                    {t.nav.camels || "View Camels"}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto bg-primary-500 text-white px-6 sm:px-8 py-3 md:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary-600 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-arabic text-center"
                  >
                    {t.landing.cta1}
                  </Link>
                  <Link
                    to="/contact"
                    className="w-full sm:w-auto bg-white text-secondary-800 px-6 sm:px-8 py-3 md:py-4 rounded-lg text-base sm:text-lg font-semibold border-2 border-secondary-800 hover:bg-secondary-50 transition font-arabic text-center"
                  >
                    {t.landing.cta2}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 font-arabic text-secondary-800 px-4">
            {t.landing.features.title}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto">
                <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center font-arabic text-secondary-800">
                {t.landing.features.fairness.title}
              </h3>
              <p className="text-sm md:text-base text-secondary-600 text-center font-arabic leading-relaxed">
                {t.landing.features.fairness.description}
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto">
                <Zap className="w-7 h-7 md:w-8 md:h-8 text-primary-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center font-arabic text-secondary-800">
                {t.landing.features.speed.title}
              </h3>
              <p className="text-sm md:text-base text-secondary-600 text-center font-arabic leading-relaxed">
                {t.landing.features.speed.description}
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto">
                <Eye className="w-7 h-7 md:w-8 md:h-8 text-primary-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center font-arabic text-secondary-800">
                {t.landing.features.transparency.title}
              </h3>
              <p className="text-sm md:text-base text-secondary-600 text-center font-arabic leading-relaxed">
                {t.landing.features.transparency.description}
              </p>
            </div>
          </div>
        </section>

        {!user && (
          <section className="bg-primary-500 text-white py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 font-arabic">
                {isRTL ? "ابدأ رحلتك اليوم" : "Start Your Journey Today"}
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 font-arabic px-4">
                {isRTL
                  ? "انضم لآلاف المربين الذين يستخدمون نظامنا"
                  : "Join thousands of breeders using our system"}
              </p>
              <Link
                to="/register"
                className="inline-block bg-white text-primary-600 px-6 sm:px-8 py-3 md:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-cream-50 transition shadow-lg font-arabic"
              >
                {t.landing.cta1}
              </Link>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
