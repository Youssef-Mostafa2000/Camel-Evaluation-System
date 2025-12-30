import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function Footer() {
  const { language, setLanguage, isRTL } = useLanguage();
  const currentYear = new Date().getFullYear();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <footer className="bg-brown-800 text-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`grid md:grid-cols-4 gap-8 mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div>
            <h3 className="text-2xl font-bold text-sand-400 mb-4 font-arabic">
              {language === 'ar' ? 'جمال الإبل' : 'CamelBeauty'}
            </h3>
            <p className="text-cream-200 mb-4 font-arabic leading-relaxed">
              {language === 'ar'
                ? 'منصة متكاملة لتقييم جمال الإبل باستخدام الذكاء الاصطناعي'
                : 'The complete platform for AI-powered camel beauty evaluation'}
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 bg-sand-700 hover:bg-sand-600 rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-sand-700 hover:bg-sand-600 rounded-lg transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-sand-700 hover:bg-sand-600 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-sand-700 hover:bg-sand-600 rounded-lg transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-sand-400 mb-4 font-arabic">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'الرئيسية' : 'Home'}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'من نحن' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'كيف يعمل' : 'How It Works'}
                </Link>
              </li>
              <li>
                <Link
                  to="/detection"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'كشف الجمال' : 'Beauty Detection'}
                </Link>
              </li>
              <li>
                <Link
                  to="/breeding"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'التزاوج' : 'Breeding'}
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'السوق' : 'Marketplace'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-sand-400 mb-4 font-arabic">
              {language === 'ar' ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-cream-200 hover:text-sand-400 transition-colors font-arabic"
                >
                  {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-sand-400 mb-4 font-arabic">
              {language === 'ar' ? 'تواصل معنا' : 'Contact Info'}
            </h4>
            <ul className="space-y-3">
              <li className={`flex items-center gap-2 text-cream-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-4 h-4 text-sand-400" />
                <span className="font-arabic">+966 50 123 4567</span>
              </li>
              <li className={`flex items-center gap-2 text-cream-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail className="w-4 h-4 text-sand-400" />
                <a
                  href="mailto:info@camelbeauty.sa"
                  className="hover:text-sand-400 transition-colors"
                >
                  info@camelbeauty.sa
                </a>
              </li>
              <li className={`flex items-start gap-2 text-cream-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4 text-sand-400 mt-1" />
                <span className="font-arabic">
                  {language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t border-sand-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <p className="text-cream-300 text-sm font-arabic">
            {language === 'ar'
              ? `© ${currentYear} جمال الإبل. جميع الحقوق محفوظة.`
              : `© ${currentYear} CamelBeauty. All rights reserved.`}
          </p>

          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-sand-700 hover:bg-sand-600 rounded-lg transition-colors text-sm font-semibold font-arabic"
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </footer>
  );
}
