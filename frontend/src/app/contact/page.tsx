import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="p-6 max-w-2xl mx-auto flex-1">
        <h1 className="font-display text-3xl mb-4">Contact us</h1>
        <p className="text-[var(--muted)] mb-6">
          Questions about an asset, access, or this system? Reach out.
        </p>
        <div className="space-y-2 text-sm">
          <p><strong>Email:</strong> support@logiclens.com</p>
          <p><strong>Internal helpdesk:</strong> #dam-support on Slack</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}