import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Landing from './components/Auth/Landing';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Stats from './components/Dashboard/Stats';
import { TestsList, TakeTest } from './components/Tests/Tests';
import Profile from './components/Profile/Profile';
import { AdminOverview, AdminUsers, AdminCategories, AdminTests } from './components/Admin/Admin';
import AIChat from './components/AI/AIChat';
import './styles/global.css';

// Protected route — если не вошёл, отправляет на лендинг
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', width: '100%' }}>
      <div className="loading-spinner" />
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// Публичный маршрут — если уже вошёл, отправляет на дашборд
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', width: '100%' }}>
      <div className="loading-spinner" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// Layout с сайдбаром и ИИ-чатом
const UserLayout = ({ children }) => (
  <Layout>
    {children}
    <AIChat />
  </Layout>
);

const App = () => {
  return (
    <div className="app-shell">
    <BrowserRouter>
      <div className="app-fill">
      <AuthProvider>
        <div className="app-routes-outlet">
        <Routes>
          {/* Лендинг — главная страница до входа */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />

          {/* Вход и регистрация */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Страницы пользователя */}
          <Route path="/dashboard" element={
            <PrivateRoute><UserLayout><Dashboard /></UserLayout></PrivateRoute>
          } />
          <Route path="/tests" element={
            <PrivateRoute><UserLayout><TestsList /></UserLayout></PrivateRoute>
          } />
          <Route path="/tests/:id" element={
            <PrivateRoute><UserLayout><TakeTest /></UserLayout></PrivateRoute>
          } />
          <Route path="/diary" element={
            <PrivateRoute><UserLayout><Dashboard /></UserLayout></PrivateRoute>
          } />
          <Route path="/stats" element={
            <PrivateRoute><UserLayout><Stats /></UserLayout></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><UserLayout><Profile /></UserLayout></PrivateRoute>
          } />

          {/* Страницы админа */}
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

          {/* Любой другой путь → лендинг */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </AuthProvider>
      </div>
    </BrowserRouter>
    </div>
  );
};

export default App;
