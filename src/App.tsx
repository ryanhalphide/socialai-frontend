import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout';
import { Dashboard, Login, Register, Content, Calendar, Analytics } from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Placeholder pages for routes not yet implemented
function AIStudioPage() {
  return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">AI Studio</h1>
        <p className="text-gray-500 mt-2">AI-powered content creation coming soon...</p>
      </div>
    </DashboardLayout>
  );
}

function RecommendationsPage() {
  return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
        <p className="text-gray-500 mt-2">AI-powered recommendations coming soon...</p>
      </div>
    </DashboardLayout>
  );
}

function ConnectionsPage() {
  return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Platform Connections</h1>
        <p className="text-gray-500 mt-2">Manage your connected platforms coming soon...</p>
      </div>
    </DashboardLayout>
  );
}

function TeamPage() {
  return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-2">Manage your team members coming soon...</p>
      </div>
    </DashboardLayout>
  );
}

function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Configure your account settings coming soon...</p>
      </div>
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Routes */}
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/content" element={<Content />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-studio" element={<AIStudioPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/help" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
