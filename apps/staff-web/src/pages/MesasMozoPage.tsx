import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, nombreMesa } from '../lib/api';
import { useAuth } from '../lib/auth';
import { MesaStatus } from '../types';
import { Users, Clock, Wine, CheckCircle2, Star, DoorClosed, Banknote, CreditCard, Landmark, HandPlatter, UserCheck } from 'lucide-react';

const MOTIVOS_LIBERAR = [
  'El cliente se retiró sin pedir la cuenta',
  'El cliente pagó directamente en caja',
  'Mesa abierta por error',
];

const zonaDe =(numero: number): MesaStatus['zona'] =>
  numero <= 2 ? 'Terraza Principal' : numero <= 4 ? 'Jardín de Viñedos' : 'Salón Bodega 1540';

export const MesasMozoPage: React.FC = () => {
  const { usuario } = useAuth();
  const [mesas, setMesas] = useState<MesaStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [zonaFiltro, setZonaFiltro] = useState<string>('TODAS');
  const [vista, setVista] = useState<'TODAS' | 'SIN_ATENDER' | 'MIAS'>('TODAS');
  const [liberando, setLiberando] = useState<{ id: string; motivo: string } | null>(null);

  const esJefatura = usuario?.rol === 'JEFE_SALON' || usuario?.rol === 'ADMINISTRADOR';
  const esMozo = usuario?.rol === 'MOZO';

  const cargar = useCallback(async () => {
    try {
      const [{ data: ms }, { data: cmds }] = await Promise.all([
        api<{ data: any[] }>('/mesas'),
        api<{ data: any[] }>('/comandas?estado=PENDIENTE,EN_PREPARACION,LISTA,ENTREGADA'),
      ]);
      setMesas(
        ms.map((m) => {
          const deMesa = cmds.filter((c) => c.mesaId === m.id);
          const activa = deMesa[0];
          const conMozo = deMesa.find((c) => c.mozoId);
          return {
            id: m.id,
            numero: m.numero,
            zona: zonaDe(m.numero),
            capacidad: m.capacidad,
            estado: activa ? (deMesa.some((c) => c.cuentaSolicitadaEn) ? 'PIDIENDO_CUENTA' : 'OCUPADA') : 'LIBRE',
            comandaActivaId: activa ? 'CMD-' + activa.id.slice(0, 4).toUpperCase() : undefined,
            comandas: deMesa.map((c) => ({
              id: c.id, codigo: 'CMD-' + c.id.slice(0, 4).toUpperCase(), estado: c.estado,
              cuentaSolicitada: !!c.cuentaSolicitadaEn,
              puntuacion: c.valoracion?.puntuacion, sinCalificar: !!c.calificacionOmitida,
              total: (c.items ?? []).reduce((a: number, i: any) => a + Number(i.subtotal), 0),
              metodoPago: c.metodoPago ?? undefined, pagaCon: c.efectivoPagaCon != null ? Number(c.efectivoPagaCon) : undefined,
              modificadaEn: c.modificadaEn ?? undefined,
            })),
            mozoId: conMozo?.mozoId ?? undefined,
            mozoAsignado: conMozo?.mozoNombre ?? undefined,
            tiempoOcupadaMin: activa
              ? Math.max(1, Math.round((Date.now() - new Date(activa.createdAt).getTime()) / 60000))
              : undefined,
          } as MesaStatus;
        }),
      );
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Sin conexión con los servicios de salón');
    }
  }, []);

  useEffect(() => {
    cargar();
    const socket = io(`${import.meta.env.VITE_SOCKET_URL ?? ''}/cocina`, { query: { rol: 'jefe_salon' } });
    socket.on('cocina:estado_cambiado', cargar);
    socket.on('cocina:nueva_comanda', cargar);
    const t = setInterval(cargar, 8000);
    return () => { socket.close(); clearInterval(t); };
  }, [cargar]);

  // Ejecuta una acción del servidor y vuelve a leer las mesas
  const ejecutar = async (accion: () => Promise<unknown>, falla: string) => {
    try {
      await accion();
      setError(null);
    } catch (e: any) {
      setError(e.message ?? falla);
    } finally {
      cargar();
    }
  };

  // El mozo toma la mesa: desde ahí es el responsable hasta que se cierre y la mesa quede libre
  const atenderMesa = (comandaId: string) =>
    ejecutar(() => api(`/comandas/${comandaId}/atender`, { method: 'POST' }), 'No se pudo tomar la mesa');

  // La entrega en mesa la confirma el mozo (cocina solo deja la comanda lista)
  const confirmarEntrega = (comandaId: string) =>
    ejecutar(() => api(`/comandas/${comandaId}`, { method: 'PATCH', body: { estado: 'ENTREGADA' } }), 'No se pudo confirmar la entrega');

  // El mozo cobra con el método que eligió el comensal y confirma el pago: la mesa queda libre
  const cerrarMesa = (comandaId: string) =>
    ejecutar(() => api(`/comandas/${comandaId}/cerrar`, { method: 'POST' }), 'No se pudo cerrar la mesa');

  const liberarMesa = (comandaId: string, motivo: string) =>
    ejecutar(() => api(`/comandas/${comandaId}/liberar`, { method: 'POST', body: { motivo } }), 'No se pudo liberar la mesa');

  const sinAtender = mesas.filter((m) => m.comandas?.length && !m.mozoId);
  const mias = mesas.filter((m) => m.comandas?.length && m.mozoId === usuario?.id);

  const mesasFiltradas = mesas
    .filter((m) => zonaFiltro === 'TODAS' || m.zona === zonaFiltro)
    .filter((m) => vista === 'TODAS' || (vista === 'SIN_ATENDER' ? sinAtender.includes(m) : mias.includes(m)));

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-2xl border border-stone-200 shadow-md">
        <div>
          <h2 className="font-serif-tacama text-xl font-bold text-stone-900 flex items-center gap-2">
            Gestión de Mesas y Salón
          </h2>
          <p className="text-xs text-stone-600">
            Los pedidos llegan a todos los mozos. Quien toma una mesa libre queda como responsable hasta cerrarla.
          </p>
        </div>

        {/* Zona Filters */}
        <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto sin-barra">
          {['TODAS', 'Terraza Principal', 'Jardín de Viñedos', 'Salón Bodega 1540'].map((z) => (
            <button
              key={z}
              onClick={() => setZonaFiltro(z)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                zonaFiltro === z
                  ? 'bg-[#577A17] text-white shadow'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {z === 'TODAS' ? 'Todas las Zonas' : z}
            </button>
          ))}
        </div>
      </div>

      {/* Vista: todas / sin atender / mis mesas */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['TODAS', 'Todas las mesas', null],
          ['SIN_ATENDER', 'Sin atender', sinAtender.length],
          ['MIAS', 'Mis mesas', mias.length],
        ] as const).map(([id, etiqueta, n]) => (
          <button
            key={id}
            onClick={() => setVista(id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
              vista === id ? 'bg-stone-900 text-white border-stone-900' : 'text-stone-700 border-stone-300 hover:border-stone-500'
            }`}
          >
            {etiqueta}
            {n !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${id === 'SIN_ATENDER' && n > 0 ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-800'}`}>{n}</span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="bg-rose-50/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-700">{error}</div>}

      {/* Mesas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mesasFiltradas.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center text-sm text-stone-500 py-10">
            {vista === 'SIN_ATENDER' ? 'No hay mesas esperando mozo.' : vista === 'MIAS' ? 'Aún no tienes mesas a tu cargo.' : 'Sin mesas en esta zona.'}
          </div>
        )}
        {mesasFiltradas.map((m) => {
          const ocupada = !!m.comandas?.length;
          const soyResponsable = !!m.mozoId && m.mozoId === usuario?.id;
          const libreDeMozo = ocupada && !m.mozoId;
          const puedeEntregar = esJefatura || (esMozo && soyResponsable);
          const puedeCobrar = esJefatura || (esMozo && soyResponsable);
          const puedeTomar = ocupada && (esMozo || esJefatura) && !soyResponsable && (libreDeMozo || esJefatura);

          let badgeColor = 'bg-stone-200 text-stone-600 border-stone-300';
          if (m.estado === 'OCUPADA') badgeColor = 'bg-rose-500/20 text-rose-700 border-rose-500/40';
          if (m.estado === 'LIBRE') badgeColor = 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40';
          if (m.estado === 'PIDIENDO_CUENTA') badgeColor = 'bg-amber-500/20 text-amber-700 border-amber-500/40 animate-pulse';

          return (
            <div
              key={m.id}
              className={`bg-[#FFFFFF] rounded-2xl p-5 border shadow-lg flex flex-col justify-between space-y-4 transition ${
                libreDeMozo ? 'border-amber-500/60 ring-1 ring-amber-500/30' : soyResponsable ? 'border-[#577A17]' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">
                      {m.zona}
                    </span>
                    <h3 className="font-serif-tacama text-lg font-bold text-stone-900">
                      Mesa {m.numero < 10 ? `0${m.numero}` : m.numero}
                    </h3>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                    {m.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    <span>Capacidad: {m.capacidad} personas</span>
                  </div>
                  {ocupada && (
                    <div className="flex items-center space-x-2">
                      <Wine className="w-3.5 h-3.5 text-amber-600" />
                      {m.mozoAsignado ? (
                        <span>
                          Atiende: <strong className="text-stone-800">{soyResponsable ? 'Tú' : m.mozoAsignado}</strong>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Sin mozo asignado</span>
                      )}
                    </div>
                  )}
                  {m.tiempoOcupadaMin && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>Tiempo: {m.tiempoOcupadaMin} min</span>
                    </div>
                  )}
                </div>

                {puedeTomar && (
                  <button
                    onClick={() => atenderMesa(m.comandas![0].id)}
                    className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow ${
                      libreDeMozo ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-stone-300 hover:bg-stone-400 text-stone-900'
                    }`}
                  >
                    <HandPlatter className="w-4 h-4" />
                    {libreDeMozo ? 'Atender esta mesa' : 'Tomar la mesa (reasignar)'}
                  </button>
                )}
                {ocupada && !puedeEntregar && !puedeTomar && (
                  <p className="mt-3 text-[11px] text-stone-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> La mesa la atiende {m.mozoAsignado ?? 'otro mozo'}.
                  </p>
                )}
              </div>

              {/* Comandas activas de la mesa: el mozo confirma la entrega cuando cocina la deja lista */}
              <div className="pt-3 border-t border-stone-200 space-y-2">
                {m.comandas && m.comandas.length > 0 ? (
                  m.comandas.map((c) => (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-amber-600">Comanda #{c.codigo}</span>
                          <span className="text-[11px] text-stone-600">
                            {c.estado === 'LISTA' ? 'Lista en cocina: recójala y llévela a la mesa'
                              : c.estado === 'EN_PREPARACION' ? 'En cocina'
                              : c.estado === 'PENDIENTE' ? 'Confirmada, pendiente de cocina'
                              : c.cuentaSolicitada ? 'Cuenta solicitada por el comensal'
                              : 'Entregada · el comensal está comiendo'}
                          </span>
                        </div>
                        {c.estado === 'LISTA' && puedeEntregar && (
                          <button
                            onClick={() => confirmarEntrega(c.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1 animate-pulse shrink-0"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirmar entrega en mesa</span>
                          </button>
                        )}
                        {c.estado === 'LISTA' && !puedeEntregar && esMozo && libreDeMozo && (
                          <span className="text-[10px] text-amber-700 text-right shrink-0">Toma la mesa para llevarla</span>
                        )}
                      </div>

                      {c.estado === 'ENTREGADA' && c.cuentaSolicitada && c.metodoPago && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-[11px] text-amber-800">
                          {c.metodoPago === 'EFECTIVO' ? <Banknote className="w-4 h-4 shrink-0 mt-0.5" /> : c.metodoPago === 'TARJETA' ? <CreditCard className="w-4 h-4 shrink-0 mt-0.5" /> : <Landmark className="w-4 h-4 shrink-0 mt-0.5" />}
                          <span>
                            {c.metodoPago === 'EFECTIVO' && (
                              <>
                                <strong>Efectivo</strong> · total S/ {c.total.toFixed(2)}
                                {c.pagaCon ? <> · paga con S/ {c.pagaCon.toFixed(2)} · <strong>vuelto S/ {(c.pagaCon - c.total).toFixed(2)}</strong></> : ' · no indicó con cuánto paga: lleve cambio'}
                              </>
                            )}
                            {c.metodoPago === 'TARJETA' && <><strong>Tarjeta</strong> · lleve el POS (Izipay u otro) · total S/ {c.total.toFixed(2)}</>}
                            {c.metodoPago === 'TRANSFERENCIA' && <><strong>Transferencia bancaria</strong> · indique los datos de la cuenta y confirme el abono de S/ {c.total.toFixed(2)} antes de confirmar el pago</>}
                          </span>
                        </div>
                      )}

                      {c.estado === 'ENTREGADA' && c.cuentaSolicitada && (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-100/60 rounded-xl px-3 py-2">
                          <span className="text-[11px] text-stone-700 flex items-center gap-1">
                            {c.puntuacion ? (<><Star className="w-3 h-3 text-amber-600 fill-amber-600" /> Calificó {c.puntuacion}/5</>) : 'Prefirió no calificar'}
                          </span>
                          {puedeCobrar && (
                            <button
                              onClick={() => cerrarMesa(c.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1 shrink-0"
                            >
                              <DoorClosed className="w-3 h-3" />
                              <span>Confirmar pago y liberar mesa</span>
                            </button>
                          )}
                        </div>
                      )}

                      {c.estado === 'ENTREGADA' && !c.cuentaSolicitada && puedeCobrar && (
                        liberando?.id === c.id ? (
                          <div className="bg-stone-100/60 border border-stone-300 rounded-xl px-3 py-2 space-y-2">
                            <p className="text-[11px] text-stone-700">Libera la mesa sin cuenta. Queda registrado en la auditoría.</p>
                            <select
                              value={liberando.motivo}
                              onChange={(e) => setLiberando({ id: c.id, motivo: e.target.value })}
                              className="w-full bg-stone-200 border border-stone-400 text-stone-900 text-xs rounded-lg px-2 py-1.5"
                            >
                              {MOTIVOS_LIBERAR.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
                            </select>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setLiberando(null)} className="px-2.5 py-1.5 bg-stone-300 hover:bg-stone-400 text-stone-900 text-xs font-semibold rounded-xl">Cancelar</button>
                              <button
                                onClick={() => { const motivo = liberando.motivo; setLiberando(null); liberarMesa(c.id, motivo); }}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                              >
                                Liberar mesa
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setLiberando({ id: c.id, motivo: MOTIVOS_LIBERAR[0] })}
                            className="text-[11px] text-stone-600 hover:text-stone-800 underline underline-offset-2 flex items-center gap-1"
                          >
                            <DoorClosed className="w-3 h-3" /> Liberar mesa sin cuenta
                          </button>
                        )
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-stone-500">Mesa disponible</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
