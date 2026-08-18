import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Camera, Check } from 'lucide-react';

const client = createClient();

const CITY_OPTIONS = ['Jerusalem', 'Tel Aviv', 'Haifa', 'Dead Sea', 'Negev', 'Galilee', 'Eilat', 'Safed', 'Tiberias', 'Golan Heights'];
const LANGUAGE_OPTIONS = ['English', 'Hebrew', 'Arabic', 'Spanish', 'French', 'Portuguese', 'Russian', 'German', 'Italian', 'Chinese', 'Japanese', 'Yiddish'];
const SPECIALTY_OPTIONS = ['Jewish History', 'Christian Sites', 'Food Tours', 'Nightlife', 'Hiking', 'Wine Tours', 'Desert Adventures', 'Archaeology', 'Art & Culture', 'Photography', 'Kabbalah', 'Nature & Wildlife'];

export default function GuideRegister() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) {
        setUser(res.data);
      } else {
        client.auth.toLogin();
      }
    } catch {
      client.auth.toLogin();
    }
  };

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !bio || !paypalEmail || selectedLanguages.length === 0 || selectedCities.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await client.entities.guides.create({
        data: {
          name,
          bio,
          paypal_email: paypalEmail,
          languages: selectedLanguages.join(', '),
          cities: selectedCities.join(', '),
          specialties: selectedSpecialties.join(', '),
          photo_url: '',
          rating: 0,
          total_reviews: 0,
          is_active: true,
        },
      });
      setSuccess(true);
    } catch (error: any) {
      alert(error?.data?.detail || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-16 h-16 bg-[#4A7C59] rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">Registration Complete!</h2>
          <p className="text-sm text-gray-600 font-body mb-6">
            Your guide profile has been created. You can now add tours from your dashboard.
          </p>
          <button
            onClick={() => navigate('/hire-guide/dashboard')}
            className="bg-[#003F87] text-white font-medium px-6 py-3 rounded-full"
          >
            Go to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/hire-guide')} className="p-1">
          <ArrowLeft className="w-5 h-5 text-[#1A1A2E]" />
        </button>
        <h1 className="font-heading font-bold text-[#1A1A2E]">Register as Guide</h1>
      </div>

      <div className="px-4 pb-24 pt-4 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Bio / About You *</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell tourists about yourself, your experience, and what makes your tours special..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none"
          />
        </div>

        {/* Languages */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-2">Languages Spoken *</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                onClick={() => toggleItem(lang, selectedLanguages, setSelectedLanguages)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedLanguages.includes(lang)
                    ? 'bg-[#003F87] text-white border-[#003F87]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-2">Areas You Cover *</label>
          <div className="flex flex-wrap gap-2">
            {CITY_OPTIONS.map((city) => (
              <button
                key={city}
                onClick={() => toggleItem(city, selectedCities, setSelectedCities)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedCities.includes(city)
                    ? 'bg-[#003F87] text-white border-[#003F87]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-2">Specialties</label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((spec) => (
              <button
                key={spec}
                onClick={() => toggleItem(spec, selectedSpecialties, setSelectedSpecialties)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedSpecialties.includes(spec)
                    ? 'bg-[#C8A96E] text-white border-[#C8A96E]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* PayPal Email */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">PayPal Email (for payments) *</label>
          <input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="your-paypal@email.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            You'll receive 90% of each booking payment via PayPal
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#003F87] text-white font-medium py-3 rounded-full disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Complete Registration'}
        </button>
      </div>
    </AppLayout>
  );
}