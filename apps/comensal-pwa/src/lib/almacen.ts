/**
 * Lectura y escritura de sessionStorage sin que un navegador sin almacenamiento (modo privado, bloqueado)
 * rompa la app: si no se puede leer devuelve null y si no se puede escribir no hace nada.
 */
export const leerSesionLocal = (clave: string): string | null => {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
};

export const guardarSesionLocal = (clave: string, valor: string): void => {
  try {
    sessionStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento */
  }
};

/** Lee un valor guardado como JSON; null si no existe o está dañado. */
export const leerJsonSesion = <T,>(clave: string): T | null => {
  const crudo = leerSesionLocal(clave);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as T;
  } catch {
    return null;
  }
};
