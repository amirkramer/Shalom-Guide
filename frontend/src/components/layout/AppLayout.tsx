import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import SOSButton from './SOSButton';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showSOS?: boolean;
}

export default function AppLayout({ children, showNav = true, showSOS = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#FAF8F5] w-full max-w-[430px] mx-auto relative overflow-x-hidden">
      <div className="israel-gradient-bar w-full" />
      <div className={showNav ? "pb-20" : ""}>
        {children}
      </div>
      {showSOS && <SOSButton />}
      {showNav && <BottomNav />}
    </div>
  );
}