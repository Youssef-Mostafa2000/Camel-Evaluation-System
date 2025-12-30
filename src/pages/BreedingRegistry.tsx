import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Heart, MapPin, Star, Filter, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  saudiProvinces,
  camelBreeds,
  camelSexes,
  getBreedLabel,
  getProvinceLabel,
  getSexLabel,
  calculateCompatibilityScore,
} from '../lib/camel-data';

interface CamelProfile {
  id: string;
  name: string;
  sex: string;
  age: number;
  breed_type: string;
  color: string;
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
  user_id: string;
}

export default function BreedingRegistry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [camels, setCamels] = useState<CamelProfile[]>([]);
  const [filteredCamels, setFilteredCamels] = useState<CamelProfile[]>([]);
  const [myCamels, setMyCamels] = useState<CamelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [filters, setFilters] = useState({
    sex: '',
    minAge: '',
    maxAge: '',
    breed: '',
    province: '',
    minScore: '',
    maxScore: '',
    minHeadScore: '',
    maxHeadScore: '',
    minNeckScore: '',
    maxNeckScore: '',
    minBodyScore: '',
    maxBodyScore: '',
    minSizeScore: '',
    maxSizeScore: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCamels();
    loadMyCamels();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [camels, searchTerm, filters]);

  const loadCamels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('camel_profiles')
        .select('*')
        .eq('is_available_for_breeding', true)
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCamels(data || []);
    } catch (err: any) {
      console.error('Error loading camels:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCamels = async () => {
    try {
      const { data, error } = await supabase
        .from('camel_profiles')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setMyCamels(data || []);
    } catch (err: any) {
      console.error('Error loading my camels:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...camels];

    if (searchTerm) {
      filtered = filtered.filter(
        (camel) =>
          camel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          camel.location_city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.sex) {
      filtered = filtered.filter((camel) => camel.sex === filters.sex);
    }

    if (filters.minAge) {
      filtered = filtered.filter((camel) => camel.age >= parseInt(filters.minAge));
    }

    if (filters.maxAge) {
      filtered = filtered.filter((camel) => camel.age <= parseInt(filters.maxAge));
    }

    if (filters.breed) {
      filtered = filtered.filter((camel) => camel.breed_type === filters.breed);
    }

    if (filters.province) {
      filtered = filtered.filter((camel) => camel.location_province === filters.province);
    }

    if (filters.minScore) {
      filtered = filtered.filter((camel) => camel.overall_score >= parseFloat(filters.minScore));
    }

    if (filters.maxScore) {
      filtered = filtered.filter((camel) => camel.overall_score <= parseFloat(filters.maxScore));
    }

    if (filters.minHeadScore) {
      filtered = filtered.filter((camel) => camel.head_beauty_score >= parseFloat(filters.minHeadScore));
    }

    if (filters.maxHeadScore) {
      filtered = filtered.filter((camel) => camel.head_beauty_score <= parseFloat(filters.maxHeadScore));
    }

    if (filters.minNeckScore) {
      filtered = filtered.filter((camel) => camel.neck_beauty_score >= parseFloat(filters.minNeckScore));
    }

    if (filters.maxNeckScore) {
      filtered = filtered.filter((camel) => camel.neck_beauty_score <= parseFloat(filters.maxNeckScore));
    }

    if (filters.minBodyScore) {
      filtered = filtered.filter((camel) => camel.body_hump_limbs_score >= parseFloat(filters.minBodyScore));
    }

    if (filters.maxBodyScore) {
      filtered = filtered.filter((camel) => camel.body_hump_limbs_score <= parseFloat(filters.maxBodyScore));
    }

    if (filters.minSizeScore) {
      filtered = filtered.filter((camel) => camel.body_size_score >= parseFloat(filters.minSizeScore));
    }

    if (filters.maxSizeScore) {
      filtered = filtered.filter((camel) => camel.body_size_score <= parseFloat(filters.maxSizeScore));
    }

    setFilteredCamels(filtered);
  };

  const clearFilters = () => {
    setFilters({
      sex: '',
      minAge: '',
      maxAge: '',
      breed: '',
      province: '',
      minScore: '',
      maxScore: '',
      minHeadScore: '',
      maxHeadScore: '',
      minNeckScore: '',
      maxNeckScore: '',
      minBodyScore: '',
      maxBodyScore: '',
      minSizeScore: '',
      maxSizeScore: '',
    });
    setSearchTerm('');
  };

  const getCompatibilityForCamel = (camel: CamelProfile): number => {
    if (myCamels.length === 0) return 0;

    const scores = myCamels.map(myCamel =>
      calculateCompatibilityScore(myCamel, camel)
    );

    return Math.max(...scores);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-brown-800 mb-2">Breeding Registry</h1>
            <p className="text-lg text-sand-700">
              Find the perfect breeding match for your camel
            </p>
          </div>
          <Link
            to="/breeding/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add My Camel
          </Link>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-sand-50 transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
              {Object.values(filters).some(v => v !== '') && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overall Score</label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Head Beauty Score</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minHeadScore}
                      onChange={(e) => setFilters({ ...filters, minHeadScore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxHeadScore}
                      onChange={(e) => setFilters({ ...filters, maxHeadScore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCamels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">No camels found</p>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredCamels.length} of {camels.length} camels
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCamels.map((camel) => {
                const compatibility = getCompatibilityForCamel(camel);
                return (
                  <Link
                    key={camel.id}
                    to={`/breeding/${camel.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="relative h-64">
                      <img
                        src={camel.primary_image_url}
                        alt={camel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-brown-800">
                          {getSexLabel(camel.sex)}
                        </div>
                      </div>
                      {compatibility > 0 && (
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-white" />
                            {compatibility}% Match
                          </div>
                        </div>
                      )}
                      <button className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                        <Heart className="w-5 h-5 text-red-500" />
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-brown-800 mb-1">{camel.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {camel.location_city}, {getProvinceLabel(camel.location_province)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-gold-600 mb-1">
                            <Star className="w-5 h-5 fill-gold-500" />
                            <span className="text-lg font-bold">{camel.overall_score.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-gray-500">{camel.age} years</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Head</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {camel.head_beauty_score.toFixed(0)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Neck</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {camel.neck_beauty_score.toFixed(0)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Body</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {camel.body_hump_limbs_score.toFixed(0)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Size</div>
                          <div className="text-sm font-semibold text-brown-700">
                            {camel.body_size_score.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{getBreedLabel(camel.breed_type)}</span>
                        <span>{camel.view_count} views</span>
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
