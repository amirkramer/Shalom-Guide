import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Star, MapPin, Globe, Clock, Users, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authHeader } from '@/lib/authStorage';
import { getAPIBaseURL } from '@/lib/config';

interface Guide {
  id: number;
  name: string;
  bio: string;
  photo_url: string | null;
  languages: string;
  specialties: string | null;
  cities: string;
  rating: number;
  total_reviews: number;
}

interface Tour {
  id: number;
  title: string;
  description: string;
  city: string;
  duration_hours: number;
  price_ils: number;
  max_participants: number;
}

export default function GuideProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${getAPIBaseURL()}/api/v1/guide/profile/${id}`);
      setGuide(response.data?.guide || null);
      setTours(response.data?.tours || []);
    } catch (error) {
      console.error('Failed to load guide profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTour = async (tour: Tour) => {
    if (!user) {
      navigate(`/login?from=/hire-guide/profile/${id}`);
      return;
    }
    setBookingTour(tour);
  };

  const confirmBooking = async () => {
    if (!bookingTour || !bookingDate) return;
    setIsBooking(true);
    try {
      const response = await axios.post(
        `${getAPIBaseURL()}/api/v1/payment/create_payment_session`,
        {
          tour_id: bookingTour.id,
          booking_date: bookingDate,
          success_url: '/payment-success',
          cancel_url: '/hire-guide',
        },
        // The backend builds success_url/cancel_url from the App-Host header
        // (see routers/payments.py) rather than the body fields above — without
        // it, frontend_host is None and Stripe rejects the resulting URL.
        { headers: { ...authHeader(), 'App-Host': window.location.origin } }
      );
      window.location.href = response.data.url;
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Failed to start checkout');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!guide) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p>Guide not found</p>
          <button onClick={() => navigate('/hire-guide')} className="text-[#003F87] mt-2">
            Back to guides
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
        <h1 className="font-heading font-bold text-[#1A1A2E]">Guide Profile</h1>
      </div>

      <div className="px-4 pb-24 space-y-4 pt-4">
        {/* Guide Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <img
            src={guide.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
            alt={guide.name}
            className="w-20 h-20 rounded-full object-cover border-3 border-[#C8A96E] mx-auto mb-3"
          />
          <h2 className="font-heading font-bold text-lg text-[#1A1A2E]">{guide.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="w-4 h-4 fill-[#C8A96E] text-[#C8A96E]" />
            <span className="text-sm font-bold">{guide.rating}</span>
            <span className="text-xs text-gray-400">({guide.total_reviews} reviews)</span>
          </div>

          <p className="text-sm text-gray-600 font-body mt-3 text-left">{guide.bio}</p>

          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <div className="flex items-center gap-1 bg-[#F0EDE8] px-2 py-1 rounded-full">
              <Globe className="w-3 h-3 text-[#003F87]" />
              <span className="text-xs text-[#003F87] font-medium">{guide.languages}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#F0EDE8] px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-[#003F87]" />
              <span className="text-xs text-[#003F87] font-medium">{guide.cities}</span>
            </div>
          </div>

          {guide.specialties && (
            <div className="flex flex-wrap gap-1 mt-3 justify-center">
              {guide.specialties.split(',').map((spec, i) => (
                <span key={i} className="bg-[#003F87]/10 text-[#003F87] text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {spec.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tours Section */}
        <div>
          <h3 className="font-heading font-bold text-[#1A1A2E] mb-3">Available Tours</h3>
          <div className="space-y-3">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h4 className="font-heading font-bold text-sm text-[#1A1A2E]">{tour.title}</h4>
                <p className="text-xs text-gray-600 font-body mt-1">{tour.description}</p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{tour.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{tour.duration_hours}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Max {tour.max_participants}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-[#C8A96E]" />
                    <span className="font-bold text-[#003F87]">₪{tour.price_ils}</span>
                    <span className="text-xs text-gray-400">/ tour</span>
                  </div>
                  <button
                    onClick={() => handleBookTour(tour)}
                    className="bg-[#003F87] text-white text-xs font-medium px-4 py-2 rounded-full"
                  >
                    Book This Tour
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingTour && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[#1A1A2E]">Book Tour</h3>
              <button onClick={() => setBookingTour(null)} className="text-gray-400 text-xl">✕</button>
            </div>

            <div className="bg-[#F0EDE8] rounded-xl p-3">
              <p className="font-bold text-sm text-[#1A1A2E]">{bookingTour.title}</p>
              <p className="text-xs text-gray-500 mt-1">with {guide.name} • {bookingTour.city}</p>
              <p className="font-bold text-[#003F87] mt-2">₪{bookingTour.price_ils}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Select Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-body">
                💳 Secure payment via Stripe. 10% service fee included. You'll be able to chat with your guide after booking.
              </p>
            </div>

            <button
              onClick={confirmBooking}
              disabled={!bookingDate || isBooking}
              className="w-full bg-[#003F87] text-white font-medium py-3 rounded-full disabled:opacity-50"
            >
              {isBooking ? 'Processing...' : `Pay ₪${bookingTour.price_ils} & Book`}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}