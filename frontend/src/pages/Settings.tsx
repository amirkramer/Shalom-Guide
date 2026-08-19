import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Globe, MapPin, Bell, Moon, CreditCard, Info, Phone, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface AppLanguage {
  id: number;
  code: string;
  flag: string;
  name: string;
  sort_order: number;
}

// Persisted client-side (no login/auth flow wired up yet, so there's no user
// account to attach real preferences to). Swap for a backend-backed profile
// once auth is in place.
const SETTINGS_KEY = 'shalomGuide.settings';
const cities = ['Jerusalem', 'Tel Aviv', 'Haifa', 'Beer Sheva', 'Eilat'];
const currencyOptions = ['₪ ILS only', '₪ + USD', '₪ + EUR'];

interface AppSettings {
  language: string;
  city: string;
  shabbatAlert: boolean;
  securityAlerts: boolean;
  currency: string;
  darkMode: boolean;
  emergencyContact: { name: string; phone: string } | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  city: 'Jerusalem',
  shabbatAlert: true,
  securityAlerts: true,
  currency: currencyOptions[0],
  darkMode: false,
  emergencyContact: null,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-5 rounded-full relative transition-colors ${on ? 'bg-[#003F87]' : 'bg-[#D4C5A9]/30'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? 'right-0.5' : 'left-0.5'}`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<AppLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // NOT applying the `.dark` class here on purpose: the app's CSS variables
    // for dark mode exist (index.css), but almost no component actually uses
    // them — most cards/icons use hardcoded light colors (bg-white, etc.)
    // while `body` inherits the near-white `--foreground` text color in dark
    // mode. That mismatch made icons/text render white-on-white and
    // unreadable app-wide. The preference is still saved for when a real
    // dark theme is built, it just doesn't visually apply yet.
    document.documentElement.classList.remove('dark');
  }, [settings]);

  const loadLanguages = async () => {
    setLoading(true);
    try {
      const data = await api.getAppLanguages();
      setLanguages(data);
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    update('emergencyContact', { name: contactName.trim(), phone: contactPhone.trim() });
    setShowContactForm(false);
    setContactName('');
    setContactPhone('');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#003F87]" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Settings</h1>
        </div>

        <div className="space-y-3">
          {/* Language */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Globe size={18} className="text-[#003F87]" />
              <span className="font-body font-semibold text-sm text-[#1A1A2E]">Language</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => update('language', lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body transition-colors ${
                    lang.code === settings.language ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
            {settings.language !== 'en' && (
              <p className="text-[10px] font-body text-[#1A1A2E]/40 mt-2">
                Note: content translation isn't implemented yet — this only saves your preference for now.
              </p>
            )}
          </div>

          {/* Current City */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <MapPin size={18} className="text-[#003F87]" />
              <span className="font-body font-semibold text-sm text-[#1A1A2E]">Current City</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => update('city', city)}
                  className={`px-3 py-2 rounded-xl text-xs font-body transition-colors ${
                    city === settings.city ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Bell size={18} className="text-[#003F87]" />
              <span className="font-body font-semibold text-sm text-[#1A1A2E]">Notifications</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-[#1A1A2E]/70">Shabbat alert (1h before)</span>
                <Toggle on={settings.shabbatAlert} onClick={() => update('shabbatAlert', !settings.shabbatAlert)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-[#1A1A2E]/70">Security alerts</span>
                <Toggle on={settings.securityAlerts} onClick={() => update('securityAlerts', !settings.securityAlerts)} />
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard size={18} className="text-[#003F87]" />
              <span className="font-body font-semibold text-sm text-[#1A1A2E]">Currency Display</span>
            </div>
            <div className="flex gap-2">
              {currencyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => update('currency', option)}
                  className={`px-3 py-2 rounded-xl text-xs font-body transition-colors ${
                    option === settings.currency ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-[#003F87]" />
                <span className="font-body font-semibold text-sm text-[#1A1A2E]">Dark Mode</span>
              </div>
              <Toggle on={settings.darkMode} onClick={() => update('darkMode', !settings.darkMode)} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Phone size={18} className="text-[#C0392B]" />
              <span className="font-body font-semibold text-sm text-[#1A1A2E]">Emergency Contact</span>
            </div>

            {settings.emergencyContact ? (
              <div className="flex items-center justify-between bg-[#FAF8F5] rounded-xl p-3">
                <div>
                  <p className="text-xs font-body font-semibold text-[#1A1A2E]">{settings.emergencyContact.name}</p>
                  <a href={`tel:${settings.emergencyContact.phone}`} className="text-[10px] font-body text-[#003F87]">
                    {settings.emergencyContact.phone}
                  </a>
                </div>
                <button onClick={() => update('emergencyContact', null)} className="p-1.5 text-[#1A1A2E]/40">
                  <X size={14} />
                </button>
              </div>
            ) : showContactForm ? (
              <div className="space-y-2">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name"
                  className="w-full bg-[#FAF8F5] rounded-xl px-3 py-2 text-xs font-body outline-none border border-[#D4C5A9]/30"
                />
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-[#FAF8F5] rounded-xl px-3 py-2 text-xs font-body outline-none border border-[#D4C5A9]/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveContact}
                    className="flex-1 bg-[#003F87] text-white text-xs py-2 rounded-xl font-body font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 bg-[#FAF8F5] text-[#1A1A2E]/60 text-xs py-2 rounded-xl font-body font-medium border border-[#D4C5A9]/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowContactForm(true)}
                className="w-full bg-[#FAF8F5] text-[#1A1A2E]/50 text-xs py-3 rounded-xl font-body border border-dashed border-[#D4C5A9]/50"
              >
                + Add personal emergency contact
              </button>
            )}
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-[#003F87]" />
              <div>
                <span className="font-body font-semibold text-sm text-[#1A1A2E]">About</span>
                <p className="text-[10px] font-body text-[#1A1A2E]/50">Shalom Guide v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
