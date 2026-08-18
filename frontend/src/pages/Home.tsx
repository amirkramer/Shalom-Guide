import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardModule {
  id: number;
  icon: string;
  label: string;
  path: string;
  subtitle?: string;
  highlight?: boolean;
  sort_order: number;
}

interface QuickAccessItem {
  id: number;
  icon: string;
  label: string;
  action: string;
  sort_order: number;
}

// Real destinations for each quick-access action. Phone numbers match the
// Emergency page's own data (backend/mock_data/emergency_services.json) so
// the two pages never show different numbers for the same service.
const QUICK_ACCESS_TEL: Record<string, string> = {
  yadsarah: '1-800-36-0036',
  hatzalah: '1221',
  mda: '101',
};

interface ShabbatTime {
  id: number;
  city: string;
  parasha: string;
  candle_lighting: string;
  havdalah: string;
  date_friday: string;
  hebrew_date: string;
  is_current: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const [dashboardModules, setDashboardModules] = useState<DashboardModule[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessItem[]>([]);
  const [shabbatData, setShabbatData] = useState<ShabbatTime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modules, quickItems, shabbatItems] = await Promise.all([
        api.getDashboardModules(),
        api.getQuickAccessItems(),
        api.getShabbatTimes('Jerusalem'),
      ]);
      setDashboardModules(modules);
      setQuickAccess(quickItems);
      setShabbatData(shabbatItems.length > 0 ? shabbatItems[0] : null);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#003F87]" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppHeader />

      <div className="px-4 space-y-4 pb-4">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#003F87] to-[#003F87]/80 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <img
            src="https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqindwicai2a/hero-jerusalem-golden-hour.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15"
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs opacity-80 font-body">{shabbatData?.hebrew_date || ''}</p>
                <p className="text-xs opacity-80 font-body">{shabbatData?.date_friday || ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-body">☀️ 28°C</p>
                <p className="text-xs opacity-80 font-body">{shabbatData?.city || 'Jerusalem'}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 mb-3">
              <div className="flex items-center gap-2">
                <span>⏳</span>
                <div>
                  <p className="text-sm font-semibold font-body">Shabbat this week</p>
                  <p className="text-xs opacity-80 font-body">
                    Candle lighting: {shabbatData?.candle_lighting || '--:--'} | {shabbatData?.parasha || ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-[#4A7C59] text-white text-[10px] px-2 py-0.5 rounded-full font-body font-medium">
                ✅ Situation: Normal
              </span>
            </div>
          </div>
        </div>

        {/* Hire a Guide CTA */}
        <button
          onClick={() => navigate('/hire-guide')}
          className="w-full bg-gradient-to-r from-[#C8A96E] to-[#B8944E] rounded-2xl p-4 text-white shadow-md active:scale-[0.98] transition-transform text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 text-4xl">🧭</div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-sm">Hire a Guide</p>
              <p className="text-xs opacity-90 font-body mt-0.5">Connect with certified local guides</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-lg">👤</span>
            </div>
          </div>
        </button>

        {/* Module Grid */}
        <div className="grid grid-cols-2 gap-3">
          {dashboardModules.map((module) => (
            <button
              key={module.path}
              onClick={() => navigate(module.path)}
              className={`bg-white rounded-2xl p-4 shadow-sm border text-left active:scale-95 transition-all star-pattern ${
                module.highlight
                  ? 'border-[#C8A96E] ring-1 ring-[#C8A96E]/30 relative overflow-hidden'
                  : 'border-[#D4C5A9]/20 hover:border-[#003F87]/20'
              }`}
            >
              {module.highlight && <div className="absolute inset-0 shimmer pointer-events-none" />}
              <span className="text-2xl mb-2 block">{module.icon}</span>
              <p className="font-body font-semibold text-sm text-[#1A1A2E]">{module.label}</p>
              {module.subtitle && (
                <p className="text-[10px] text-[#1A1A2E]/50 font-body mt-0.5">{module.subtitle}</p>
              )}
              {module.highlight && (
                <p className="text-[10px] text-[#C8A96E] font-body mt-1 font-medium">✨ Plan my trip with AI</p>
              )}
            </button>
          ))}
        </div>

        {/* Quick Access */}
        <div>
          <p className="text-xs font-body text-[#1A1A2E]/50 mb-2 font-medium">Quick Access</p>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {quickAccess.map((item) => {
              const chipClass =
                'flex-shrink-0 flex items-center gap-1.5 bg-white rounded-full px-3 py-2 shadow-sm border border-[#D4C5A9]/20 text-xs font-body font-medium text-[#1A1A2E]/80 hover:border-[#003F87]/20 active:scale-95 transition-all';
              const phone = QUICK_ACCESS_TEL[item.action];
              if (phone) {
                return (
                  <a key={item.action} href={`tel:${phone}`} className={chipClass}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                );
              }
              const to = item.action === 'sos' ? '/emergency' : item.action === 'currency' ? '/useful-info' : '/emergency';
              return (
                <button key={item.action} onClick={() => navigate(to)} className={chipClass}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}