import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Plus, Calendar, DollarSign, MessageCircle, Trash2 } from 'lucide-react';

const client = createClient();

interface Booking {
  id: number;
  tour_title: string;
  booking_date: string;
  total_price: number;
  commission_amount: number;
  guide_amount: number;
  status: string;
  guide_paid: boolean;
  created_at: string | null;
}

interface Tour {
  id: number;
  title: string;
  description: string;
  city: string;
  duration_hours: number;
  price_ils: number;
  max_participants: number;
  is_active: boolean;
}

export default function GuideDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'tours'>('bookings');
  const [loading, setLoading] = useState(true);
  const [showAddTour, setShowAddTour] = useState(false);

  // New tour form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMax, setNewMax] = useState('8');
  const [addingTour, setAddingTour] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) {
        setUser(res.data);
        loadData();
      } else {
        client.auth.toLogin();
      }
    } catch {
      client.auth.toLogin();
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, toursRes] = await Promise.all([
        client.apiCall.invoke({ url: '/api/v1/guide/guide-bookings', method: 'GET', data: {} }),
        client.entities.tours.query({ query: {}, sort: '-created_at', limit: 50 }),
      ]);
      setBookings(bookingsRes.data?.items || []);
      setTours(toursRes.data?.items || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTour = async () => {
    if (!newTitle || !newDesc || !newCity || !newDuration || !newPrice) {
      alert('Please fill all fields');
      return;
    }
    setAddingTour(true);
    try {
      // Get guide profile to get guide_id
      const guidesRes = await client.entities.guides.query({ query: {}, limit: 1 });
      const guideId = guidesRes.data?.items?.[0]?.id;
      if (!guideId) {
        alert('Guide profile not found. Please register first.');
        return;
      }

      await client.entities.tours.create({
        data: {
          guide_id: guideId,
          title: newTitle,
          description: newDesc,
          city: newCity,
          duration_hours: parseFloat(newDuration),
          price_ils: parseFloat(newPrice),
          max_participants: parseInt(newMax) || 8,
          is_active: true,
        },
      });
      setShowAddTour(false);
      setNewTitle('');
      setNewDesc('');
      setNewCity('');
      setNewDuration('');
      setNewPrice('');
      loadData();
    } catch (error: any) {
      alert(error?.data?.detail || 'Failed to add tour');
    } finally {
      setAddingTour(false);
    }
  };

  const deleteTour = async (tourId: number) => {
    if (!confirm('Delete this tour?')) return;
    try {
      await client.entities.tours.delete({ id: String(tourId) });
      loadData();
    } catch (error) {
      alert('Failed to delete tour');
    }
  };

  const totalEarnings = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.guide_amount, 0);

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/hire-guide')} className="p-1">
          <ArrowLeft className="w-5 h-5 text-[#1A1A2E]" />
        </button>
        <h1 className="font-heading font-bold text-[#1A1A2E]">Guide Dashboard</h1>
      </div>

      <div className="px-4 pb-24 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#003F87] rounded-xl p-3 text-center text-white">
            <p className="text-lg font-bold">₪{totalEarnings.toFixed(0)}</p>
            <p className="text-[10px] opacity-80">Earnings</p>
          </div>
          <div className="bg-[#4A7C59] rounded-xl p-3 text-center text-white">
            <p className="text-lg font-bold">{bookings.filter((b) => b.status === 'confirmed').length}</p>
            <p className="text-[10px] opacity-80">Confirmed</p>
          </div>
          <div className="bg-[#C8A96E] rounded-xl p-3 text-center text-white">
            <p className="text-lg font-bold">{tours.length}</p>
            <p className="text-[10px] opacity-80">Tours</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'bookings' ? 'bg-white shadow text-[#003F87]' : 'text-gray-500'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('tours')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'tours' ? 'bg-white shadow text-[#003F87]' : 'text-gray-500'
            }`}
          >
            My Tours
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : activeTab === 'bookings' ? (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No bookings yet</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#1A1A2E]">{booking.tour_title}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {booking.booking_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ₪{booking.guide_amount}
                    </span>
                  </div>
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => navigate(`/hire-guide/chat/${booking.id}`)}
                      className="flex items-center gap-1 mt-2 text-xs text-[#003F87] font-medium"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat with tourist
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddTour(true)}
              className="w-full border-2 border-dashed border-[#003F87]/30 rounded-xl p-4 flex items-center justify-center gap-2 text-[#003F87] text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add New Tour
            </button>

            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1A1A2E]">{tour.title}</h4>
                  <button onClick={() => deleteTour(tour.id)} className="text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{tour.city} • {tour.duration_hours}h • ₪{tour.price_ils}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Tour Modal */}
      {showAddTour && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-[#1A1A2E]">Add New Tour</h3>
              <button onClick={() => setShowAddTour(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tour title"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Tour description"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="City (e.g. Jerusalem)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Hours"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price ₪"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                value={newMax}
                onChange={(e) => setNewMax(e.target.value)}
                placeholder="Max pax"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            <button
              onClick={handleAddTour}
              disabled={addingTour}
              className="w-full bg-[#003F87] text-white font-medium py-3 rounded-full disabled:opacity-50"
            >
              {addingTour ? 'Adding...' : 'Add Tour'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}