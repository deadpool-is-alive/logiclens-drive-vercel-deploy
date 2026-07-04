import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] mt-auto py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--muted)]">
        <span>© {new Date().getFullYear()} LogicLens. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/contact" className="hover:text-[var(--ink)] transition-colors">
            Contact us
          </Link>
          <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}