import { ArrowLeft } from 'lucide-react';

/**
 * Full-screen in-app webview for a partner site (Ontopo, Discover Cars, ...),
 * mirroring the pattern already used for Booking.com in Accommodation.tsx.
 * Only render this for destinations confirmed embeddable via
 * `canEmbedInIframe()` in lib/affiliateLinks.ts — sites that block framing
 * (Expedia, trivago) should open a real new tab instead, not this component,
 * since an iframe there would just be a dead blank screen.
 *
 * Always shows a "Not loading? Open in browser" escape hatch, so even a
 * provider we've confirmed embeddable today never traps the user if that
 * changes later.
 */
export default function ExternalWebview({
  url,
  label,
  color = '#1A1A2E',
  onClose,
}: {
  url: string;
  label: string;
  color?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4C5A9]/20 bg-white shadow-sm">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-[#1A1A2E]" />
        </button>
        <div className="flex-1 min-w-0">
          <span
            className="text-white font-bold text-[10px] px-1.5 py-0.5 rounded font-body"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
          <p className="text-[9px] font-body text-[#1A1A2E]/40 truncate mt-0.5 flex items-center gap-1">
            🔒 {url.replace('https://', '')}
          </p>
        </div>
      </div>

      <div className="flex-1 relative">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={label}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          loading="lazy"
        />
      </div>

      <div className="px-4 py-2 border-t border-[#D4C5A9]/20 bg-white flex items-center justify-between gap-2">
        <p className="text-[8px] font-body text-[#1A1A2E]/40 flex-shrink-0">Shalom Guide • {label}</p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-body text-[#1A1A2E]/40 underline">
            Not loading? Open in browser
          </a>
          <button onClick={onClose} className="text-[10px] font-body text-[#003F87] font-medium">
            ← Back to app
          </button>
        </div>
      </div>
    </div>
  );
}
