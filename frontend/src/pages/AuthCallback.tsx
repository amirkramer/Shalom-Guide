import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Orphaned route from the old MGX-platform OIDC flow (nothing links here anymore
// now that the app uses its own email/password login) — kept as a harmless
// redirect in case anything old still points at it.
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
