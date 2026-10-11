/** Rol del personal tomado del JWT (sin verificar firma: es una regla de flujo, no de seguridad). */
export function rolDelToken(authorization?: string): string | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    return typeof p.rol === 'string' ? p.rol : null;
  } catch {
    return null;
  }
}
