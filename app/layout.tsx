import type { Metadata } from 'next';
import './globals.css';
import { getClientes } from '@/lib/services/supabase-data';
import { TenantProvider } from '@/components/TenantProvider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

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
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC]">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
              {children}
            </main>
          </div>
        </TenantProvider>
      </body>
    </html>
  );
}
