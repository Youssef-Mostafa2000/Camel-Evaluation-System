import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { getBreedLabel, getProvinceLabel, getSexLabel, formatPrice } from '../lib/camel-data';

interface SearchResult {
  id: string;
  type: 'breeding' | 'marketplace';
  name: string;
  title?: string;
  age: number;
  sex: string;
  breed: string;
  location_province: string;
  location_city: string;
  primary_image_url: string;
  overall_score?: number;
  price?: number;
  is_negotiable?: boolean;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'breeding' | 'marketplace'>('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      const [breedingRes, marketplaceRes] = await Promise.all([
        supabase
          .from('camel_profiles')
          .select('*')
          .or(`name.ilike.${searchTerm},location_city.ilike.${searchTerm},camel_breed.ilike.${searchTerm}`)
          .limit(20),
        supabase
          .from('commerce_listings')
          .select('*')
          .eq('listing_status', 'active')
          .or(`title.ilike.${searchTerm},camel_name.ilike.${searchTerm},location_city.ilike.${searchTerm}`)
          .limit(20),
      ]);

      const breedingResults: SearchResult[] = (breedingRes.data || []).map(item => ({
        id: item.id,
        type: 'breeding' as const,
        name: item.name,
        age: item.age,
        sex: item.sex,
        breed: item.camel_breed,
        location_province: item.location_province,
        location_city: item.location_city,
        primary_image_url: item.primary_image_url,
        overall_score: item.overall_score,
      }));

      const marketplaceResults: SearchResult[] = (marketplaceRes.data || []).map(item => ({
        id: item.id,
        type: 'marketplace' as const,
        name: item.camel_name,
        title: item.title,
        age: item.camel_age,
        sex: item.camel_sex,
        breed: item.camel_breed,
        location_province: item.location_province,
        location_city: item.location_city,
        primary_image_url: item.primary_image_url,
        overall_score: item.overall_score,
        price: item.price,
        is_negotiable: item.is_negotiable,
      }));

      setResults([...breedingResults, ...marketplaceResults]);
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true;
    return result.type === activeTab;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-brown-800 mb-8">Search Camels</h1>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, location, breed..."
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setSearchParams({});
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </form>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-sand-50'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('breeding')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'breeding'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-sand-50'
              }`}
            >
              Breeding ({results.filter(r => r.type === 'breeding').length})
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-sand-50'
              }`}
            >
              Marketplace ({results.filter(r => r.type === 'marketplace').length})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                {query ? 'No results found' : 'Start searching'}
              </h3>
              <p className="text-gray-500">
                {query ? 'Try different keywords or filters' : 'Enter a search term to find camels'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={result.type === 'breeding' ? `/breeding/${result.id}` : `/marketplace/${result.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="relative h-48">
                    <img
                      src={result.primary_image_url}
                      alt={result.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <div
                        className={`px-3 py-1 ${
                          result.type === 'breeding' ? 'bg-green-500' : 'bg-blue-500'
                        } text-white rounded-full text-xs font-bold`}
                      >
                        {result.type === 'breeding' ? 'BREEDING' : 'MARKETPLACE'}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-brown-800">
                        {getSexLabel(result.sex)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-xl font-bold text-brown-800 mb-1">
                      {result.title || result.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <span>{result.age} years</span>
                      <span>•</span>
                      <span>{getBreedLabel(result.breed)}</span>
                    </div>

                    {result.price && (
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        {formatPrice(result.price)}
                        {result.is_negotiable && (
                          <span className="text-sm text-gray-600 ml-2">Negotiable</span>
                        )}
                      </p>
                    )}

                    {result.overall_score && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full"
                              style={{ width: `${result.overall_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gold-600">
                            {result.overall_score.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-600">
                      {result.location_city}, {getProvinceLabel(result.location_province)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
