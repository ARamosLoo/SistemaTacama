import React, { useState, useEffect } from 'react';
import { CocinaKdsPage } from './pages/CocinaKdsPage';
import { MesasMozoPage } from './pages/MesasMozoPage';
import { SommelierPage } from './pages/SommelierPage';
import { InventarioPage } from './pages/InventarioPage';
import { CartaAdminPage } from './pages/CartaAdminPage';
import { AnaliticaKpiPage } from './pages/AnaliticaKpiPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth, ACCESO_POR_ROL, NOMBRE_ROL, Modulo } from './lib/auth';
import { HojaVid } from './components/Logo';
import { Creditos } from './components/Creditos';
import { ChefHat, Users, Wine, Archive, BarChart3, LogOut, BookOpen } from 'lucide-react';

const MODULOS: { id: Modulo; etiqueta: string; icono: React.ReactNode }[] = [
  { id: 'kds', etiqueta: 'Cocina (KDS)', icono: <ChefHat className="w-4 h-4" /> },
  { id: 'mesas', etiqueta: 'Mesas y mozos', icono: <Users className="w-4 h-4" /> },
  { id: 'carta', etiqueta: 'Carta y precios', icono: <BookOpen className="w-4 h-4" /> },
  { id: 'sommelier', etiqueta: 'Sommelier', icono: <Wine className="w-4 h-4" /> },
  { id: 'inventario', etiqueta: 'Inventario y cava', icono: <Archive className="w-4 h-4" /> },
  { id: 'analitica', etiqueta: 'KPIs y auditoría', icono: <BarChart3 className="w-4 h-4" /> },
];

const Portal: React.FC = () => {
  const { usuario, logout } = useAuth();
  const permitidos = usuario ? ACCESO_POR_ROL[usuario.rol] : [];
  const [moduloActivo, setModuloActivo] = useState<Modulo>(permitidos[0] ?? 'kds');

  // Cada inicio de sesión arranca en la pantalla inicial del rol
  useEffect(() => {
    if (usuario) setModuloActivo(ACCESO_POR_ROL[usuario.rol][0]);
  }, [usuario?.id]);

  if (!usuario) return <LoginPage />;

  // Si el rol cambió (nuevo login) y el módulo activo ya no está permitido, vuelve al inicial
  const activo: Modulo = permitidos.includes(moduloActivo) ? moduloActivo : permitidos[0];
  const visibles = MODULOS.filter((m) => permitidos.includes(m.id)).sort(
    (a, b) => permitidos.indexOf(a.id) - permitidos.indexOf(b.id),
  );

  return (
    <div className="min-h-screen bg-[#121417] text-stone-100 flex flex-col font-sans">
      <header className="bg-[#1A1D23] border-b border-stone-800 px-6 py-3 sticky top-0 z-50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
              <HojaVid className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold tracking-wide text-stone-100 flex items-center gap-2">
                TAMBO DE TACAMA
                <span className="text-[10px] font-sans font-bold bg-[#577A17] text-white px-2 py-0.5 rounded">PORTAL DEL PERSONAL</span>
              </h1>
              <p className="text-xs text-stone-400">Viña Tacama S.A. · Ica, Perú</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0" aria-label="Módulos">
            {visibles.map((m) => (
              <button
                key={m.id}
                onClick={() => setModuloActivo(m.id)}
                aria-current={activo === m.id ? 'page' : undefined}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activo === m.id ? 'bg-[#577A17] text-white shadow' : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                }`}
              >
                {m.icono}
                <span>{m.etiqueta}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:pl-3 md:border-l md:border-stone-700">
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold text-stone-100">{usuario.nombre}</div>
              <div className="text-[11px] text-[#B1CC72]">{NOMBRE_ROL[usuario.rol]}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-300 bg-stone-800 hover:bg-stone-700 transition"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {activo === 'kds' && <CocinaKdsPage />}
        {activo === 'mesas' && <MesasMozoPage />}
        {activo === 'carta' && <CartaAdminPage />}
        {activo === 'sommelier' && <SommelierPage />}
        {activo === 'inventario' && <InventarioPage />}
        {activo === 'analitica' && <AnaliticaKpiPage />}
      </main>

      <footer className="border-t border-stone-800 py-4">
        <Creditos oscuro />
      </footer>
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <Portal />
  </AuthProvider>
);

export default App;
