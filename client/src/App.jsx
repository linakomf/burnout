import React, { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout/Layout';
import Landing from './components/Auth/Landing';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Stats from './components/Dashboard/Stats';
import { TestsList, TakeTest } from './components/Tests/Tests';
import Profile from './components/Profile/Profile';
import Diary from './components/Diary/Diary';
import Practices from './components/Practices/Practices';
import { AdminOverview, AdminUsers, AdminCategories, AdminTests } from './components/Admin/Admin';
import AdminPortal from './components/AdminPortal/AdminPortal';
import AdminDashboard from './components/Dashboards/AdminDashboard';
import OnboardingBurnout from './components/Onboarding/OnboardingBurnout';
import Personalization from './components/Personalization/Personalization';
import './styles/global.css';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="app-loading-fullscreen">
      <div className="loading-spinner" />
    </div>);

  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function RequireAdminDashboard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="app-loading-fullscreen">
      <div className="loading-spinner" />
    </div>);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="app-loading-fullscreen">
      <div className="loading-spinner" />
    </div>);

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function RequireOnboardingDone({ children }) {
  const { user } = useAuth();
  if (user && user.role !== 'admin' && !user.onboarding_burnout_completed) {
    return <Navigate to="/onboarding/burnout" replace />;
  }
  return children;
}

const UserLayout = ({ children }) =>
<Layout>
    {children}
  </Layout>;


/** При переходе на любой маршрут показываем страницу с начала (как обычная навигация). */
function ScrollToTopOnRoute() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => {
  return (
    <div className="app-shell">
    <ThemeProvider>
    <LanguageProvider>
    <BrowserRouter>
      <ScrollToTopOnRoute />
      <div className="app-fill">
      <AuthProvider>
        <div className="app-routes-outlet">
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/admin-portal" element={<AdminPortal />} />

          <Route path="/admin-dashboard" element={
                    <RequireAdminDashboard><AdminDashboard /></RequireAdminDashboard>
                    } />
          <Route path="/user-dashboard" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/onboarding/burnout" element={
                    <PrivateRoute><OnboardingBurnout /></PrivateRoute>
                    } />

          <Route path="/dashboard" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><Dashboard /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/personalization" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><Personalization /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/tests" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><TestsList /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/tests/:id" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><TakeTest /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/practices/*" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><Practices /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/diary" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><Diary /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/stats" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><Stats /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />
          <Route path="/profile" element={
                    <PrivateRoute>
              <RequireOnboardingDone>
                <UserLayout><Profile /></UserLayout>
              </RequireOnboardingDone>
            </PrivateRoute>
                    } />

          <Route path="/admin" element={
                    <PrivateRoute adminOnly><Layout><AdminOverview /></Layout></PrivateRoute>
                    } />
          <Route path="/admin/users" element={
                    <PrivateRoute adminOnly><Layout><AdminUsers /></Layout></PrivateRoute>
                    } />
          <Route path="/admin/categories" element={
                    <PrivateRoute adminOnly><Layout><AdminCategories /></Layout></PrivateRoute>
                    } />
          <Route path="/admin/tests" element={
                    <PrivateRoute adminOnly><Layout><AdminTests /></Layout></PrivateRoute>
                    } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </AuthProvider>
      </div>
    </BrowserRouter>
    </LanguageProvider>
    </ThemeProvider>
    </div>);

};

export default App;