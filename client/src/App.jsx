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
import AdminSpace from './components/Admin/AdminSpace';
import AdminPsychologists from './components/Admin/AdminPsychologists';
import AdminPortal from './components/AdminPortal/AdminPortal';
import PsychologistDashboard from './components/Psychologist/PsychologistDashboard';
import PsychologistProfile from './components/Psychologist/PsychologistProfile';
import PsychologistPending from './components/Psychologist/PsychologistPending';
import PsychologistInviteRegister from './components/Psychologist/PsychologistInviteRegister';
import { psychologistHomePath } from './utils/psychologistNav';
import OnboardingBurnout from './components/Onboarding/OnboardingBurnout';
import Personalization from './components/Personalization/Personalization';
import ScrollRevealProvider from './components/ScrollReveal/ScrollRevealProvider';
import './styles/scroll-reveal.css';
import './styles/global.css';
import { warmupApi } from './utils/apiWarmup';

warmupApi();

const PrivateRoute = ({
  children,
  adminOnly = false,
  psychologistOnly = false,
  allowProfile = false
}) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="app-loading-fullscreen">
      <div className="loading-spinner" />
    </div>);

  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to={psychologistHomePath(user)} replace />;
  if (psychologistOnly && user.role !== 'psychologist') return <Navigate to="/dashboard" replace />;
  if (!allowProfile && !adminOnly && !psychologistOnly && user.role === 'psychologist') {
    return <Navigate to={psychologistHomePath(user)} replace />;
  }
  if (!allowProfile && !adminOnly && !psychologistOnly && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

function ProfilePage() {
  const { user } = useAuth();
  if (user?.role === 'psychologist') {
    return <Navigate to="/psychologist/profile" replace />;
  }
  if (user?.role === 'admin') {
    return (
      <Layout>
        <Profile />
      </Layout>
    );
  }
  return (
    <RequireOnboardingDone>
      <UserLayout>
        <Profile />
      </UserLayout>
    </RequireOnboardingDone>
  );
}

function ApprovedPsychologistRoute({ children }) {
  const { user } = useAuth();
  if (user?.psychologist_account_status !== 'approved') {
    return <Navigate to="/psychologist/pending" replace />;
  }
  return children;
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="app-loading-fullscreen">
      <div className="loading-spinner" />
    </div>);

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'psychologist') return <Navigate to={psychologistHomePath(user)} replace />;
    if (!user.onboarding_burnout_completed) {
      return <Navigate to="/onboarding/burnout" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function RequireOnboardingDone({ children }) {
  const { user } = useAuth();
  if (
    user &&
    user.role !== 'admin' &&
    user.role !== 'psychologist' &&
    !user.onboarding_burnout_completed
  ) {
    return <Navigate to="/onboarding/burnout" replace />;
  }
  return children;
}

const UserLayout = ({ children }) =>
<Layout>
    {children}
  </Layout>;

function SpaceToPracticesRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/practices', search }} replace />;
}


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
        <ScrollRevealProvider>
        <div className="app-routes-outlet">
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/admin-portal" element={<AdminPortal />} />

          <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/user-dashboard" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/psychologist/invite/:token" element={<PsychologistInviteRegister />} />

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
          <Route path="/space/*" element={<SpaceToPracticesRedirect />} />
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
                    <PrivateRoute allowProfile>
              <ProfilePage />
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
          <Route path="/admin/space" element={
                    <PrivateRoute adminOnly><Layout><AdminSpace /></Layout></PrivateRoute>
                  } />
          <Route path="/admin/psychologists" element={
                    <PrivateRoute adminOnly><Layout><AdminPsychologists /></Layout></PrivateRoute>
                  } />

          <Route path="/psychologist" element={
                    <PrivateRoute psychologistOnly>
              <ApprovedPsychologistRoute>
                <Layout><PsychologistDashboard /></Layout>
              </ApprovedPsychologistRoute>
            </PrivateRoute>
                  } />
          <Route path="/psychologist/pending" element={
                    <PrivateRoute psychologistOnly><Layout><PsychologistPending /></Layout></PrivateRoute>
                  } />
          <Route path="/psychologist/profile" element={
                    <PrivateRoute psychologistOnly>
              <Layout><PsychologistProfile /></Layout>
            </PrivateRoute>
                  } />
          <Route path="/admin/films" element={<Navigate to="/admin/space?section=films" replace />} />
          <Route path="/admin/meditations" element={<Navigate to="/admin/space?section=meditation" replace />} />
          <Route path="/admin/events" element={<Navigate to="/admin/space?section=events" replace />} />
          <Route path="/admin/reading" element={<Navigate to="/admin/space?section=reading" replace />} />
          <Route path="/admin/music" element={<Navigate to="/admin/space?section=music" replace />} />
          <Route path="/admin/podcasts" element={<Navigate to="/admin/space?section=podcasts" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
        </ScrollRevealProvider>
      </AuthProvider>
      </div>
    </BrowserRouter>
    </LanguageProvider>
    </ThemeProvider>
    </div>);

};

export default App;