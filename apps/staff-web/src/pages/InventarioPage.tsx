import React, { useState, useEffect, useCallback } from 'react';
import { api, tiempoRelativo } from '../lib/api';
import { Wine, AlertTriangle, RefreshCw, CheckCircle2, Save, PackageX, Hourglass } from 'lucide-react';

type Nivel = 'AGOTADO' | 'CRITICO' | 'BAJO' | 'OK';

interface ItemStock {
  id: string;
  sku: string;
  nombre: string;
  linea: string;
  stockActual: number;
  umbralMinimo: number;
  precioPEN: number;
  agotado: boolean;
  nivel: Nivel;
  minutosRestantes: number | null;
  ritmoPorHora: number;
  ultimaActualizacion: string;
}

/** Mensaje que ve el equipo (y el comensal) según el stock y la frecuencia de pedidos. */
export function mensajeDeStock(i: Pick<ItemStock, 'nivel' | 'stockActual' | 'minutosRestantes'>): string | null {
  if (i.nivel === 'AGOTADO') return 'Agotado: no se ofrece a los comensales';
  const tiempo = i.minutosRestantes === null ? '' : i.minutosRestantes < 60 ? ` · a este ritmo se agota en ~${Math.max(5, Math.round(i.minutosRestantes / 5) * 5)} min` : ` · alcanza para ~${Math.round(i.minutosRestantes / 60)} h`;
  if (i.nivel === 'CRITICO') return `¡Últimas ${i.stockActual} botellas!${tiempo}`;
  if (i.nivel === 'BAJO') return `Quedan ${i.stockActual} botellas${tiempo}`;
  return null;
}

const ESTILO_NIVEL: Record<Nivel, string> = {
  AGOTADO: 'bg-rose-500/20 text-rose-700 border-rose-500/40',
  CRITICO: 'bg-orange-500/20 text-orange-700 border-orange-500/40',
  BAJO: 'bg-amber-500/20 text-amber-700 border-amber-500/40',
  OK: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
};
const ROTULO_NIVEL: Record<Nivel, string> = { AGOTADO: 'Agotado', CRITICO: 'Se acaba', BAJO: 'Stock bajo', OK: 'Óptimo' };

