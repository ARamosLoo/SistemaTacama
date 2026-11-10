import React, { useState, useEffect } from 'react';
import { CocinaKdsPage } from './pages/CocinaKdsPage';
import { MesasMozoPage } from './pages/MesasMozoPage';
import { SommelierPage } from './pages/SommelierPage';
import { InventarioPage } from './pages/InventarioPage';
import { CartaAdminPage } from './pages/CartaAdminPage';
import { AnaliticaKpiPage } from './pages/AnaliticaKpiPage';
import { CuentasPage } from './pages/CuentasPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth, ACCESO_POR_ROL, NOMBRE_ROL, Modulo } from './lib/auth';
import { HojaVid } from './components/Logo';
import { Creditos } from './components/Creditos';

const MODULOS: { id: Modulo; etiqueta: string }[] = [
  { id: 'kds', etiqueta: 'Cocina (KDS)' },
  { id: 'mesas', etiqueta: 'Mesas y mozos' },
  { id: 'carta', etiqueta: 'Carta y precios' },
  { id: 'sommelier', etiqueta: 'Sommelier' },
  { id: 'inventario', etiqueta: 'Inventario y cava' },
  { id: 'analitica', etiqueta: 'KPIs y auditoría' },
  { id: 'cuentas', etiqueta: 'Cuentas' },
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
    <div className="min-h-screen bg-[#F6F8F0] text-stone-900 flex flex-col font-sans">
      <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 lg:sticky lg:top-0 z-50 shadow-sm">
        {/* Fila 1: marca y usuario. Fila 2: módulos, que se acomodan en varias líneas según el ancho (siempre se ven todos) */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-3 min-w-0 flex-1 basis-60">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-md">
              <HojaVid className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-semibold tracking-wide text-stone-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                TAMBO DE TACAMA
                <span className="text-[10px] font-sans font-bold bg-[#577A17] text-white px-2 py-0.5 rounded">PORTAL DEL PERSONAL</span>
              </h1>
              <p className="hidden sm:block text-xs text-stone-600">Viña Tacama S.A. · Ica, Perú</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right leading-tight min-w-0">
              <div className="text-xs font-semibold text-stone-900 break-words">{usuario.nombre}</div>
              <div className="text-[11px] text-[#466212]">{NOMBRE_ROL[usuario.rol]}</div>
            </div>
            <button
              onClick={logout}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-200 hover:bg-stone-300 transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Teléfono: lista desplegable con todos los módulos (ocupa poco alto) */}
        <div className="mt-3 sm:hidden">
          <label className="sr-only" htmlFor="selector-modulo">Módulo</label>
          <select
            id="selector-modulo"
            value={activo}
            onChange={(e) => setModuloActivo(e.target.value as Modulo)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/30 focus:border-[#577A17]"
          >
            {visibles.map((m) => <option key={m.id} value={m.id}>{m.etiqueta}</option>)}
          </select>
        </div>

        {/* Tablet y computadora: botones que se acomodan en las líneas necesarias */}
        <nav className="mt-3 hidden sm:flex flex-wrap gap-1.5" aria-label="Módulos">
          {visibles.map((m) => (
            <button
              key={m.id}
              onClick={() => setModuloActivo(m.id)}
              aria-current={activo === m.id ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activo === m.id ? 'bg-[#577A17] text-white shadow' : 'text-stone-700 bg-stone-100 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {m.etiqueta}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-grow">
        {activo === 'kds' && <CocinaKdsPage />}
        {activo === 'mesas' && <MesasMozoPage />}
        {activo === 'carta' && <CartaAdminPage />}
        {activo === 'sommelier' && <SommelierPage />}
        {activo === 'inventario' && <InventarioPage />}
        {activo === 'analitica' && <AnaliticaKpiPage />}
        {activo === 'cuentas' && <CuentasPage />}
      </main>

      <footer className="border-t border-stone-200 py-4">
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
