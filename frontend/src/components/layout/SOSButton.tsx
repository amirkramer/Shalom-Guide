import { useState, useEffect } from 'react';
import { Phone, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface EmergencyService {
  id: number;
  service_name: string;
  phone_number: string;
  icon: string;
  description: string;
  color: string;
  category: string;
  priority: number;
}

export default function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [emergencyNumbers, setEmergencyNumbers] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && emergencyNumbers.length === 0) {
      loadEmergencyNumbers();
    }
  }, [isOpen]);

  const loadEmergencyNumbers = async () => {
    setLoading(true);
    try {
      const data = await api.getEmergencyServices();
      setEmergencyNumbers(data);
    } catch (error) {
      console.error('Failed to load emergency services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[76px] right-4 z-50 w-14 h-14 bg-[#C0392B] rounded-full shadow-lg shadow-red-900/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        style={{ right: 'max(16px, calc(50% - 215px + 16px))' }}
        aria-label="Emergency SOS"
      >
        <span className="text-white font-bold text-xs font-body">SOS</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-[350px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-[#C0392B]">Emergency</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[#C0392B]" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {emergencyNumbers.map((item) => (
                  <a
                    key={item.phone_number}
                    href={`tel:${item.phone_number}`}
                    className={`${item.color} text-white rounded-xl p-4 flex flex-col items-center gap-1 active:scale-95 transition-transform`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-bold text-sm font-body">{item.service_name}</span>
                    <span className="text-xs opacity-90 font-mono-data">{item.phone_number}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-body mb-1">Your location</p>
              <p className="font-mono-data text-sm text-[#1A1A2E]">31.7683° N, 35.2137° E</p>
              <button className="mt-2 text-xs text-[#003F87] font-medium font-body flex items-center gap-1 mx-auto">
                <Phone size={12} /> Share location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}