import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, Loader2, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  saudiProvinces,
  camelBreeds,
  camelColors,
  camelSexes,
  calculateOverallScore,
} from '../lib/camel-data';

interface CamelProfile {
  name: string;
  sex: string;
  age: string;
  breed_type: string;
  color: string;
  location_province: string;
  location_city: string;
  description: string;
  owner_contact_phone: string;
  owner_contact_email: string;
  owner_contact_whatsapp: string;
  pedigree_info: string;
  breeding_history: string;
}

export default function BreedingProfileForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CamelProfile>({
    name: '',
    sex: '',
    age: '',
    breed_type: '',
    color: '',
    location_province: '',
    location_city: '',
    description: '',
    owner_contact_phone: profile?.phone || '',
    owner_contact_email: profile?.email || '',
    owner_contact_whatsapp: '',
    pedigree_info: '',
    breeding_history: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      loadCamelProfile();
    }
  }, [user, id]);

  const loadCamelProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('camel_profiles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          sex: data.sex,
          age: data.age?.toString() || '',
          breed_type: data.breed_type || '',
          color: data.color || '',
          location_province: data.location_province || '',
          location_city: data.location_city || '',
          description: data.description || '',
          owner_contact_phone: data.owner_contact_phone || '',
          owner_contact_email: data.owner_contact_email || '',
          owner_contact_whatsapp: data.owner_contact_whatsapp || '',
          pedigree_info: JSON.stringify(data.pedigree_info || ''),
          breeding_history: JSON.stringify(data.breeding_history || ''),
        });

        if (data.primary_image_url) {
          setImagePreview(data.primary_image_url);
        }

        if (data.detection_id) {
          setDetectionResult({
            head_beauty_score: data.head_beauty_score,
            neck_beauty_score: data.neck_beauty_score,
            body_hump_limbs_score: data.body_hump_limbs_score,
            body_size_score: data.body_size_score,
            overall_score: data.overall_score,
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading camel profile:', err);
      setError('Failed to load camel profile');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setDetectionResult(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id}/breeding/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('camel-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('camel-images')
        .getPublicUrl(uploadData.path);

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-camel-beauty`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          imageUrl: publicUrl,
          saveToDatabase: false,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      setDetectionResult(result.detection);
      setImagePreview(publicUrl);
      setSuccess('Image analyzed successfully!');
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!detectionResult) {
        setError('Please analyze the image first');
        setLoading(false);
        return;
      }

      const overallScore = calculateOverallScore(
        detectionResult.head_beauty_score,
        detectionResult.neck_beauty_score,
        detectionResult.body_hump_limbs_score,
        detectionResult.body_size_score
      );

      const profileData = {
        user_id: user?.id,
        name: formData.name,
        sex: formData.sex,
        age: parseInt(formData.age),
        breed_type: formData.breed_type,
        color: formData.color,
        location_province: formData.location_province,
        location_city: formData.location_city,
        description: formData.description,
        owner_contact_phone: formData.owner_contact_phone,
        owner_contact_email: formData.owner_contact_email,
        owner_contact_whatsapp: formData.owner_contact_whatsapp,
        pedigree_info: formData.pedigree_info ? JSON.parse(formData.pedigree_info) : {},
        breeding_history: formData.breeding_history ? JSON.parse(formData.breeding_history) : [],
        primary_image_url: imagePreview,
        head_beauty_score: detectionResult.head_beauty_score,
        neck_beauty_score: detectionResult.neck_beauty_score,
        body_hump_limbs_score: detectionResult.body_hump_limbs_score,
        body_size_score: detectionResult.body_size_score,
        overall_score: overallScore,
        is_available_for_breeding: true,
      };

      let result;
      if (id) {
        result = await supabase
          .from('camel_profiles')
          .update(profileData)
          .eq('id', id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('camel_profiles')
          .insert([profileData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setSuccess(id ? 'Profile updated successfully!' : 'Profile created successfully!');
      setTimeout(() => {
        navigate('/breeding');
      }, 2000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-gold-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brown-700 hover:text-brown-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brown-800 mb-2">
            {id ? 'Edit Camel Profile' : 'Create Camel Profile'}
          </h1>
          <p className="text-lg text-sand-700">
            Add your camel to the breeding registry
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-brown-800 mb-6">Camel Image & Analysis</h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-sand-300 rounded-xl p-8">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Camel preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setDetectionResult(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-sand-600 mx-auto mb-4" />
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 inline-block"
                    >
                      Select Image
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                      Upload a clear photo of your camel
                    </p>
                  </div>
                )}
              </div>

              {imageFile && !detectionResult && (
                <button
                  type="button"
                  onClick={handleAnalyzeImage}
                  disabled={analyzing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Image with AI
                    </>
                  )}
                </button>
              )}

              {detectionResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">Analysis Complete</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Head Beauty</p>
                      <p className="text-2xl font-bold text-green-700">
                        {detectionResult.head_beauty_score.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Neck Beauty</p>
                      <p className="text-2xl font-bold text-green-700">
                        {detectionResult.neck_beauty_score.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Body & Hump</p>
                      <p className="text-2xl font-bold text-green-700">
                        {detectionResult.body_hump_limbs_score.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Body Size</p>
                      <p className="text-2xl font-bold text-green-700">
                        {detectionResult.body_size_score.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-brown-800 mb-6">Basic Information</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Camel Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sex *
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                >
                  <option value="">Select sex</option>
                  {camelSexes.map((sex) => (
                    <option key={sex.value} value={sex.value}>
                      {sex.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age (years) *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="1"
                  max="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed Type *
                </label>
                <select
                  name="breed_type"
                  value={formData.breed_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                >
                  <option value="">Select breed</option>
                  {camelBreeds.map((breed) => (
                    <option key={breed.value} value={breed.value}>
                      {breed.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                >
                  <option value="">Select color</option>
                  {camelColors.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province *
                </label>
                <select
                  name="location_province"
                  value={formData.location_province}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                >
                  <option value="">Select province</option>
                  {saudiProvinces.map((province) => (
                    <option key={province.value} value={province.value}>
                      {province.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="location_city"
                  value={formData.location_city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your camel's characteristics, temperament, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-brown-800 mb-6">Contact Information</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="owner_contact_phone"
                  value={formData.owner_contact_phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="owner_contact_email"
                  value={formData.owner_contact_email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  name="owner_contact_whatsapp"
                  value={formData.owner_contact_whatsapp}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border-2 border-sand-300 text-brown-700 rounded-lg hover:bg-sand-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !detectionResult}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving...' : id ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
