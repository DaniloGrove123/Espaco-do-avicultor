
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancialsPage } from './pages/FinancialsPage';
import { ProductionPage } from './pages/ProductionPage';
import { BusinessDetailsPage } from './pages/BusinessDetailsPage'; // Importar a nova página
import { NotFoundPage } from './pages/NotFoundPage';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout><Outlet /></Layout>;
};

const PublicRoute: React.FC = () => {
   const { isAuthenticated } = useAuth();
   if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  // No Layout for public routes like login
  return <Outlet />;
}


const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/financials" element={<FinancialsPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/farm-details" element={<BusinessDetailsPage />} /> {/* Adicionar nova rota */}
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;