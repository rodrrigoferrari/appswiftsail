import type { Metadata } from 'next';
import './globals.css';
import { getClientes } from '@/lib/services/supabase-data';
import { TenantProvider } from '@/components/TenantProvider';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Swiftsail Enterprise OS | Gestão de Tráfego, IA & CRM',
  description:
    'Plataforma integrada de inteligência de tráfego, automações WhatsApp, criativos de IA e CRM multi-tenant.',
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
