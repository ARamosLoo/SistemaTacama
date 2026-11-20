/** KPIs y auditoría: solo dirección con JWT firmado y vigente. */
import { createHmac } from 'crypto';
import { SoloDireccionGuard } from '../src/common/solo-direccion.guard';

const SECRETO = 'secreto-de-prueba';
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const firmar = (payload: object, secreto = SECRETO) => {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64(payload);
  return `${h}.${p}.${createHmac('sha256', secreto).update(`${h}.${p}`).digest('base64url')}`;
};
const exp = () => Math.floor(Date.now() / 1000) + 3600;
const ctx = (authorization?: string) => ({ switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }) }) as any;

describe('SoloDireccionGuard', () => {
  const guard = new SoloDireccionGuard();
  beforeEach(() => { process.env.JWT_SECRET = SECRETO; });
  afterAll(() => { delete process.env.JWT_SECRET; });

  it('rechaza sin token', () => expect(() => guard.canActivate(ctx())).toThrow());
  it('rechaza a un mozo', () => expect(() => guard.canActivate(ctx(`Bearer ${firmar({ sub: 'u', rol: 'MOZO', exp: exp() })}`))).toThrow());
  it('rechaza un rol falsificado con otra clave', () =>
    expect(() => guard.canActivate(ctx(`Bearer ${firmar({ sub: 'u', rol: 'ADMINISTRADOR', exp: exp() }, 'otra')}`))).toThrow());
  it('acepta jefe de salón y administrador', () => {
    expect(guard.canActivate(ctx(`Bearer ${firmar({ sub: 'u', rol: 'JEFE_SALON', exp: exp() })}`))).toBe(true);
    expect(guard.canActivate(ctx(`Bearer ${firmar({ sub: 'u', rol: 'ADMINISTRADOR', exp: exp() })}`))).toBe(true);
  });
});
