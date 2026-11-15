import { Link } from 'react-router-dom';
import { Github, Leaf, ShieldCheck } from 'lucide-react';
import { GITHUB_REPO_URL } from '@/lib/constants';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { to: '/scan', label: 'AI Scanner' },
      { to: '/actions', label: 'My Eco Actions' },
      { to: '/dashboard', label: 'Impact Dashboard' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { to: '/about', label: 'How It Works' },
      { to: '/about#accuracy', label: 'Accuracy & Limits' },
      { to: '/about#privacy', label: 'Privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-eco-100 bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-mint">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-[1.05rem] font-extrabold text-forest">RecycleVision AI</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Scan it. Discover it. Give it a second life. An AI-powered environmental education
            project built for the Rotary AI for Good Hackathon under the theme{' '}
            <em>Create Lasting Impact</em>.
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted">
            Built by an independent team as a hackathon entry. This project is not an official
            Rotary product and carries no Rotary endorsement.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-forest">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted transition hover:text-eco-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-eco-100">
        <div className="container-page flex flex-col gap-4 py-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-eco-600" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-forest">Educational use only.</strong> AI
                analysis can be incomplete or wrong. Recycling and disposal rules vary by location --
                always check your local authority before acting, and never handle damaged batteries,
                chemicals or contaminated waste yourself.
              </span>
            </p>
            <p>
              Your scan history is stored only in this browser. It is not synced between devices and
              we keep no server-side account. Photos and item names you submit are sent to the
              configured AI provider for analysis and are not stored by this app.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 font-semibold text-forest transition hover:text-eco-700"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Source on GitHub
            </a>
            <p>&copy; {new Date().getFullYear()} RecycleVision AI</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
