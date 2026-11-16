import { createHmac, timingSafeEqual } from 'crypto';

// Sin secreto, el servicio aceptaría cualquier token firmado a mano: en producción no se permite arrancar así
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción: sin él no se puede verificar la firma de los tokens');
}

/**
 * Decodifica el JWT del personal. Si JWT_SECRET está definido (siempre en producción) verifica la firma HS256 y la
 * expiración; un token falsificado o vencido se trata como si no hubiera sesión. Sin JWT_SECRET (desarrollo local
 * sin .env) solo decodifica.
 */
function payloadDelToken(authorization?: string): Record<string, unknown> | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p) return null;
    const secreto = process.env.JWT_SECRET;
    if (secreto) {
      const esperado = createHmac('sha256', secreto).update(`${h}.${p}`).digest();
      const recibido = Buffer.from(s ?? '', 'base64url');
      if (recibido.length !== esperado.length || !timingSafeEqual(recibido, esperado)) return null;
    }
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    // Con la firma verificada, el token debe traer vencimiento y no estar vencido
    if (secreto && (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now())) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sesionDelToken(authorization?: string): { id: string; rol: string } | null {
  const p = payloadDelToken(authorization);
  return p && typeof p.sub === 'string' && typeof p.rol === 'string' ? { id: p.sub, rol: p.rol } : null;
}
