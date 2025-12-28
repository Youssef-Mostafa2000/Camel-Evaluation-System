import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { Upload, Cpu, FileText } from 'lucide-react';

export function HowItWorks() {
  const { t, isRTL } = useLanguage();

  const steps = [
    {
      icon: <Upload className="w-12 h-12 text-blue-600" />,
      title: t.howItWorks.step1.title,
      description: t.howItWorks.step1.description,
      color: 'blue',
    },
    {
      icon: <Cpu className="w-12 h-12 text-green-600" />,
      title: t.howItWorks.step2.title,
      description: t.howItWorks.step2.description,
      color: 'green',
    },
    {
      icon: <FileText className="w-12 h-12 text-orange-600" />,
      title: t.howItWorks.step3.title,
      description: t.howItWorks.step3.description,
      color: 'orange',
    },
  ];

  return (
    <Layout>
      <div className="bg-gray-50">
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4 font-arabic">
              {t.howItWorks.title}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex flex-col md:flex-row gap-8 items-center ${
                    isRTL ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-24 h-24 bg-${step.color}-100 rounded-full flex items-center justify-center shadow-lg`}
                    >
                      {step.icon}
                    </div>
                  </div>
                  <div
                    className={`flex-1 bg-white p-8 rounded-xl shadow-lg ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span
                        className={`text-4xl font-bold text-${step.color}-600`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-2xl font-bold font-arabic">
                        {step.title}
                      </h2>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed font-arabic">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 font-arabic">
              {isRTL ? 'جرب النظام الآن' : 'Try the System Now'}
            </h2>
            <p className="text-xl mb-8 font-arabic">
              {isRTL
                ? 'سجل مجانًا واحصل على أول تقييم بدون تكلفة'
                : 'Register for free and get your first evaluation at no cost'}
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
