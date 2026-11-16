/** Verificación del JWT del personal (RNF10): firma, expiración y datos de sesión. */
import { createHmac } from 'crypto';
import { sesionDelToken } from '../src/common/sesion';

const SECRETO = 'secreto-de-prueba';
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function firmar(payload: object, secreto = SECRETO) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64(payload);
  return `${h}.${p}.${createHmac('sha256', secreto).update(`${h}.${p}`).digest('base64url')}`;
}
const futuro = () => Math.floor(Date.now() / 1000) + 3600;

describe('sesionDelToken (con JWT_SECRET)', () => {
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });

  it('devuelve la sesión de un token bien firmado', () => {
    const t = firmar({ sub: 'u1', rol: 'MOZO', nombre: 'Mozo Uno', exp: futuro() });
    expect(sesionDelToken(`Bearer ${t}`)).toEqual({ id: 'u1', rol: 'MOZO', nombre: 'Mozo Uno' });
  });
  it('usa el correo si el token no trae nombre', () => {
    const t = firmar({ sub: 'u1', rol: 'MOZO', email: 'mozo@tacama.pe', exp: futuro() });
    expect(sesionDelToken(`Bearer ${t}`)?.nombre).toBe('mozo@tacama.pe');
  });
  it('rechaza un token firmado con otra clave (rol falsificado)', () => {
    const t = firmar({ sub: 'x', rol: 'ADMINISTRADOR', exp: futuro() }, 'otra-clave');
    expect(sesionDelToken(`Bearer ${t}`)).toBeNull();
  });
  it('rechaza un token con la carga alterada', () => {
    const t = firmar({ sub: 'u1', rol: 'MOZO', exp: futuro() });
    const [h, , s] = t.split('.');
    expect(sesionDelToken(`Bearer ${h}.${b64({ sub: 'u1', rol: 'ADMINISTRADOR', exp: futuro() })}.${s}`)).toBeNull();
  });
  it('rechaza un token vencido', () => {
    const t = firmar({ sub: 'u1', rol: 'MOZO', exp: Math.floor(Date.now() / 1000) - 10 });
    expect(sesionDelToken(`Bearer ${t}`)).toBeNull();
  });
  it('rechaza un token firmado pero sin vencimiento (exp)', () => {
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'u1', rol: 'MOZO' })}`)).toBeNull();
  });

  it('rechaza ausencia de token, basura y tokens sin rol', () => {
    expect(sesionDelToken(undefined)).toBeNull();
    expect(sesionDelToken('Bearer basura')).toBeNull();
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'u1', exp: futuro() })}`)).toBeNull();
  });
});

describe('sesionDelToken (sin JWT_SECRET, desarrollo local)', () => {
  it('solo decodifica el token', () => {
    delete process.env.JWT_SECRET;
    expect(sesionDelToken(`Bearer ${firmar({ sub: 'u1', rol: 'COCINA', nombre: 'Chef' }, 'cualquiera')}`)).toEqual({ id: 'u1', rol: 'COCINA', nombre: 'Chef' });
  });
});

describe('sesionDelToken en producción', () => {
  const entorno = { ...process.env };
  afterEach(() => { process.env = { ...entorno }; jest.resetModules(); });
  it('no arranca sin JWT_SECRET: un servicio sin secreto aceptaría tokens falsos', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    jest.resetModules();
    expect(() => require('../src/common/sesion')).toThrow(/JWT_SECRET es obligatorio/);
  });
  it('arranca con JWT_SECRET definido', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = SECRETO;
    jest.resetModules();
    expect(() => require('../src/common/sesion')).not.toThrow();
  });
});
