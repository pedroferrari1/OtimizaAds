
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./components/admin/AdminLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdGenerator from "./pages/AdGenerator";
import AdDiagnosis from "./pages/AdDiagnosis";
import History from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMonitoring from "./pages/AdminMonitoring";
import AdminAIConfig from "./pages/AdminAIConfig";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public landing page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              
              {/* Protected app routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ad-generator" element={<AdGenerator />} />
                <Route path="ad-diagnosis" element={<AdDiagnosis />} />
                <Route path="history" element={<History />} />
                {/* Maintain backward compatibility with old routes */}
                <Route path="gerador" element={<Navigate to="/app/ad-generator" replace />} />
                <Route path="diagnostico" element={<Navigate to="/app/ad-diagnosis" replace />} />
                <Route path="historico" element={<Navigate to="/app/history" replace />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="monitoring" element={<AdminMonitoring />} />
                <Route path="ai-config" element={<AdminAIConfig />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="configuracoes" element={<AdminSettings />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
