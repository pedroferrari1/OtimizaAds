
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const getDefaultRoute = () => {
    if (loading) return "/";
    if (user) return "/app/dashboard";
    return "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página não encontrada</h2>
          <p className="text-gray-600 mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Rota tentada: <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code>
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to={getDefaultRoute()}>
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Ir para o início
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
