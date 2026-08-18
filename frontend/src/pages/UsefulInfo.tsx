import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    icon: '💱',
    title: 'Currency Converter',
    content: (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {[
            { currency: 'USD', rate: 3.62 },
            { currency: 'EUR', rate: 3.95 },
            { currency: 'GBP', rate: 4.58 },
            { currency: 'BRL', rate: 0.65 },
            { currency: 'RUB', rate: 0.04 },
            { currency: 'CAD', rate: 2.68 },
          ].map((item) => (
            <div key={item.currency} className="bg-[#FAF8F5] rounded-lg p-2 flex items-center justify-between">
              <span className="text-xs font-body text-[#1A1A2E]/70">{item.currency}</span>
              <span className="font-mono-data text-xs text-[#003F87]">₪{item.rate}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] font-body text-[#1A1A2E]/40">Last updated: July 15, 2026 09:00</p>
      </div>
    ),
  },
  {
    icon: '🌤️',
    title: 'Weather by Region',
    content: (
      <div className="grid grid-cols-2 gap-2">
        {[
          { city: 'Tel Aviv', temp: '30°C', condition: '☀️ Sunny' },
          { city: 'Jerusalem', temp: '28°C', condition: '⛅ Partly cloudy' },
          { city: 'Haifa', temp: '29°C', condition: '☀️ Sunny' },
          { city: 'Eilat', temp: '40°C', condition: '☀️ Hot' },
          { city: 'Dead Sea', temp: '38°C', condition: '☀️ Hot' },
          { city: 'Negev', temp: '36°C', condition: '☀️ Dry' },
        ].map((item) => (
          <div key={item.city} className="bg-[#FAF8F5] rounded-lg p-2">
            <p className="text-xs font-body font-medium text-[#1A1A2E]">{item.city}</p>
            <p className="font-mono-data text-sm text-[#003F87]">{item.temp}</p>
            <p className="text-[10px] font-body text-[#1A1A2E]/50">{item.condition}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '⚠️',
    title: 'Security Status',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 bg-[#4A7C59] rounded-full" />
          <span className="text-xs font-body font-medium text-[#4A7C59]">Normal — No active alerts</span>
        </div>
        <p className="text-[10px] font-body text-[#1A1A2E]/50">Pikud HaOref (Home Front Command) has no active alerts for your region.</p>
      </div>
    ),
  },
  {
    icon: '✈️',
    title: 'Ben Gurion Airport',
    content: (
      <div className="space-y-2">
        <p className="text-xs font-body text-[#1A1A2E]/60">Terminal 3 — International flights</p>
        <div className="space-y-1">
          <p className="text-[10px] font-body text-[#1A1A2E]/50">🚂 Train to Tel Aviv: ₪13.5 (20 min)</p>
          <p className="text-[10px] font-body text-[#1A1A2E]/50">🚕 Taxi to Tel Aviv: ~₪150</p>
          <p className="text-[10px] font-body text-[#1A1A2E]/50">🚕 Taxi to Jerusalem: ~₪300</p>
          <p className="text-[10px] font-body text-[#1A1A2E]/50">🚌 Sherut (shared taxi): ₪64</p>
        </div>
      </div>
    ),
  },
  {
    icon: '📱',
    title: 'Essential Apps in Israel',
    content: (
      <div className="space-y-2">
        {[
          { name: 'Waze', desc: 'Navigation (Israeli-made!)' },
          { name: 'Gett', desc: 'Taxi/ride hailing' },
          { name: 'Moovit', desc: 'Public transport' },
          { name: 'Yad2', desc: 'Classifieds & rentals' },
          { name: 'Zap', desc: 'Price comparison' },
        ].map((app) => (
          <div key={app.name} className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-body font-medium text-[#1A1A2E]">{app.name}</p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">{app.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '💡',
    title: 'Practical Tips',
    content: (
      <div className="space-y-2 text-xs font-body text-[#1A1A2E]/70">
        <p><strong>Tipping:</strong> 10-15% at restaurants. Not expected at cafes.</p>
        <p><strong>Outlets:</strong> Type H (3-pin) and Type C (2-pin). 220V.</p>
        <p><strong>SIM cards:</strong> Available at airport. Cellcom, Partner, or Pelephone.</p>
        <p><strong>Kosher:</strong> Dairy and meat never mixed. Separate restaurants.</p>
        <p><strong>Holy sites:</strong> Cover shoulders and knees. Men: head covering at Western Wall.</p>
        <p><strong>Hebrew basics:</strong> Shalom (hello/bye), Toda (thanks), Bevakasha (please).</p>
        <p><strong>Bargaining:</strong> Expected at markets (shuk), not in stores.</p>
        <p><strong>Shabbat elevator:</strong> Stops at every floor automatically.</p>
      </div>
    ),
  },
];

export default function UsefulInfo() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<number[]>([0]);

  const toggleSection = (index: number) => {
    setOpenSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Useful Info</h1>
        </div>

        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section.title} className="bg-white rounded-2xl border border-[#D4C5A9]/20 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-body font-semibold text-sm text-[#1A1A2E]">{section.title}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-[#1A1A2E]/40 transition-transform ${openSections.includes(index) ? 'rotate-180' : ''}`}
                />
              </button>
              {openSections.includes(index) && (
                <div className="px-4 pb-4">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}