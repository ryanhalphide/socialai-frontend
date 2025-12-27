import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Mock data for demo
const mockUser = {
  name: 'John Doe',
  email: 'john@company.com',
  avatar_url: undefined,
};

const mockOrganization = {
  name: 'Acme Corp',
  subscription_tier: 'professional',
  ai_credits_remaining: 2500,
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header user={mockUser} organization={mockOrganization} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
