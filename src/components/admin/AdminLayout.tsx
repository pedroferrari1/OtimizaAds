import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Settings, Menu, LogOut, ShieldCheck, Activity, Brain, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, profile } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Monitoramento", href: "/admin/monitoring", icon: Activity },
    { name: "Configurações IA", href: "/admin/ai-config", icon: Brain },
    { name: "Assinaturas", href: "/admin/subscriptions", icon: CreditCard },
    { name: "Usuários", href: "/admin/usuarios", icon: Users },
    { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            } ${mobile ? "w-full" : ""}`}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col gap-4 mt-6">
                    <NavItems mobile />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-blue-600">Admin OtimizaAds</h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <NavItems />
            </div>

            <div className="flex items-center gap-4">
              {profile && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  Admin: {profile.full_name || profile.email}
                </span>
              )}
              <Link to="/app/dashboard">
                <Button variant="ghost" size="sm">
                  Ver App
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
