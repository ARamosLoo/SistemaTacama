/** Sesión del personal tomada del JWT (sin verificar firma: es una regla de flujo, no de seguridad). */
export function sesionDelToken(authorization?: string): { id: string; rol: string } | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    return typeof p.sub === 'string' && typeof p.rol === 'string' ? { id: p.sub, rol: p.rol } : null;
  } catch {
    return null;
  }
}
