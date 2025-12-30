import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Share2,
  Edit,
  MessageCircle,
  Star,
  Eye,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  getBreedLabel,
  getColorLabel,
  getProvinceLabel,
  getSexLabel,
  calculateCompatibilityScore,
} from '../lib/camel-data';
import BeautyScoreCard from '../components/BeautyScoreCard';

interface CamelProfile {
  id: string;
  user_id: string;
  name: string;
  sex: string;
  age: number;
  breed_type: string;
  color: string;
  location_province: string;
  location_city: string;
  description: string;
  primary_image_url: string;
  overall_score: number;
  head_beauty_score: number;
  neck_beauty_score: number;
  body_hump_limbs_score: number;
  body_size_score: number;
  owner_contact_phone: string;
  owner_contact_email: string;
  owner_contact_whatsapp: string;
  view_count: number;
  inquiry_count: number;
  created_at: string;
}

export default function BreedingProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [camel, setCamel] = useState<CamelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [myCamels, setMyCamels] = useState<any[]>([]);
  const [selectedCamel, setSelectedCamel] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCamelProfile();
    loadMyCamels();
    checkFavorite();
    incrementViewCount();
  }, [id, user]);

  const loadCamelProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('camel_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCamel(data);
    } catch (err: any) {
      console.error('Error loading camel profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCamels = async () => {
    try {
      const { data, error } = await supabase
        .from('camel_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_available_for_breeding', true);

      if (error) throw error;
      setMyCamels(data || []);
    } catch (err: any) {
      console.error('Error loading my camels:', err);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from('camel_favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('camel_id', id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorite(!!data);
    } catch (err: any) {
      console.error('Error checking favorite:', err);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_camel_view_count', { camel_id: id });
    } catch (err: any) {
      console.error('Error incrementing view count:', err);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await supabase
          .from('camel_favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('camel_id', id);
        setIsFavorite(false);
      } else {
        await supabase
          .from('camel_favorites')
          .insert([{ user_id: user?.id, camel_id: id }]);
        setIsFavorite(true);
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleSendInquiry = async () => {
    if (!selectedCamel || !inquiryMessage) return;

    setSending(true);
    try {
      const myCamel = myCamels.find(c => c.id === selectedCamel);
      const compatibility = calculateCompatibilityScore(myCamel, camel!);

      const { error } = await supabase
        .from('breeding_inquiries')
        .insert([{
          from_user_id: user?.id,
          to_user_id: camel?.user_id,
          from_camel_id: selectedCamel,
          to_camel_id: id,
          message: inquiryMessage,
          compatibility_score: compatibility,
        }]);

      if (error) throw error;

      setShowInquiryForm(false);
      setInquiryMessage('');
      alert('Inquiry sent successfully!');
    } catch (err: any) {
      console.error('Error sending inquiry:', err);
      alert('Failed to send inquiry');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!camel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Camel not found</p>
      </div>
    );
  }

  const isOwner = user?.id === camel.user_id;
  const bestCompatibility = myCamels.length > 0
    ? Math.max(...myCamels.map(mc => calculateCompatibilityScore(mc, camel)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brown-700 hover:text-brown-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          <div className="relative h-96">
            <img
              src={camel.primary_image_url}
              alt={camel.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            <div className="absolute top-6 right-6 flex gap-3">
              {isOwner ? (
                <Link
                  to={`/breeding/${id}/edit`}
                  className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <Edit className="w-5 h-5 text-brown-700" />
                </Link>
              ) : (
                <>
                  <button
                    onClick={toggleFavorite}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-brown-700'
                      }`}
                    />
                  </button>
                  <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                    <Share2 className="w-5 h-5 text-brown-700" />
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{camel.name}</h1>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {camel.location_city}, {getProvinceLabel(camel.location_province)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {camel.age} years
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {camel.view_count} views
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-8 h-8 fill-gold-400 text-gold-400" />
                    <span className="text-4xl font-bold text-white">{camel.overall_score.toFixed(1)}</span>
                  </div>
                  <div className="text-white/90 text-sm">Overall Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {!isOwner && bestCompatibility > 0 && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-1">
                      {bestCompatibility}% Compatibility Match
                    </h3>
                    <p className="text-green-700">
                      This camel has high compatibility with your camel{myCamels.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInquiryForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Inquiry
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Sex</h3>
                <p className="text-lg font-semibold text-brown-800">{getSexLabel(camel.sex)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Breed</h3>
                <p className="text-lg font-semibold text-brown-800">{getBreedLabel(camel.breed_type)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Color</h3>
                <p className="text-lg font-semibold text-brown-800">{getColorLabel(camel.color)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <BeautyScoreCard
                score={camel.head_beauty_score}
                label="Head Beauty"
                icon={<span className="text-lg">👤</span>}
              />
              <BeautyScoreCard
                score={camel.neck_beauty_score}
                label="Neck Beauty"
                icon={<span className="text-lg">🦒</span>}
              />
              <BeautyScoreCard
                score={camel.body_hump_limbs_score}
                label="Body & Hump"
                icon={<span className="text-lg">🐪</span>}
              />
              <BeautyScoreCard
                score={camel.body_size_score}
                label="Body Size"
                icon={<span className="text-lg">📏</span>}
              />
            </div>

            {camel.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-brown-800 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {camel.description}
                </p>
              </div>
            )}

            {!isOwner && (
              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-brown-800 mb-6">Contact Owner</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {camel.owner_contact_phone && (
                    <a
                      href={`tel:${camel.owner_contact_phone}`}
                      className="flex items-center gap-3 p-4 bg-sand-50 rounded-lg hover:bg-sand-100 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-sand-700" />
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium text-brown-800">{camel.owner_contact_phone}</div>
                      </div>
                    </a>
                  )}
                  {camel.owner_contact_email && (
                    <a
                      href={`mailto:${camel.owner_contact_email}`}
                      className="flex items-center gap-3 p-4 bg-sand-50 rounded-lg hover:bg-sand-100 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-sand-700" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium text-brown-800">{camel.owner_contact_email}</div>
                      </div>
                    </a>
                  )}
                  {camel.owner_contact_whatsapp && (
                    <a
                      href={`https://wa.me/${camel.owner_contact_whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-green-700" />
                      <div>
                        <div className="text-sm text-gray-600">WhatsApp</div>
                        <div className="font-medium text-green-800">{camel.owner_contact_whatsapp}</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showInquiryForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-brown-800 mb-6">Send Breeding Inquiry</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Camel
                  </label>
                  <select
                    value={selectedCamel}
                    onChange={(e) => setSelectedCamel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    required
                  >
                    <option value="">Choose a camel</option>
                    {myCamels.map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        {mc.name} - {getSexLabel(mc.sex)} - Score: {mc.overall_score.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={4}
                    placeholder="Introduce yourself and explain your breeding inquiry..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowInquiryForm(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInquiry}
                    disabled={sending || !selectedCamel || !inquiryMessage}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
