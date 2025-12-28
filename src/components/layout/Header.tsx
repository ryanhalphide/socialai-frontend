import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  CreditCard,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  organization?: {
    name: string;
    subscription_tier: string;
    ai_credits_remaining: number;
  };
}

export function Header({ user, organization }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search content, analytics..."
            className="h-10 w-80 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* AI Credits */}
        {organization && (
          <Link
            to="/settings/billing"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-50 to-brand-50 px-3 py-1.5 text-sm"
          >
            <span className="font-medium text-primary-700">
              {organization.ai_credits_remaining.toLocaleString()}
            </span>
            <span className="text-gray-500">AI credits</span>
          </Link>
        )}

        {/* Create Button */}
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Create
        </Button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="font-medium text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
          >
            <Avatar
              size="sm"
              name={user?.name}
              src={user?.avatar_url}
            />
            {user && (
              <>
                <span className="hidden text-sm font-medium text-gray-700 md:block">
                  {user.name}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-gray-200 bg-white shadow-lg">
              {user && (
                <div className="border-b border-gray-200 px-4 py-3">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              )}
              <div className="p-2">
                <Link
                  to="/settings/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  to="/settings/billing"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <CreditCard className="h-4 w-4" />
                  Billing
                </Link>
                <hr className="my-2" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
