import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: "OtimizaAds",
    defaultLanguage: "pt-BR",
    theme: "light",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configurações salvas!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações da Plataforma</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as configurações gerais da plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Altere as configurações básicas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="siteName"
                className="block text-sm font-medium text-gray-700"
              >
                Nome do Site
              </label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="defaultLanguage"
                className="block text-sm font-medium text-gray-700"
              >
                Idioma Padrão
              </label>
              <select
                id="defaultLanguage"
                name="defaultLanguage"
                value={settings.defaultLanguage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">Inglês (Estados Unidos)</option>
                <option value="es-ES">Espanhol (Espanha)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="theme"
                className="block text-sm font-medium text-gray-700"
              >
                Tema
              </label>
              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="system">Sistema</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Salvar Configurações
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
