import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Phone, MapPin, Navigation, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getMapsDirectionsUrl } from '@/lib/discoveryLinks';

// Phone numbers verified against each hospital's own site / public directory.
// Where no dedicated adult ER line is published, the hospital's main switchboard
// is used (they route emergencies) rather than guessing a department extension.
const hospitals = [
  { name: 'Hadassah Ein Kerem', city: 'Jerusalem', distance: '3.2 km', emergency: true, languages: 'English, Russian, Arabic', phone: '+972-2-677-7111' },
  { name: 'Ichilov (Sourasky)', city: 'Tel Aviv', distance: '0.8 km', emergency: true, languages: 'English, Russian, Arabic', phone: '*8801' },
  { name: 'Rambam', city: 'Haifa', distance: '1.5 km', emergency: true, languages: 'English, Russian, Arabic', phone: '+972-4-826-7111' },
];

const HATZALAH_APP = {
  android: 'https://play.google.com/store/apps/details?id=global.hatzalah.app',
  ios: 'https://apps.apple.com/us/app/hatzalah-global-assist/id6444089076',
};

const MDA_APP = {
  android: 'https://play.google.com/store/apps/details?id=il.org.mda.mymada',
  ios: 'https://apps.apple.com/il/app/id1151068122',
};

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

export default function Emergency() {
  const navigate = useNavigate();
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyServices();
  }, []);

  const loadEmergencyServices = async () => {
    try {
      const data = await api.getEmergencyServices();
      setEmergencyServices(data);
    } catch (error) {
      console.error('Failed to load emergency services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#C0392B]">Health & Emergency</h1>
        </div>

        {/* Emergency Call Grid */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C0392B]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {emergencyServices.map((item) => (
              <a
                key={item.id}
                href={`tel:${item.phone_number}`}
                className={`${item.color || 'bg-[#C0392B]'} text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-transform`}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="font-body font-bold text-sm">{item.service_name}</span>
                <span className="text-[10px] opacity-80 font-body text-center">{item.description}</span>
                <span className="font-mono-data text-lg font-bold">{item.phone_number}</span>
                <span className="bg-white/20 text-white text-[10px] px-3 py-1 rounded-full font-body font-medium mt-1">
                  🔴 CALL NOW
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-[#003F87]/5 border border-[#003F87]/20 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-[#003F87] flex-shrink-0 mt-0.5" />
            <div className="text-xs font-body text-[#003F87]/80">
              <p className="font-medium mb-1">In Israel: Call Hatzalah (1221) FIRST</p>
              <p>They arrive fastest (~90 sec). Call MDA (101) simultaneously for ambulance transport. Both work together: Hatzalah stabilizes, MDA transports.</p>
            </div>
          </div>
        </div>

        {/* What is Hatzalah */}
        <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏍️</span>
            <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">What is Hatzalah?</h3>
          </div>
          <p className="text-xs font-body text-[#1A1A2E]/60 mb-3">
            6,000+ volunteers on motorcycles providing the fastest emergency response in the world. Average response time: ~90 seconds. They stabilize patients until ambulance arrives.
          </p>
          <div className="flex gap-2">
            <a
              href={HATZALAH_APP.android}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 text-white text-xs py-2.5 rounded-xl font-body font-medium text-center"
            >
              Android
            </a>
            <a
              href={HATZALAH_APP.ios}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 text-white text-xs py-2.5 rounded-xl font-body font-medium text-center"
            >
              iPhone
            </a>
          </div>
        </div>

        {/* What is MDA */}
        <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🚑</span>
            <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">What is Magen David Adom?</h3>
          </div>
          <p className="text-xs font-body text-[#1A1A2E]/60 mb-3">
            Israel's national emergency medical service. Full ambulance service, trauma response, blood bank. Equivalent to Red Cross.
          </p>
          <div className="flex gap-2">
            <a
              href={MDA_APP.android}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-red-500 text-white text-xs py-2.5 rounded-xl font-body font-medium text-center"
            >
              Android
            </a>
            <a
              href={MDA_APP.ios}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-red-500 text-white text-xs py-2.5 rounded-xl font-body font-medium text-center"
            >
              iPhone
            </a>
          </div>
        </div>

        {/* Nearest Hospitals */}
        <h3 className="font-body font-semibold text-sm text-[#1A1A2E] mb-3">Nearest Hospitals</h3>
        <div className="space-y-3 mb-4">
          {hospitals.map((hospital) => (
            <div key={hospital.name} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-body font-semibold text-sm text-[#1A1A2E]">{hospital.name}</h4>
                  <p className="text-[10px] font-body text-[#1A1A2E]/50 flex items-center gap-1">
                    <MapPin size={10} /> {hospital.city} • {hospital.distance}
                  </p>
                </div>
                {hospital.emergency && (
                  <span className="text-[9px] font-body px-2 py-0.5 rounded-full bg-[#C0392B]/10 text-[#C0392B] font-medium">
                    24/7 ER
                  </span>
                )}
              </div>
              <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-3">Languages: {hospital.languages}</p>
              <div className="flex gap-2">
                <a
                  href={`tel:${hospital.phone}`}
                  className="flex-1 bg-[#C0392B] text-white text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                >
                  <Phone size={12} /> Call ER
                </a>
                <a
                  href={getMapsDirectionsUrl(`${hospital.name}, ${hospital.city}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                >
                  <Navigation size={12} /> Navigate
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}