import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Sparkles, Zap, Eye } from 'lucide-react';

export function Landing() {
  const { t, isRTL } = useLanguage();
  const { user, profile } = useAuth();

  return (
    <Layout>
      <div className="bg-gradient-to-b from-cream-100 to-cream-50">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-cream-200 border border-cream-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="w-5 h-5 text-primary-500" />
              <span className="text-primary-700 font-semibold font-arabic">
                {t.landing.badge}
              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-arabic leading-tight">
            <span className="text-secondary-800">{t.landing.title}</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto font-arabic leading-relaxed">
            {t.landing.subtitle}
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Link
              to="/detection"
              className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:from-gold-600 hover:to-gold-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 font-arabic"
            >
              <Sparkles className="w-6 h-6" />
              <span>Try Beauty Detection</span>
            </Link>
          </div>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mt-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            {user && profile ? (
              <>
                <Link
                  to="/breeding"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 font-arabic"
                >
                  <span>🐪</span>
                  <span>Find Breeding Match</span>
                </Link>
                <Link
                  to={
                    profile.role === 'admin'
                      ? '/admin/dashboard'
                      : profile.role === 'expert'
                      ? '/expert/dashboard'
                      : '/dashboard'
                  }
                  className="bg-primary-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-600 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-arabic"
                >
                  {t.nav.dashboard || 'Go to Dashboard'}
                </Link>
                <Link
                  to="/camels"
                  className="bg-white text-secondary-800 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-secondary-800 hover:bg-secondary-50 transition font-arabic"
                >
                  {t.nav.camels || 'View Camels'}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-primary-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-600 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-arabic"
                >
                  {t.landing.cta1}
                </Link>
                <Link
                  to="/contact"
                  className="bg-white text-secondary-800 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-secondary-800 hover:bg-secondary-50 transition font-arabic"
                >
                  {t.landing.cta2}
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 font-arabic text-secondary-800">
            {t.landing.features.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center font-arabic text-secondary-800">
                {t.landing.features.fairness.title}
              </h3>
              <p className="text-secondary-600 text-center font-arabic leading-relaxed">
                {t.landing.features.fairness.description}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center font-arabic text-secondary-800">
                {t.landing.features.speed.title}
              </h3>
              <p className="text-secondary-600 text-center font-arabic leading-relaxed">
                {t.landing.features.speed.description}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Eye className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center font-arabic text-secondary-800">
                {t.landing.features.transparency.title}
              </h3>
              <p className="text-secondary-600 text-center font-arabic leading-relaxed">
                {t.landing.features.transparency.description}
              </p>
            </div>
          </div>
        </section>

        {!user && (
          <section className="bg-primary-500 text-white py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold mb-6 font-arabic">
                {isRTL ? 'ابدأ رحلتك اليوم' : 'Start Your Journey Today'}
              </h2>
              <p className="text-xl mb-8 font-arabic">
                {isRTL
                  ? 'انضم لآلاف المربين الذين يستخدمون نظامنا'
                  : 'Join thousands of breeders using our system'}
              </p>
              <Link
                to="/register"
                className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream-50 transition shadow-lg font-arabic"
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
