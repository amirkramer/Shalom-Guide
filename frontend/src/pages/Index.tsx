import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface AppLanguage {
  id: number;
  code: string;
  flag: string;
  name: string;
  sort_order: number;
}

interface OnboardingCard {
  id: number;
  title: string;
  icon: string;
  description: string;
  sort_order: number;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'splash' | 'onboarding'>('splash');
  const [currentCard, setCurrentCard] = useState(0);
  const [languages, setLanguages] = useState<AppLanguage[]>([]);
  const [onboardingCards, setOnboardingCards] = useState<OnboardingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('onboarded') === 'true') {
      navigate('/home', { replace: true });
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [langs, cards] = await Promise.all([
        api.getAppLanguages(),
        api.getOnboardingCards(),
      ]);
      setLanguages(langs);
      setOnboardingCards(cards);
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] max-w-[390px] mx-auto flex items-center justify-center">
        <Loader2 className="animate-spin text-[#003F87]" size={32} />
      </div>
    );
  }

  const handleLanguageSelect = () => {
    setStep('onboarding');
  };

  const handleGetStarted = () => {
    localStorage.setItem('onboarded', 'true');
    navigate('/home');
  };

  if (step === 'splash') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] max-w-[390px] mx-auto flex flex-col items-center justify-center px-8 relative overflow-hidden">
        {/* Jerusalem skyline silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10">
          <svg viewBox="0 0 390 200" className="w-full h-full" fill="#003F87">
            <path d="M0 200 L0 150 L20 150 L20 130 L25 120 L30 130 L30 150 L50 150 L50 140 L55 100 L60 140 L60 150 L80 150 L80 120 L85 80 L87 75 L89 80 L90 120 L90 150 L110 150 L110 130 L115 110 L120 130 L120 150 L140 150 L140 100 L145 60 L148 55 L150 50 L152 55 L155 60 L160 100 L160 150 L180 150 L180 140 L185 120 L190 140 L190 150 L210 150 L210 110 L215 70 L218 65 L220 60 L222 65 L225 70 L230 110 L230 150 L250 150 L250 130 L255 100 L260 130 L260 150 L280 150 L280 140 L285 110 L290 140 L290 150 L310 150 L310 120 L315 90 L318 85 L320 80 L322 85 L325 90 L330 120 L330 150 L350 150 L350 140 L355 130 L360 140 L360 150 L390 150 L390 200 Z" />
          </svg>
        </div>

        {/* Logo */}
        <div className="text-center mb-12 relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#003F87]/10 flex items-center justify-center">
            <span className="text-4xl">✡️</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-[#003F87] mb-2">Shalom Guide</h1>
          <p className="text-[#C8A96E] font-body text-lg font-medium">Israel in Your Hands</p>
        </div>

        {/* Language selection */}
        <div className="w-full relative z-10">
          <p className="text-center text-sm text-[#1A1A2E]/60 font-body mb-4">Choose your language</p>
          <div className="flex flex-wrap justify-center gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={handleLanguageSelect}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white shadow-sm border border-[#D4C5A9]/20 hover:border-[#003F87]/30 hover:shadow-md transition-all active:scale-95"
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-[10px] font-body text-[#1A1A2E]/70">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] max-w-[390px] mx-auto flex flex-col items-center justify-center px-6">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {onboardingCards.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === currentCard ? 'w-6 bg-[#003F87]' : 'w-1.5 bg-[#D4C5A9]'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-2xl p-8 shadow-sm border border-[#D4C5A9]/20 text-center star-pattern min-h-[280px] flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">{onboardingCards[currentCard].icon}</span>
        <h2 className="font-display text-2xl font-bold text-[#003F87] mb-2">
          {onboardingCards[currentCard].title}
        </h2>
        <p className="text-[#1A1A2E]/60 font-body text-sm">
          {onboardingCards[currentCard].description}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full mt-8">
        <button
          onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
          className={`p-2 rounded-full ${currentCard === 0 ? 'opacity-0' : 'bg-white shadow-sm'}`}
          disabled={currentCard === 0}
        >
          <ChevronLeft size={20} className="text-[#003F87]" />
        </button>

        {currentCard === onboardingCards.length - 1 ? (
          <button
            onClick={handleGetStarted}
            className="bg-[#003F87] text-white px-8 py-3 rounded-xl font-body font-semibold shadow-lg hover:bg-[#003F87]/90 active:scale-95 transition-all"
          >
            Get Started
          </button>
        ) : (
          <button
            onClick={() => setCurrentCard(currentCard + 1)}
            className="p-2 rounded-full bg-white shadow-sm"
          >
            <ChevronRight size={20} className="text-[#003F87]" />
          </button>
        )}
      </div>

      {/* Skip */}
      {currentCard < onboardingCards.length - 1 && (
        <button
          onClick={handleGetStarted}
          className="mt-4 text-sm text-[#1A1A2E]/40 font-body hover:text-[#1A1A2E]/60"
        >
          Skip
        </button>
      )}
    </div>
  );
}