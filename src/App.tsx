import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Novos imports centralizados:
import { AuthProvider } from "@/features/auth";
import { ProtectedRoute, AdminProtectedRoute, Login, Register } from "@/features/auth";
import { AdGenerator, AdDiagnosis } from "@/features/ads";
import { AdminDashboard } from "@/features/admin";
// import { AuthProvider } from "@/contexts/AuthContext";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Public pages
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Protected app pages
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
// import AdGenerator from "./pages/AdGenerator";
// import AdDiagnosis from "./pages/AdDiagnosis";
import History from "./pages/History";
import Subscription from "./pages/Subscription";

// Admin pages
import AdminLayout from "./components/admin/AdminLayout";
// import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminAIConfig from "./pages/AdminAIConfig";
import AdminMonitoring from "./pages/AdminMonitoring";
import AdminSubscriptions from "./pages/AdminSubscriptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              
              {/* Protected app routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="gerador" element={<AdGenerator />} />
                <Route path="diagnostico" element={<AdDiagnosis />} />
                <Route path="historico" element={<History />} />
                <Route path="assinatura" element={<Subscription />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="configuracoes" element={<AdminSettings />} />
                <Route path="ai-config" element={<AdminAIConfig />} />
                <Route path="monitoring" element={<AdminMonitoring />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
              </Route>

              {/* Legacy routes for backward compatibility */}
              <Route path="/index" element={<Index />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
