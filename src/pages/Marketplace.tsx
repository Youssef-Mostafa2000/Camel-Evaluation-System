import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Heart, MapPin, Star, Filter, X, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  saudiProvinces,
  camelBreeds,
  camelSexes,
  getBreedLabel,
  getProvinceLabel,
  getSexLabel,
  formatPrice,
  calculateDaysRemaining,
} from '../lib/camel-data';

interface Listing {
  id: string;
  title: string;
  price: number;
  is_negotiable: boolean;
  is_featured: boolean;
  camel_name: string;
  camel_sex: string;
  camel_age: number;
  camel_breed: string;
  camel_color: string;
  location_province: string;
  location_city: string;
  primary_image_url: string;
  overall_score: number;
  head_beauty_score: number;
  neck_beauty_score: number;
  body_hump_limbs_score: number;
  body_size_score: number;
  view_count: number;
  inquiry_count: number;
  offer_count: number;
  expires_at: string;
  seller_id: string;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [filters, setFilters] = useState({
    sex: '',
    minAge: '',
    maxAge: '',
    breed: '',
    province: '',
    minPrice: '',
    maxPrice: '',
    minScore: '',
    maxScore: '',
    negotiable: false,
  });

  const [stats, setStats] = useState({
    totalListings: 0,
    averagePrice: 0,
    highestScore: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadListings();
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [listings, searchTerm, filters, sortBy]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commerce_listings')
        .select('*')
        .eq('listing_status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allListings = data || [];
      setListings(allListings);

      const featured = allListings.filter(l => l.is_featured).slice(0, 5);
      setFeaturedListings(featured);

      const total = allListings.length;
      const avgPrice = total > 0
        ? allListings.reduce((sum, l) => sum + Number(l.price), 0) / total
        : 0;
      const maxScore = total > 0
        ? Math.max(...allListings.map(l => l.overall_score || 0))
        : 0;

      setStats({
        totalListings: total,
        averagePrice: avgPrice,
        highestScore: maxScore,
      });
    } catch (err: any) {
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...listings];

    if (searchTerm) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.camel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.location_city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.sex) {
      filtered = filtered.filter((l) => l.camel_sex === filters.sex);
    }

    if (filters.minAge) {
      filtered = filtered.filter((l) => l.camel_age >= parseInt(filters.minAge));
    }

    if (filters.maxAge) {
      filtered = filtered.filter((l) => l.camel_age <= parseInt(filters.maxAge));
    }

    if (filters.breed) {
      filtered = filtered.filter((l) => l.camel_breed === filters.breed);
    }

    if (filters.province) {
      filtered = filtered.filter((l) => l.location_province === filters.province);
    }

    if (filters.minPrice) {
      filtered = filtered.filter((l) => l.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((l) => l.price <= parseFloat(filters.maxPrice));
    }

    if (filters.minScore) {
      filtered = filtered.filter((l) => (l.overall_score || 0) >= parseFloat(filters.minScore));
    }

    if (filters.maxScore) {
      filtered = filtered.filter((l) => (l.overall_score || 0) <= parseFloat(filters.maxScore));
    }

    if (filters.negotiable) {
      filtered = filtered.filter((l) => l.is_negotiable);
    }

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'score':
        filtered.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'newest':
      default:
        break;
    }

    setFilteredListings(filtered);
  };

  const clearFilters = () => {
    setFilters({
      sex: '',
      minAge: '',
      maxAge: '',
      breed: '',
      province: '',
      minPrice: '',
      maxPrice: '',
      minScore: '',
      maxScore: '',
      negotiable: false,
    });
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-brown-800 mb-2">Camel Marketplace</h1>
            <p className="text-lg text-sand-700">
              Buy premium camels from verified sellers
            </p>
          </div>
          <Link
            to="/marketplace/sell"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            List Your Camel
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-sand-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Listings</h3>
              <TrendingUp className="w-5 h-5 text-gold-500" />
            </div>
            <p className="text-3xl font-bold text-brown-800">{stats.totalListings}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-sand-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Average Price</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-brown-800">
              {formatPrice(stats.averagePrice)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-sand-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Highest Score</h3>
              <Star className="w-5 h-5 text-gold-500 fill-gold-500" />
            </div>
            <p className="text-3xl font-bold text-brown-800">{stats.highestScore.toFixed(1)}</p>
          </div>
        </div>

        {featuredListings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-brown-800 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-gold-500 fill-gold-500" />
              Featured Listings
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/marketplace/${listing.id}`}
                  className="bg-gradient-to-br from-gold-100 to-gold-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border-2 border-gold-300"
                >
                  <div className="relative h-48">
                    <img
                      src={listing.primary_image_url}
                      alt={listing.camel_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <div className="px-3 py-1 bg-gold-500 text-white rounded-full text-xs font-bold">
                        FEATURED
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-brown-800">
                        {getSexLabel(listing.camel_sex)}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-brown-800 mb-2">{listing.title}</h3>
                    <p className="text-2xl font-bold text-gold-600 mb-2">
                      {formatPrice(listing.price)}
                      {listing.is_negotiable && (
                        <span className="text-sm text-gray-600 ml-2">Negotiable</span>
                      )}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {listing.location_city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                        {listing.overall_score?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, title, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="score">Highest Score</option>
              <option value="popular">Most Popular</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-sand-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
              {Object.values(filters).some(v => v !== '' && v !== false) && (
                <span className="px-2 py-0.5 bg-gold-500 text-white text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-brown-800">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                  <select
                    value={filters.sex}
                    onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Any</option>
                    {camelSexes.map((sex) => (
                      <option key={sex.value} value={sex.value}>
                        {sex.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                  <select
                    value={filters.breed}
                    onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Any</option>
                    {camelBreeds.map((breed) => (
                      <option key={breed.value} value={breed.value}>
                        {breed.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select
                    value={filters.province}
                    onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Any</option>
                    {saudiProvinces.map((province) => (
                      <option key={province.value} value={province.value}>
                        {province.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minAge}
                      onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxAge}
                      onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (SAR)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beauty Score</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minScore}
                      onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxScore}
                      onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.negotiable}
                      onChange={(e) => setFilters({ ...filters, negotiable: e.target.checked })}
                      className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Negotiable Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">No listings found</p>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredListings.length} of {listings.length} listings
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const daysRemaining = calculateDaysRemaining(listing.expires_at);
                return (
                  <Link
                    key={listing.id}
                    to={`/marketplace/${listing.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="relative h-64">
                      <img
                        src={listing.primary_image_url}
                        alt={listing.camel_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-brown-800">
                          {getSexLabel(listing.camel_sex)}
                        </div>
                      </div>
                      {daysRemaining <= 7 && (
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {daysRemaining}d left
                          </div>
                        </div>
                      )}
                      <button className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                        <Heart className="w-5 h-5 text-red-500" />
                      </button>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-brown-800 mb-1">{listing.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span>{listing.camel_name}</span>
                        <span>•</span>
                        <span>{listing.camel_age} years</span>
                        <span>•</span>
                        <span>{getBreedLabel(listing.camel_breed)}</span>
                      </div>

                      <div className="mb-4">
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(listing.price)}
                        </p>
                        {listing.is_negotiable && (
                          <p className="text-sm text-gray-600">Negotiable</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Head</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {listing.head_beauty_score?.toFixed(0) || '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Neck</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {listing.neck_beauty_score?.toFixed(0) || '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Body</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {listing.body_hump_limbs_score?.toFixed(0) || '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Size</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {listing.body_size_score?.toFixed(0) || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {listing.location_city}, {getProvinceLabel(listing.location_province)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                          {listing.overall_score?.toFixed(1) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
