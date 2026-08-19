import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Home from './pages/Home';
import Transport from './pages/Transport';
import Gastronomy from './pages/Gastronomy';
import Tourism from './pages/Tourism';
import Shabbat from './pages/Shabbat';
import Emergency from './pages/Emergency';
import AIItinerary from './pages/AIItinerary';
import KnowledgeBase from './pages/KnowledgeBase';
import Experiences from './pages/Experiences';
import UsefulInfo from './pages/UsefulInfo';
import Settings from './pages/Settings';
import Accommodation from './pages/Accommodation';
import ShoppingHome from './pages/ShoppingHome';
import ShoppingSearch from './pages/ShoppingSearch';
import ShoppingBrand from './pages/ShoppingBrand';
import ShoppingStore from './pages/ShoppingStore';
import ShoppingOffer from './pages/ShoppingOffer';
import AuthCallback from './pages/AuthCallback';
import HireGuide from './pages/HireGuide';
import GuideProfile from './pages/GuideProfile';
import GuideRegister from './pages/GuideRegister';
import GuideDashboard from './pages/GuideDashboard';
import BookingChat from './pages/BookingChat';
import PaymentSuccess from './pages/PaymentSuccess';

const queryClient = new QueryClient();

// Auto-set onboarded for demo so home dashboard shows by default
if (!localStorage.getItem('onboarded')) {
  localStorage.setItem('onboarded', 'true');
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/home" element={<Home />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/transport" element={<Transport />} />
    <Route path="/gastronomy" element={<Gastronomy />} />
    <Route path="/tourism" element={<Tourism />} />
    <Route path="/shabbat" element={<Shabbat />} />
    <Route path="/emergency" element={<Emergency />} />
    <Route path="/ai-itinerary" element={<AIItinerary />} />
    <Route path="/knowledge-base" element={<KnowledgeBase />} />
    <Route path="/experiences" element={<Experiences />} />
    <Route path="/useful-info" element={<UsefulInfo />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/accommodation" element={<Accommodation />} />
    <Route path="/shopping" element={<ShoppingHome />} />
    <Route path="/shopping/search" element={<ShoppingSearch />} />
    <Route path="/shopping/brand/:id" element={<ShoppingBrand />} />
    <Route path="/shopping/store/:id" element={<ShoppingStore />} />
    <Route path="/shopping/offer/:id" element={<ShoppingOffer />} />
    <Route path="/hire-guide" element={<HireGuide />} />
    <Route path="/hire-guide/profile/:id" element={<GuideProfile />} />
    <Route path="/hire-guide/register" element={<GuideRegister />} />
    <Route path="/hire-guide/dashboard" element={<GuideDashboard />} />
    <Route path="/hire-guide/chat/:bookingId" element={<BookingChat />} />
    <Route path="/payment-success" element={<PaymentSuccess />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };