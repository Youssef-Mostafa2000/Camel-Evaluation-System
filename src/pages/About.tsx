import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { Target, Award, BookOpen } from 'lucide-react';

export function About() {
  const { t, isRTL } = useLanguage();

  return (
    <Layout>
      <div className="bg-gray-50">
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4 font-arabic">
              {t.about.title}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className={`bg-white p-8 rounded-xl shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold font-arabic">{t.about.vision}</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed font-arabic">
                {t.about.visionText}
              </p>
            </div>

            <div className={`bg-white p-8 rounded-xl shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold font-arabic">{t.about.mission}</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed font-arabic">
                {t.about.missionText}
              </p>
            </div>

            <div className={`bg-white p-8 rounded-xl shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold font-arabic">{t.about.credibility}</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed font-arabic">
                {t.about.credibilityText}
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
