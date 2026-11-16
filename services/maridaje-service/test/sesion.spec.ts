/** Verificación del JWT del personal (RNF10) en maridaje. */
import { createHmac } from 'crypto';
import { sesionDelToken } from '../src/common/sesion';

const SECRETO = 'secreto-de-prueba';
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function firmar(payload: object, secreto = SECRETO) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64(payload);
  return `${h}.${p}.${createHmac('sha256', secreto).update(`${h}.${p}`).digest('base64url')}`;
}
const futuro = () => Math.floor(Date.now() / 1000) + 3600;

describe('sesionDelToken', () => {
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });

  it('devuelve la sesión de un token bien firmado', () => {
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'u1', rol: 'SOMMELIER', exp: futuro() })}`)).toEqual({ id: 'u1', rol: 'SOMMELIER' });
  });
  it('rechaza firma falsa, carga alterada y token vencido', () => {
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'x', rol: 'SOMMELIER', exp: futuro() }, 'otra')}`)).toBeNull();
    const [h, , s] = firmar({ sub: 'u1', rol: 'MOZO', exp: futuro() }).split('.');
    expect(sesionDelToken(`Bearer ${h}.${b64({ sub: 'u1', rol: 'SOMMELIER', exp: futuro() })}.${s}`)).toBeNull();
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'u1', rol: 'SOMMELIER', exp: 1 })}`)).toBeNull();
  });
  it('rechaza un token firmado pero sin vencimiento (exp)', () => {
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'u1', rol: 'ALMACEN' })}`)).toBeNull();
  });
  it('rechaza ausencia de token y basura', () => {
    expect(sesionDelToken(undefined)).toBeNull();
    expect(sesionDelToken('Bearer basura')).toBeNull();
  });
});
