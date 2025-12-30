import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Detection {
  id: string;
  image_url: string;
  image_filename: string;
  overall_score: number;
  category: 'beautiful' | 'ugly';
  created_at: string;
}

export default function DetectionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDetections();
  }, [user]);

  const loadDetections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('camel_detections')
        .select('id, image_url, image_filename, overall_score, category, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDetections(data || []);
    } catch (err: any) {
      console.error('Error loading detections:', err);
      setError('Failed to load detection history');
    } finally {
      setLoading(false);
    }
  };

  const getStarCount = (score: number) => {
    return Math.round((score / 100) * 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

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

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-brown-800 mb-4">Detection History</h1>
          <p className="text-lg text-sand-700">
            View all your previous camel beauty detections
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : detections.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-sand-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brown-700 mb-2">No detections yet</h2>
            <p className="text-sand-600 mb-8">Start by uploading your first camel image</p>
            <Link
              to="/detection"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              Start Detection
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="relative h-64">
                  <img
                    src={detection.image_url}
                    alt={detection.image_filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        detection.category === 'beautiful'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {detection.category === 'beautiful' ? '✨ Beautiful' : '⚠️ Fair'}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                      <p className="text-3xl font-bold text-gold-600">
                        {detection.overall_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < getStarCount(detection.overall_score)
                              ? 'fill-gold-500 text-gold-500'
                              : 'fill-gray-300 text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(detection.created_at)}</span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-4">
                    {detection.image_filename}
                  </p>

                  <button
                    onClick={() => {}}
                    className="w-full px-4 py-2 bg-sand-100 text-brown-700 rounded-lg hover:bg-sand-200 transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
