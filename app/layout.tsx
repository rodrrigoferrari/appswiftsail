import type { Metadata } from 'next';
import './globals.css';
import { getClientes } from '@/lib/services/supabase-data';
import { TenantProvider } from '@/components/TenantProvider';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://appswiftsail.vercel.app'
  ),
  title: {
    default: 'Swiftsail Enterprise OS | Gestão de Tráfego, IA & CRM',
    template: '%s | Swiftsail',
  },
  description:
    'Plataforma integrada de inteligência de tráfego pago (Meta & Google Ads), automações WhatsApp, criativos com IA e CRM de alta performance.',
  applicationName: 'Swiftsail Enterprise OS',
  authors: [{ name: 'Swiftsail' }],
  keywords: [
    'Swiftsail',
    'Tráfego Pago',
    'Meta Ads',
    'Google Ads',
    'CRM',
    'Automação WhatsApp',
    'Enterprise OS',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/logo.png',
  },
  openGraph: {
    title: 'Swiftsail Enterprise OS | Gestão de Tráfego, IA & CRM',
    description:
      'Plataforma integrada de inteligência de tráfego pago (Meta & Google Ads), automações WhatsApp, criativos com IA e CRM de alta performance.',
    siteName: 'Swiftsail Enterprise OS',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 500,
        height: 500,
        alt: 'Swiftsail Enterprise OS',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Swiftsail Enterprise OS | Gestão de Tráfego, IA & CRM',
    description:
      'Plataforma integrada de inteligência de tráfego pago (Meta & Google Ads), automações WhatsApp, criativos com IA e CRM de alta performance.',
    images: ['/logo.png'],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialClients = await getClientes();

  return (
    <html lang="pt-BR" className="light">
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen antialiased flex overflow-hidden font-sans">
        <TenantProvider initialClients={initialClients}>
          <AppShell>{children}</AppShell>
        </TenantProvider>
      </body>
    </html>
  );
}
