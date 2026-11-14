import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, nombreMesa } from '../lib/api';
import { ComandaCocina } from '../types';
import { ChefHat, Clock, ShieldAlert, CheckCircle, Bell, Filter } from 'lucide-react';

const BACK_A_UI: Record<string, ComandaCocina['estado']> = {
  PENDIENTE: 'CONFIRMADA', EN_PREPARACION: 'EN_PREPARACION', LISTA: 'LISTA', ENTREGADA: 'SERVIDA', ANULADA: 'ANULADA',
};
// Cocina solo prepara: la entrega en mesa (ENTREGADA) la confirma el mozo desde la pantalla de mesas.
const UI_A_BACK: Record<string, string> = { EN_PREPARACION: 'EN_PREPARACION', LISTA: 'LISTA' };

export const CocinaKdsPage: React.FC = () => {
  const [comandas, setComandas] = useState<ComandaCocina[]>([]);
  const [conectado, setConectado] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [, setTick] = useState(0);

  // Carga comandas activas + catálogos (mesas y alérgenos por plato)
  const cargar = useCallback(async () => {
    try {
      const [{ data: cmds }, { data: mesas }, { data: carta }] = await Promise.all([
        api<{ data: any[] }>('/comandas?estado=PENDIENTE,EN_PREPARACION,LISTA'),
        api<{ data: any[] }>('/mesas'),
        api<{ data: any[] }>('/carta'),
      ]);
      const mesaPorId = new Map(mesas.map((m) => [m.id, nombreMesa(m.numero)]));
      const alergenosPlato = new Map(carta.map((p) => [p.id, (p.alergenos ?? []).map((a: any) => a.nombre as string)]));
      const nombrePorCodigo = new Map<string, string>();
      carta.forEach((p) => (p.alergenos ?? []).forEach((a: any) => nombrePorCodigo.set(a.codigo, a.nombre)));

      setComandas(
        cmds.map((c) => ({
          id: c.id,
          codigo: 'CMD-' + c.id.slice(0, 4).toUpperCase(),
          mesa: mesaPorId.get(c.mesaId) ?? 'Mesa',
          mozo: c.mozoNombre ?? 'Sin asignar',
          modificadaHaceMin: c.modificadaEn ? Math.max(0, Math.round((Date.now() - new Date(c.modificadaEn).getTime()) / 60000)) : undefined,
          estado: BACK_A_UI[c.estado] ?? 'CONFIRMADA',
          minutosTranscurridos: Math.max(0, Math.round((Date.now() - new Date(c.confirmadaEn ?? c.createdAt).getTime()) / 60000)),
          alergiasMesa: [...new Set<string>(c.restricciones.flatMap((r: any) => r.alergenos as string[]))].map(
            (cod) => nombrePorCodigo.get(cod) ?? cod,
          ),
          items: c.items.map((i: any) => ({
            id: i.id,
            nombre: i.platoNombre,
            cantidad: i.cantidad,
            categoria: i.etiquetaId ? 'VINO' : 'FONDO',
            notas: i.notas ?? undefined,
            alergenos: alergenosPlato.get(i.platoId) ?? [],
          })),
          observaciones: c.observaciones ?? undefined,
          requiereAprobacionChef: !!c.conflictoAlergeno && !c.alergenoAprobadoEn,
          alergenoAprobadoPor: c.alergenoAprobadoPor ?? undefined,
        })),
      );
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Sin conexión con comandas-service');
    }
  }, []);

  useEffect(() => {
    cargar();
    // WebSocket de cocina: nuevas comandas, alertas de alérgenos y cambios de estado
    const socket = io(`${import.meta.env.VITE_SOCKET_URL ?? ''}/cocina`, { query: { rol: 'cocina' } });
    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));
    socket.on('cocina:nueva_comanda', cargar);
    socket.on('cocina:estado_cambiado', cargar);
    const minutos = setInterval(() => setTick((t) => t + 1), 60000);
    const respaldo = setInterval(cargar, 15000);
    return () => { socket.close(); clearInterval(minutos); clearInterval(respaldo); };
  }, [cargar]);

  const cambiarEstado = async (id: string, nuevoEstado: ComandaCocina['estado']) => {
    setComandas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)));
    try {
      await api(`/comandas/${id}`, { method: 'PATCH', body: { estado: UI_A_BACK[nuevoEstado] } });
    } finally {
      cargar();
    }
  };

  // RN02: el chef aprueba preparar los platos con alérgenos declarados por la mesa
  const aprobarAlergenos = async (id: string) => {
    try {
      await api(`/comandas/${id}/aprobar-alergenos`, { method: 'POST' });
    } catch (e: any) {
      setError(e.message ?? 'No se pudo aprobar');
    } finally {
      cargar();
    }
  };

  const comandasFiltradas = comandas.filter((c) => {
    if (filtroEstado === 'TODOS') return c.estado !== 'SERVIDA';
    return c.estado === filtroEstado;
  });

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-2xl border border-stone-200 shadow-md">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-tr from-[#2E4310] to-[#577A17] flex items-center justify-center text-white shadow-md">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-serif-tacama text-xl font-bold text-stone-900 flex flex-wrap items-center gap-2">
              KDS · Pantalla de Cocina en Tiempo Real
              <span className="text-xs bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                <span className={`w-2 h-2 rounded-full ${conectado ? "bg-emerald-600 animate-ping" : "bg-rose-600"}`} />
                {conectado ? "WebSocket Conectado (3004)" : "WebSocket desconectado"}
              </span>
            </h2>
            <p className="text-xs text-stone-600">
              Protocolo de seguridad alimentaria RN01 activado · Alertas de alérgenos prioritarias
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {['TODOS', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroEstado === est
                  ? 'bg-[#577A17] text-white shadow'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {est === 'TODOS' ? 'Activas' : est.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-rose-50/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-700">{error}</div>}
      {!error && comandasFiltradas.length === 0 && (
        <div className="text-center text-stone-500 text-sm py-16">No hay comandas activas. Los pedidos del comensal aparecerán aquí en tiempo real.</div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {comandasFiltradas.map((cmd) => {
          const tieneAlergias = cmd.alergiasMesa.length > 0;
          const esUrgente = cmd.minutosTranscurridos > 15;

          return (
            <div
              key={cmd.id}
              className={`bg-[#FFFFFF] rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                tieneAlergias
                  ? 'border-rose-500/80 alert-pulse-danger'
                  : esUrgente
                  ? 'border-amber-500/70'
                  : 'border-stone-200'
              }`}
            >
              {/* Order Card Header */}
              <div
                className={`p-4 flex items-center justify-between ${
                  cmd.estado === 'CONFIRMADA'
                    ? 'bg-amber-50/40 border-b border-amber-200/30'
                    : cmd.estado === 'EN_PREPARACION'
                    ? 'bg-rose-50/40 border-b border-rose-200/30'
                    : 'bg-emerald-50/40 border-b border-emerald-200/30'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-stone-900">{cmd.codigo}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        cmd.estado === 'CONFIRMADA'
                          ? 'bg-amber-500/20 text-amber-700'
                          : cmd.estado === 'EN_PREPARACION'
                          ? 'bg-rose-500/20 text-rose-700'
                          : 'bg-emerald-500/20 text-emerald-700'
                      }`}
                    >
                      {cmd.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-serif-tacama text-xs font-bold text-stone-700 mt-1">
                    {cmd.mesa}
                  </h4>
                  {cmd.modificadaHaceMin !== undefined && cmd.modificadaHaceMin <= 10 && (
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-700 border border-sky-500/40">
                      Modificada hace {cmd.modificadaHaceMin} min · revisar platos
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-md ${
                      esUrgente ? 'bg-rose-600 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{cmd.minutosTranscurridos} min</span>
                  </div>
                  <div className="text-[10px] text-stone-600 mt-1">Mozo: {cmd.mozo}</div>
                </div>
              </div>

              {/* Allergen Warning Banner on Card */}
              {tieneAlergias && (
                <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  <span>ALERGIAS: {cmd.alergiasMesa.join(', ')}</span>
                </div>
              )}

              {/* Alergias que el comensal escribió con sus palabras ("Otros"): no son códigos del catálogo, viajan en las observaciones */}
              {cmd.observaciones && cmd.observaciones.startsWith('ALERGIA') && (
                <div role="alert" className="bg-rose-700 text-white px-4 py-2 text-xs font-bold flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{cmd.observaciones}</span>
                </div>
              )}

              {/* Items List */}
              <div className="p-4 space-y-3 flex-grow divide-y divide-stone-200">
                {cmd.items.map((item) => {
                  const tieneConflictoItem = item.alergenos?.some((a) =>
                    cmd.alergiasMesa.includes(a),
                  );

                  return (
                    <div key={item.id} className="pt-2 first:pt-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <span className="w-5 h-5 rounded bg-stone-200 text-amber-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.cantidad}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-stone-800 leading-snug">
                              {item.nombre}
                            </p>
                            {item.notas && (
                              <div className="mt-1.5 flex flex-col items-start gap-1.5">
                                {/* Cada parte de la nota va en su línea; lo que el comensal pide quitar o cambiar se resalta */}
                                {item.notas.split(' | ').map((parte: string, k: number) => {
                                  // Mismos prefijos que arma la app del comensal (con dos puntos: "Sinthia" no es un pedido)
                                  const porAlergia = parte.startsWith('SIN (ALERGIA): ');
                                  const pedido = porAlergia || parte.startsWith('SIN: ') || parte.startsWith('PEDIDO: ');
                                  return (
                                    <p
                                      key={k}
                                      className={
                                        porAlergia
                                          ? 'text-[11px] font-bold text-white bg-rose-600 rounded px-1.5 py-0.5 inline-block'
                                          : pedido
                                            ? 'text-[11px] font-bold text-amber-50 bg-amber-600 rounded px-1.5 py-0.5 inline-block'
                                            : 'text-[11px] text-rose-700 font-semibold'
                                      }
                                    >
                                      {parte}
                                    </p>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-600 font-medium">
                          {item.categoria}
                        </span>
                      </div>

                      {item.alergenos && item.alergenos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-7">
                          {item.alergenos.map((a) => (
                            <span
                              key={a}
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                cmd.alergiasMesa.includes(a)
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-stone-100/60 border-t border-stone-200 flex space-x-2">
                {cmd.estado === 'CONFIRMADA' && cmd.requiereAprobacionChef && (
                  <button
                    onClick={() => aprobarAlergenos(cmd.id)}
                    className="flex-1 py-2 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-1 transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Aprobar platos con alérgenos (chef)</span>
                  </button>
                )}

                {cmd.estado === 'CONFIRMADA' && !cmd.requiereAprobacionChef && (
                  <button
                    onClick={() => cambiarEstado(cmd.id, 'EN_PREPARACION')}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-1 transition"
                  >
                    <span>Iniciar Preparación</span>
                  </button>
                )}

                {cmd.estado === 'EN_PREPARACION' && (
                  <button
                    onClick={() => cambiarEstado(cmd.id, 'LISTA')}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-1 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Marcar Listo</span>
                  </button>
                )}

                {cmd.estado === 'LISTA' && (
                  <div className="flex-1 py-2 bg-stone-200/70 text-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lista · el mozo la lleva a la mesa</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
