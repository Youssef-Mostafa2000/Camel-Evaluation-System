import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { Sparkles, Zap, Eye } from 'lucide-react';

export function Landing() {
  const { t, isRTL } = useLanguage();

  return (
    <Layout>
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-arabic leading-tight">
            {t.landing.title}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-arabic leading-relaxed">
            {t.landing.subtitle}
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-arabic"
            >
              {t.landing.cta1}
            </Link>
            <Link
              to="/contact"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition font-arabic"
            >
              {t.landing.cta2}
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 font-arabic">
            {t.landing.features.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center font-arabic">
                {t.landing.features.fairness.title}
              </h3>
              <p className="text-gray-600 text-center font-arabic leading-relaxed">
                {t.landing.features.fairness.description}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center font-arabic">
                {t.landing.features.speed.title}
              </h3>
              <p className="text-gray-600 text-center font-arabic leading-relaxed">
                {t.landing.features.speed.description}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Eye className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center font-arabic">
                {t.landing.features.transparency.title}
              </h3>
              <p className="text-gray-600 text-center font-arabic leading-relaxed">
                {t.landing.features.transparency.description}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-blue-600 text-white py-20">
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
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg font-arabic"
            >
              {t.landing.cta1}
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
