
import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, BarChart3, Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const AppLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();

  const navigation = [
    { name: "Painel", href: "/dashboard", icon: BarChart3 },
    { name: "Gerar Anúncios", href: "/gerador", icon: PlusCircle },
    { name: "Diagnosticar", href: "/diagnostico", icon: Search },
    { name: "Histórico", href: "/historico", icon: BarChart3 },
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
              
              <Link to="/dashboard" className="flex items-center">
                <h1 className="text-xl font-bold text-blue-600">OtimizaAds</h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <NavItems />
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  Olá, {user.user_metadata?.full_name || user.email}
                </span>
              )}
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

export default AppLayout;
