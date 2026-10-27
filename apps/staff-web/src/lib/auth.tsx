import React, { createContext, useContext, useState } from 'react';
import { api, TOKEN_KEY } from './api';

export type Rol =
  | 'ADMINISTRADOR' | 'JEFE_SALON' | 'MOZO' | 'COCINA' | 'SOMMELIER' | 'ALMACEN';

export type Modulo = 'kds' | 'mesas' | 'carta' | 'sommelier' | 'inventario' | 'analitica';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

// Módulos del portal a los que accede cada rol (primer elemento = pantalla inicial)
export const ACCESO_POR_ROL: Record<Rol, Modulo[]> = {
  ADMINISTRADOR: ['analitica', 'kds', 'mesas', 'carta', 'sommelier', 'inventario'],
  JEFE_SALON: ['mesas', 'kds', 'carta', 'analitica', 'inventario'],
  MOZO: ['mesas'],
  COCINA: ['kds'],
  SOMMELIER: ['sommelier', 'inventario'],
  ALMACEN: ['inventario'],
};

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  JEFE_SALON: 'Jefe de salón',
  MOZO: 'Mozo',
  COCINA: 'Cocina',
  SOMMELIER: 'Sommelier',
  ALMACEN: 'Almacén',
};

// Cuentas de desarrollo (las mismas que carga el seed del auth-service)
export const CUENTAS_DEMO: { rol: Rol; email: string; password: string }[] = [
  { rol: 'ADMINISTRADOR', email: 'admin@tacama.pe', password: 'Admin2024!' },
  { rol: 'JEFE_SALON', email: 'jefe@tacama.pe', password: 'JefeSalon2024!' },
  { rol: 'MOZO', email: 'mozo1@tacama.pe', password: 'Mozo2024!' },
  { rol: 'COCINA', email: 'cocina@tacama.pe', password: 'Cocina2024!' },
  { rol: 'SOMMELIER', email: 'sommelier@tacama.pe', password: 'Sommelier2024!' },
  { rol: 'ALMACEN', email: 'almacen@tacama.pe', password: 'Almacen2024!' },
];

interface AuthCtx {
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const USER_KEY = 'tacama.staff.usuario';

const leerUsuario = (): Usuario | null => {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw && sessionStorage.getItem(TOKEN_KEY) ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario);

  const login = async (email: string, password: string) => {
    const r = await api<{ accessToken: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    try {
      sessionStorage.setItem(TOKEN_KEY, r.accessToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(r.usuario));
    } catch { /* almacenamiento no disponible */ }
    setUsuario(r.usuario);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch { /* noop */ }
    setUsuario(null);
  };

  return <Ctx.Provider value={{ usuario, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
};
