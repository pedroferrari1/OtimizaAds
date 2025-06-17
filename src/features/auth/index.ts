// Exportações centralizadas para o módulo de autenticação
export { Login, Register, ProtectedRoute, AdminProtectedRoute } from "./components";
export { AuthProvider } from "./context/AuthContext";
export { AuthContext } from "./context/authContext";
export { useAuth } from "./hooks/useAuth";