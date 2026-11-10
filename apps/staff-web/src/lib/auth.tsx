import React, { createContext, useContext, useState } from 'react';
import { api, leerSesion, guardarSesion, borrarSesion } from './api';

export type Rol =
  | 'ADMINISTRADOR' | 'JEFE_SALON' | 'MOZO' | 'COCINA' | 'SOMMELIER' | 'ALMACEN';

export type Modulo = 'kds' | 'mesas' | 'carta' | 'sommelier' | 'inventario' | 'analitica' | 'cuentas';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

// Módulos del portal a los que accede cada rol (primer elemento = pantalla inicial)
export const ACCESO_POR_ROL: Record<Rol, Modulo[]> = {
  ADMINISTRADOR: ['analitica', 'kds', 'mesas', 'carta', 'sommelier', 'inventario', 'cuentas'],
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

interface AuthCtx {
  usuario: Usuario | null;
  login: (email: string, password: string, recordar?: boolean) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const leerUsuario = (): Usuario | null => leerSesion<Usuario>()?.usuario ?? null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario);

  const login = async (email: string, password: string, recordar = false) => {
    const r = await api<{ accessToken: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    guardarSesion(r.accessToken, r.usuario, recordar);
    setUsuario(r.usuario);
  };

  const logout = () => {
    borrarSesion();
    setUsuario(null);
  };

  return <Ctx.Provider value={{ usuario, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
};
