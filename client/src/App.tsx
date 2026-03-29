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
import { useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';

// Landing
import { PortalSelector } from './pages/landing/PortalSelector';

// NGO Portal
import { NgoLayout } from './components/ngo/NgoLayout';
import { NgoLogin } from './pages/ngo/Login';
import { NgoRegister } from './pages/ngo/Register';
import { NgoDashboard } from './pages/ngo/Dashboard';
import { TaskAssignmentBoard } from './pages/ngo/TaskAssignmentBoard';
import { Volunteers } from './pages/ngo/Volunteers';
import { Claims } from './pages/ngo/Claims';
const ImpactPage    = lazy(() => import('./pages/ngo/Impact').then(m => ({ default: m.ImpactPage })));
const NgoProfilePage = lazy(() => import('./pages/ngo/NgoProfile').then(m => ({ default: m.NgoProfilePage })));
const LiveTracking  = lazy(() => import('./pages/ngo/LiveTracking').then(m => ({ default: m.LiveTracking })));
const DiscoverFood  = lazy(() => import('./pages/ngo/DiscoverFood').then(m => ({ default: m.DiscoverFood })));

// Volunteer Portal
import { VolunteerLayout } from './components/volunteer/VolunteerLayout';
import { VolunteerHome } from './pages/volunteer/Home';
import { VolunteerLogin } from './pages/volunteer/Login';
import { VerifyOtpPage, CompleteTaskPage } from './pages/volunteer/TaskActions';
const VolunteerTasks   = lazy(() => import('./pages/volunteer/Tasks').then(m => ({ default: m.VolunteerTasks })));
const VolunteerProfile = lazy(() => import('./pages/volunteer/VolunteerProfile').then(m => ({ default: m.VolunteerProfile })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
      Loading…
    </div>
  );
}

/**
 * Gate for the Donor dashboard.
 * - If authenticated as donor → render dashboard
 * - If not → send to /login (donor login)
 */
function DonorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Gate for the NGO dashboard.
 * - If authenticated as ngo_admin → render dashboard
 * - If not → send to /ngo/login
 */
function NgoProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/ngo/login" replace />;
  if (user.user_metadata?.role !== 'ngo_admin') return <Navigate to="/ngo/login" replace />;
  return <>{children}</>;
}

/**
 * Gate for the Volunteer dashboard.
 * - If authenticated as ngo_volunteer → render dashboard
 * - If not → send to /volunteer/login
 */
function VolunteerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/volunteer/login" replace />;
  if (user.user_metadata?.role !== 'ngo_volunteer') return <Navigate to="/volunteer/login" replace />;
  return <>{children}</>;
}

function App() {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '13px',
            },
          }}
        />
        <Routes>
          {/* ───────────────────────────────────────────
              Landing / Role selector — ALWAYS shown at /
              regardless of auth state. Users pick their
              role and go to the specific login.
          ─────────────────────────────────────────── */}
          <Route path="/" element={<PortalSelector />} />

          {/* ───────────────────────────────────────────
              Donor Auth
          ─────────────────────────────────────────── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ───────────────────────────────────────────
              Donor Dashboard  (/donor/*)
          ─────────────────────────────────────────── */}
          <Route
            path="/donor"
            element={
              <DonorProtectedRoute>
                <Layout />
              </DonorProtectedRoute>
            }
          >
            <Route index                element={<DashboardOverview />} />
            <Route path="manage-listings" element={<ManageListings />} />
            <Route path="create-listing"  element={<CreateListing />} />
            <Route path="listings/:id"    element={<ListingDetail />} />
            <Route path="analytics"       element={<Analytics />} />
            <Route path="notifications"   element={<Notifications />} />
            <Route path="profile"         element={<Profile />} />
          </Route>

          {/* ───────────────────────────────────────────
              NGO Auth (public)
          ─────────────────────────────────────────── */}
          <Route path="/ngo/login"    element={<NgoLogin />} />
          <Route path="/ngo/register" element={<NgoRegister />} />

          {/* ───────────────────────────────────────────
              NGO Dashboard (/ngo/*)
          ─────────────────────────────────────────── */}
          <Route
            path="/ngo"
            element={
              <NgoProtectedRoute>
                <NgoLayout />
              </NgoProtectedRoute>
            }
          >
            <Route index element={<NgoDashboard />} />
            <Route path="tasks"      element={<TaskAssignmentBoard />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="claims"     element={<Claims />} />
            <Route path="tracking"   element={<Suspense fallback={<LoadingFallback />}><LiveTracking /></Suspense>} />
            <Route path="discover"   element={<Suspense fallback={<LoadingFallback />}><DiscoverFood /></Suspense>} />
            <Route path="impact"     element={<Suspense fallback={<LoadingFallback />}><ImpactPage /></Suspense>} />
            <Route path="profile"    element={<Suspense fallback={<LoadingFallback />}><NgoProfilePage /></Suspense>} />
            <Route path="reports"       element={<div className="p-6 text-gray-400">Reports coming soon</div>} />
            <Route path="notifications" element={<div className="p-6 text-gray-400">Notifications coming soon</div>} />
            <Route path="settings"      element={<div className="p-6 text-gray-400">Settings coming soon</div>} />
            <Route path="activity"      element={<div className="p-6 text-gray-400">Activity log coming soon</div>} />
          </Route>

          {/* ───────────────────────────────────────────
              Volunteer Auth (public — dedicated page)
          ─────────────────────────────────────────── */}
          <Route path="/volunteer/login" element={<VolunteerLogin />} />

          {/* ───────────────────────────────────────────
              Volunteer Dashboard (/volunteer/*)
          ─────────────────────────────────────────── */}
          <Route
            path="/volunteer"
            element={
              <VolunteerProtectedRoute>
                <VolunteerLayout />
              </VolunteerProtectedRoute>
            }
          >
            <Route index       element={<VolunteerHome />} />
            <Route path="tasks"   element={<Suspense fallback={<LoadingFallback />}><VolunteerTasks /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><VolunteerProfile /></Suspense>} />
          </Route>

          {/* Volunteer full-screen task flow pages */}
          <Route path="/volunteer/tasks/:id/otp"      element={<VerifyOtpPage />} />
          <Route path="/volunteer/tasks/:id/complete" element={<CompleteTaskPage />} />

          {/* ───────────────────────────────────────────
              Catch-all → role selector
          ─────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
