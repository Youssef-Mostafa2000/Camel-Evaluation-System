import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Layout } from '../components/Layout';
import { Mail, MapPin, Phone } from 'lucide-react';

export function Contact() {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <Layout>
      <div className="bg-gray-50">
        <section className="bg-primary-500 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4 font-arabic">
              {t.contact.title}
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className="text-3xl font-bold mb-6 font-arabic">
                {isRTL ? 'تواصل معنا' : 'Get in Touch'}
              </h2>
              <p className="text-gray-700 font-arabic leading-relaxed">
                {isRTL
                  ? 'نحن هنا للإجابة على أي أسئلة قد تكون لديك حول منصتنا'
                  : 'We are here to answer any questions you may have about our platform'}
              </p>

              <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary-500" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-bold mb-1 font-arabic">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </h3>
                  <p className="text-gray-600">info@camelai.com</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-bold mb-1 font-arabic">
                    {isRTL ? 'الهاتف' : 'Phone'}
                  </h3>
                  <p className="text-gray-600">+966 50 123 4567</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-bold mb-1 font-arabic">
                    {isRTL ? 'العنوان' : 'Address'}
                  </h3>
                  <p className="text-gray-600 font-arabic">
                    {isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-green-600 font-bold font-arabic">
                    {t.contact.success}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {t.contact.name}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {t.contact.email}
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
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 font-arabic ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {t.contact.message}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-arabic"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition font-arabic"
                  >
                    {t.contact.send}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
