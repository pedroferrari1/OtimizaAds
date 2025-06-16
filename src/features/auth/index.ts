// Exportações centralizadas para o módulo de autenticação
export { default as Login } from "./components/Login";
export { default as Register } from "./components/Register";
export { default as ProtectedRoute } from "./components/ProtectedRoute";
export { default as AdminProtectedRoute } from "./components/AdminProtectedRoute";
export { AuthProvider, useAuth } from "./context/AuthContext";