import { useState, useEffect } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';

interface AppHeaderProps {
  title?: string;
  city?: string;
  showLogo?: boolean;
}

interface AppLanguage {
  id: number;
  code: string;
  flag: string;
  name: string;
  sort_order: number;
}

export default function AppHeader({ title, city = 'Jerusalem', showLogo = true }: AppHeaderProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [languages, setLanguages] = useState<AppLanguage[]>([]);

  useEffect(() => {
    api.getAppLanguages().then(setLanguages).catch(console.error);
  }, []);

  return (
    <header className="px-4 py-3 flex items-center justify-between relative bg-[#FAF8F5]/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-2 flex-shrink-0">
        {showLogo && (
          <span className="font-display text-lg font-bold text-[#003F87]">
            {title || 'Shalom Guide'}
          </span>
        )}
      </div>

      {city && (
        <div className="flex items-center gap-1 text-sm text-[#1A1A2E]/70 font-body">
          <span>📍</span>
          <span>{city}</span>
          <ChevronDown size={14} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="text-lg"
            aria-label="Language selector"
          >
            🇺🇸
          </button>
          {langOpen && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-[#D4C5A9]/30 p-2 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLangOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#FAF8F5] w-full text-left"
                >
                  <span>{lang.flag}</span>
                  <span className="text-xs font-body">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="relative" aria-label="Notifications">
          <Bell size={18} className="text-[#1A1A2E]/60" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#C0392B] rounded-full" />
        </button>
      </div>
    </header>
  );
}