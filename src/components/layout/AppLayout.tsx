import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, FileText, History, Menu, LogOut, BarChart3, CreditCard, GitCompare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth";

const AppLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, profile, isAdmin } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/app/dashboard", icon: BarChart3 },
    { name: "Gerador", href: "/app/gerador", icon: FileText },
    { name: "Diagnóstico", href: "/app/diagnostico", icon: Users },
    { name: "Otimizador de Funil", href: "/app/otimizador-funil", icon: GitCompare },
    { name: "Histórico", href: "/app/historico", icon: History },
    { name: "Assinatura", href: "/app/assinatura", icon: CreditCard },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        // Verifica se o caminho atual começa com o href do item (para subrotas)
        const isActive = location.pathname.startsWith(item.href);
        
        const linkElement = (
          <Link
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            } ${mobile ? "w-full" : ""}`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );

        // Só usa SheetClose quando for mobile (dentro do Sheet)
        if (mobile) {
          return (
            <SheetClose key={item.name} asChild>
              {linkElement}
            </SheetClose>
          );
        }

        // Para desktop, retorna o link diretamente
        return <div key={item.name}>{linkElement}</div>;
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col gap-4 mt-6">
                    <div className="px-3 py-2 mb-2">
                      <h2 className="text-lg font-bold text-blue-600">OtimizaAds</h2>
                    </div>
                    <NavItems mobile />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link to="/app/dashboard" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OA</span>
                </div>
                <h1 className="text-xl font-bold text-blue-600">OtimizaAds</h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <div className="flex items-center space-x-1">
                <NavItems />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {profile && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  {profile.full_name || profile.email}
                </span>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
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