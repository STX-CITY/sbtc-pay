'use client';

import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/dashboard/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <Sidebar>
        {children}
      </Sidebar>
    </ProtectedRoute>
  );
}