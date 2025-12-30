import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Star, ShoppingBag, Heart, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { formatPrice } from '../lib/camel-data';

export default function Account() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalDetections: 0,
    breedingProfiles: 0,
    breedingInquiries: 0,
    marketplaceListings: 0,
    favoriteListings: 0,
    offers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);

      const [
        detectionsRes,
        profilesRes,
        inquiriesRes,
        listingsRes,
        favoritesRes,
        offersRes,
      ] = await Promise.all([
        supabase.from('camel_detections').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('camel_profiles').select('id', { count: 'exact', head: true }).eq('owner_id', user?.id),
        supabase.from('breeding_inquiries').select('id', { count: 'exact', head: true }).eq('sender_id', user?.id),
        supabase.from('commerce_listings').select('id', { count: 'exact', head: true }).eq('seller_id', user?.id),
        supabase.from('listing_favorites').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('commerce_offers').select('id', { count: 'exact', head: true }).eq('buyer_id', user?.id),
      ]);

      setStats({
        totalDetections: detectionsRes.count || 0,
        breedingProfiles: profilesRes.count || 0,
        breedingInquiries: inquiriesRes.count || 0,
        marketplaceListings: listingsRes.count || 0,
        favoriteListings: favoritesRes.count || 0,
        offers: offersRes.count || 0,
      });
    } catch (err: any) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-brown-800 mb-2">My Account</h1>
            <p className="text-lg text-sand-700">
              Manage your profile and view your activity
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-sand-400 to-gold-500 h-32"></div>
                <div className="px-6 pb-6">
                  <div className="flex justify-center -mt-16 mb-4">
                    <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <User className="w-16 h-16 text-sand-600" />
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-brown-800 mb-1">
                      {profile.full_name || 'User'}
                    </h2>
                    <p className="text-sm text-sand-600 capitalize">
                      {profile.role} Account
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4 text-sand-500" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {profile.phone_number && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-4 h-4 text-sand-500" />
                        <span className="text-sm">{profile.phone_number}</span>
                      </div>
                    )}
                    {profile.location_province && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin className="w-4 h-4 text-sand-500" />
                        <span className="text-sm">{profile.location_city}, {profile.location_province}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-4 h-4 text-sand-500" />
                      <span className="text-sm">
                        Joined {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="block w-full py-3 bg-gradient-to-r from-sand-400 to-gold-500 text-white rounded-lg text-center font-semibold hover:from-sand-500 hover:to-gold-600 transition-all shadow-md"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-brown-800 mb-6">Activity Overview</h3>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Link
                      to="/detection/history"
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Beauty Detections</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.totalDetections}</p>
                      </div>
                    </Link>

                    <Link
                      to="/breeding"
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="p-3 bg-green-500 rounded-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Breeding Profiles</p>
                        <p className="text-2xl font-bold text-green-700">{stats.breedingProfiles}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Breeding Inquiries</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.breedingInquiries}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <div className="p-3 bg-orange-500 rounded-lg">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">My Listings</p>
                        <p className="text-2xl font-bold text-orange-700">{stats.marketplaceListings}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                      <div className="p-3 bg-pink-500 rounded-lg">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Saved Favorites</p>
                        <p className="text-2xl font-bold text-pink-700">{stats.favoriteListings}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                      <div className="p-3 bg-teal-500 rounded-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Offers Made</p>
                        <p className="text-2xl font-bold text-teal-700">{stats.offers}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-brown-800 mb-6">Quick Actions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    to="/detection"
                    className="flex items-center gap-3 p-4 border-2 border-gold-200 rounded-lg hover:bg-gold-50 hover:border-gold-400 transition-all"
                  >
                    <Star className="w-5 h-5 text-gold-500" />
                    <span className="font-semibold text-brown-800">New Beauty Detection</span>
                  </Link>

                  <Link
                    to="/breeding/new"
                    className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all"
                  >
                    <FileText className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-brown-800">Create Breeding Profile</span>
                  </Link>

                  <Link
                    to="/marketplace"
                    className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all"
                  >
                    <ShoppingBag className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-brown-800">Browse Marketplace</span>
                  </Link>

                  <Link
                    to="/camels"
                    className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-all"
                  >
                    <FileText className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold text-brown-800">My Camels</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
