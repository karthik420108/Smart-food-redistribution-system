import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { DashboardOverview } from './pages/DashboardOverview';
import { CreateListing } from './pages/CreateListing';
import { ManageListings } from './pages/ManageListings';
import { ListingDetail } from './pages/ListingDetail';
import { Analytics } from './pages/Analytics';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { useAuthStore } from './store/authStore';

import { useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
     return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardOverview />} />
          <Route path="manage-listings" element={<ManageListings />} />
          <Route path="create-listing" element={<CreateListing />} />
          <Route path="listings/:id" element={<ListingDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
