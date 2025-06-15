
// Export centralizado de Auth para facilitar imports das features
export { default as Login } from "./Login";
export { default as Register } from "./Register";
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as AdminProtectedRoute } from "./AdminProtectedRoute";
export * from "./AuthContext";
