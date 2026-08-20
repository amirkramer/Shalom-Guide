import { useState, ReactNode } from 'react';
import { canEmbedArbitraryUrl } from '@/lib/affiliateLinks';
import ExternalWebview from '@/components/ExternalWebview';

/**
 * A link to an external destination that opens in the in-app webview when
 * the destination allows itself to be embedded, or a real new tab — marked
 * with "↗" so it's clear upfront that it leaves the app — when it doesn't
 * (Google, Facebook, Instagram, etc. all actively block embedding; see
 * lib/affiliateLinks.ts's canEmbedArbitraryUrl for the reasoning).
 *
 * Self-contained: owns its own webview modal state, so it can be dropped in
 * anywhere a plain `<a target="_blank">` was used before.
 */
export default function SmartExternalLink({
  href,
  label,
  color = '#003F87',
  className,
  children,
}: {
  href: string;
  label: string;
  color?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const embeddable = canEmbedArbitraryUrl(href);

  return (
    <>
      {embeddable ? (
        <button onClick={() => setOpen(true)} className={className}>
          {children}
        </button>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children} ↗
        </a>
      )}
      {open && <ExternalWebview url={href} label={label} color={color} onClose={() => setOpen(false)} />}
    </>
  );
}
