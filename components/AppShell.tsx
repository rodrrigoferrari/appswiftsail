'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTenant } from './TenantProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useTenant();
  const isLoginPage = pathname === '/login' || (pathname === '/' && !currentUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoginPage) {
    return (
      <main className="w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center">
        {children}
      </main>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC]">
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
