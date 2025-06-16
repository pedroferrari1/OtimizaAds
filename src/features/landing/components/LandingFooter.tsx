import { Link } from "react-router-dom";

const LandingFooter = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <h3 className="text-xl font-bold text-blue-400">OtimizaAds</h3>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              A ferramenta de IA que transforma suas ideias em anúncios de alta conversão. 
              Feito por empreendedores, para empreendedores.
            </p>
            <div className="flex gap-4">
              <Link to="/registro">
                <span className="text-blue-400 hover:text-blue-300">Começar Grátis</span>
              </Link>
              <Link to="/login">
                <span className="text-gray-300 hover:text-white">Fazer Login</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#funcionalidades" className="hover:text-white">Funcionalidades</a></li>
              <li><a href="#precos" className="hover:text-white">Preços</a></li>
              <li><a href="#" className="hover:text-white">Exemplos</a></li>
              <li><a href="#" className="hover:text-white">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Contato</a></li>
              <li><a href="#" className="hover:text-white">Suporte</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex gap-6 text-sm text-gray-400 mb-4 md:mb-0">
            <a href="#" className="hover:text-white">Termos de Serviço</a>
            <a href="#" className="hover:text-white">Política de Privacidade</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
          <p className="text-sm text-gray-400">
            © 2024 OtimizaAds. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;