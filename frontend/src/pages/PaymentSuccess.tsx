import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authHeader } from '@/lib/authStorage';
import { getAPIBaseURL } from '@/lib/config';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [bookingId, setBookingId] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setStatus('failed');
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await axios.post(
        `${getAPIBaseURL()}/api/v1/payment/verify_payment`,
        { session_id: sessionId },
        { headers: authHeader() }
      );

      if (response.data?.status === 'confirmed' || response.data?.payment_status === 'paid') {
        setStatus('success');
        setBookingId(response.data?.booking_id);
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-[#003F87] animate-spin mb-4" />
            <h2 className="font-heading font-bold text-lg text-[#1A1A2E]">Verifying Payment...</h2>
            <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your booking</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-[#4A7C59] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">Booking Confirmed! 🎉</h2>
            <p className="text-sm text-gray-600 font-body mb-6">
              Your tour has been booked successfully. You can now chat with your guide to discuss details.
            </p>
            <div className="space-y-3 w-full max-w-xs">
              {bookingId && (
                <button
                  onClick={() => navigate(`/hire-guide/chat/${bookingId}`)}
                  className="w-full bg-[#003F87] text-white font-medium py-3 rounded-full"
                >
                  Chat with Guide
                </button>
              )}
              <button
                onClick={() => navigate('/hire-guide')}
                className="w-full border border-[#003F87] text-[#003F87] font-medium py-3 rounded-full"
              >
                Back to Guides
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[#1A1A2E] mb-2">Payment Issue</h2>
            <p className="text-sm text-gray-600 font-body mb-6">
              We couldn't verify your payment. Please try again or contact support.
            </p>
            <button
              onClick={() => navigate('/hire-guide')}
              className="w-full max-w-xs bg-[#003F87] text-white font-medium py-3 rounded-full"
            >
              Back to Guides
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}