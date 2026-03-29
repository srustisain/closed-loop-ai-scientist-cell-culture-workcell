import { Link } from 'react-router-dom';
import { SITE_DISPLAY_TITLE, SITE_TAGLINE } from '@/config/site';

/**
 * Primary app title shown at the top of the main column on every page.
 */
export function SiteMainHeader() {
  return (
    <header className="mb-8 border-b border-border pb-6">
      <Link
        to="/"
        className="group inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl">
          {SITE_DISPLAY_TITLE}
        </h1>
      </Link>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground leading-relaxed">{SITE_TAGLINE}</p>
    </header>
  );
}