export const InventarioPage: React.FC = () => {
  const [stock, setStock] = useState<ItemStock[]>([]);
  const [edicion, setEdicion] = useState<Record<string, { stock?: string; umbral?: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [mensajeSync, setMensajeSync] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [{ data: ex }, { data: etq }] = await Promise.all([
        api<{ data: any[] }>('/existencias/todas'),
        api<{ data: any[] }>('/etiquetas'),
      ]);
      const info = new Map<string, any>(etq.map((e) => [e.codigoInterno as string, e]));
      setStock(
        ex.map((s) => ({
          id: s.etiquetaId,
          sku: s.sku,
          nombre: s.nombre,
          linea: info.get(s.sku)?.cepa ?? s.tipo,
          stockActual: s.stockActual,
          umbralMinimo: s.umbralMinimo,
          precioPEN: Number(info.get(s.sku)?.precioLista ?? 0),
          agotado: !!s.agotado,
          nivel: s.nivel as Nivel,
          minutosRestantes: s.minutosRestantes ?? null,
          ritmoPorHora: s.ritmoPorHora ?? 0,
          ultimaActualizacion: tiempoRelativo(s.ultimaActualizacion),
        })),
      );
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Sin conexión con inventario-service');
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000); // refleja descuentos de stock por comandas
    return () => clearInterval(t);
  }, [cargar]);

  const guardar = async (item: ItemStock, cambios: { stockActual?: number; umbralMinimo?: number; agotado?: boolean }, aviso: string) => {
    setOcupado(item.id);
    try {
      await api(`/existencias/${item.sku}`, { method: 'PUT', body: cambios });
      setEdicion((x) => { const { [item.id]: _, ...resto } = x; return resto; });
      await cargar();
      setMensajeSync(aviso);
      setError(null);
      setTimeout(() => setMensajeSync(null), 3500);
    } catch (e: any) {
      setError(e.message ?? 'No se pudo guardar el cambio');
    } finally {
      setOcupado(null);
    }
  };

  const sincronizarSandbox = async () => {
    setSincronizando(true);
    try {
      await cargar();
      setMensajeSync('Existencias consultadas en inventario-service (sandbox de bodega WireMock)');
    } finally {
      setSincronizando(false);
      setTimeout(() => setMensajeSync(null), 4000);
    }
  };

  const porAtender = stock.filter((s) => s.nivel !== 'OK');

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-2xl border border-stone-200 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-100 flex items-center justify-center text-white shadow-md">
            <Wine className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-serif-tacama text-xl font-bold text-stone-900 flex items-center gap-2">
              Control de Inventario y Cava
            </h2>
            <p className="text-xs text-stone-600">
              Ajusta el stock, el umbral y marca agotados. Los comensales ven avisos según qué tan rápido se pide cada etiqueta.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={sincronizarSandbox}
            disabled={sincronizando}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 shadow flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>{sincronizando ? 'Sincronizando...' : 'Consultar Sandbox Bodega'}</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-700">{error}</div>}

      {mensajeSync && (
        <div role="status" className="bg-emerald-50/60 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-700 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{mensajeSync}</span>
        </div>
      )}

      {porAtender.length > 0 && (
        <div className="bg-amber-50/30 border border-amber-500/30 rounded-2xl p-4 space-y-1.5">
          <div className="text-xs font-bold text-amber-700 flex items-center gap-2"><Hourglass className="w-4 h-4" /> Requieren reposición</div>
          {porAtender.map((s) => (
            <div key={s.id} className="text-xs text-stone-700">
              <strong className="text-stone-900">{s.nombre}</strong> — {mensajeDeStock(s)}
            </div>
          ))}
        </div>
      )}

      {/* Stock Cards / Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-stone-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="tabla-tarjetas w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100/80 text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Etiqueta Tacama</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Umbral</th>
                <th className="p-4">Estado y ritmo</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {stock.map((item) => {
                const e = edicion[item.id] ?? {};
                const stockNuevo = e.stock !== undefined ? Number(e.stock) : item.stockActual;
                const umbralNuevo = e.umbral !== undefined ? Number(e.umbral) : item.umbralMinimo;
                const hayCambios = (e.stock !== undefined && stockNuevo !== item.stockActual) || (e.umbral !== undefined && umbralNuevo !== item.umbralMinimo);
                const mensaje = mensajeDeStock(item);
                return (
                  <tr key={item.id} className={`hover:bg-stone-200/40 transition ${item.agotado ? 'bg-rose-50/10' : ''}`}>
                    <td data-label="Etiqueta Tacama" className="p-4">
                      <div className="font-bold text-stone-900">{item.nombre}</div>
                      <div className="text-[11px] text-stone-500"><span className="font-mono">{item.sku}</span> · {item.linea}</div>
                    </td>
                    <td data-label="Stock" className="p-4 text-center">
                      <input
                        type="number"
                        min={0}
                        value={e.stock ?? item.stockActual}
                        onChange={(ev) => setEdicion((x) => ({ ...x, [item.id]: { ...x[item.id], stock: ev.target.value } }))}
                        aria-label={`Stock de ${item.nombre}`}
                        className="w-16 text-center bg-stone-100 border border-stone-300 rounded-lg py-1 font-bold text-base text-stone-900 focus:outline-none focus:border-[#577A17]"
                      />
                    </td>
                    <td data-label="Umbral" className="p-4 text-center">
                      <input
                        type="number"
                        min={0}
                        value={e.umbral ?? item.umbralMinimo}
                        onChange={(ev) => setEdicion((x) => ({ ...x, [item.id]: { ...x[item.id], umbral: ev.target.value } }))}
                        aria-label={`Umbral de ${item.nombre}`}
                        className="w-14 text-center bg-stone-100 border border-stone-300 rounded-lg py-1 text-stone-700 focus:outline-none focus:border-[#577A17]"
                      />
                    </td>
                    <td data-label="Estado y ritmo" className="p-4">
                      <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-md font-bold ${ESTILO_NIVEL[item.nivel]}`}>
                        {item.nivel !== 'OK' && <AlertTriangle className="w-3 h-3" />}
                        {ROTULO_NIVEL[item.nivel]}
                      </span>
                      <div className="text-[11px] text-stone-600 mt-1 max-w-[260px]">
                        {mensaje ?? 'Sin alertas'}
                        {item.ritmoPorHora > 0 && <span className="text-stone-500"> · {item.ritmoPorHora.toFixed(1)} bot./h</span>}
                      </div>
                    </td>
                    <td data-label="Precio" className="p-4 font-semibold text-amber-600">S/ {item.precioPEN.toFixed(2)}</td>
                    <td data-label="Acciones" className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {hayCambios && (
                          <button
                            onClick={() => guardar(item, {
                              ...(e.stock !== undefined ? { stockActual: stockNuevo } : {}),
                              ...(e.umbral !== undefined ? { umbralMinimo: umbralNuevo } : {}),
                            }, `${item.nombre}: stock ${stockNuevo}, umbral ${umbralNuevo}`)}
                            disabled={ocupado === item.id}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1 disabled:opacity-60"
                          >
                            <Save className="w-3.5 h-3.5" /> Guardar
                          </button>
                        )}
                        <button
                          onClick={() => guardar(item, { agotado: !item.agotado },
                            item.agotado ? `${item.nombre} disponible de nuevo` : `${item.nombre} marcado como agotado`)}
                          disabled={ocupado === item.id || (item.agotado && item.stockActual <= 0)}
                          title={item.agotado && item.stockActual <= 0 ? 'Sin stock: ajusta el stock para reponerlo' : undefined}
                          className={`px-2.5 py-1.5 font-bold rounded-lg flex items-center gap-1 border disabled:opacity-50 ${
                            item.agotado ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/25' : 'bg-rose-500/15 text-rose-700 border-rose-500/40 hover:bg-rose-500/25'
                          }`}
                        >
                          <PackageX className="w-3.5 h-3.5" /> {item.agotado ? 'Reponer' : 'Marcar agotado'}
                        </button>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1">Actualizado {item.ultimaActualizacion}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
