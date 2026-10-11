/** Sesión del personal tomada del JWT (sin verificar firma: son reglas de flujo, no de seguridad). */
export interface SesionPersonal {
  id: string;
  rol: string;
  nombre: string;
}

export function sesionDelToken(authorization?: string): SesionPersonal | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    if (typeof p.sub !== 'string' || typeof p.rol !== 'string') return null;
    return { id: p.sub, rol: p.rol, nombre: typeof p.nombre === 'string' ? p.nombre : p.email ?? 'Mozo' };
  } catch {
    return null;
  }
}
