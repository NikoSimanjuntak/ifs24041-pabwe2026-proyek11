import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './features/auth/layouts/AuthLayout';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import ApplicationsPage from './features/applications/pages/ApplicationsPage';
import ApplicationDetailPage from './features/applications/pages/ApplicationDetailPage';
import InterviewsPage from './features/interviews/pages/InterviewsPage';
import ProfilePage from './features/users/pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
