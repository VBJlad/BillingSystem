import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import LocationDetails from './pages/LocationDetails';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import CustomerDetails from './pages/CustomerDetails';
import Billing from './pages/Billing';
import ConnectionIssues from './pages/ConnectionIssues';
import InternetPlans from './pages/InternetPlans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function ProtectedRoutes() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}

function PublicLoginRoute() {
  const { isAuthenticated } = useApp();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<PublicLoginRoute />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:locationId" element={<LocationDetails />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/new" element={<AddCustomer />} />
            <Route path="/customers/:customerId" element={<CustomerDetails />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/issues" element={<ConnectionIssues />} />
            <Route path="/plans" element={<InternetPlans />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
