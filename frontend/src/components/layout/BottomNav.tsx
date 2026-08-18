import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Sparkles, BookOpen, Settings } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Compass, label: 'Explore', path: '/tourism' },
  { icon: Sparkles, label: 'AI Trip', path: '/ai-itinerary' },
  { icon: BookOpen, label: 'Learn', path: '/knowledge-base' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-[#D4C5A9]/30 z-40 safe-bottom">
      <div className="flex items-center justify-around py-3 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-[#003F87] bg-[#003F87]/5' : 'text-[#1A1A2E]/40 hover:text-[#1A1A2E]/70'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[11px] font-body ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}