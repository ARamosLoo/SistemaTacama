import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { IndicadorDashboard } from '../types';
import { TrendingUp, Star, Wine, Receipt, ShieldCheck, Clock, FileText } from 'lucide-react';

export const AnaliticaKpiPage: React.FC = () => {
  const [indicadores, setIndicadores] = useState<IndicadorDashboard>({
    tasaVentaCruzada: 0, totalComandas: 0, comandasAnuladas: 0, ventaTotalPEN: 0,
    ticketPromedioPEN: 0, csatPromedio: 0, totalValoraciones: 0,
  });
  const [logsAuditoria, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [k, vc, cs, au] = await Promise.all([
        api<any>('/indicadores/kpis'),
        api<any>('/indicadores/venta-cruzada'),
        api<any>('/indicadores/csat'),
        api<any>('/auditoria?limit=15'),
      ]);
      setIndicadores({
        tasaVentaCruzada: Number(k.tasaMaridajePorcentaje ?? vc.tasaConversionPorcentaje ?? 0),
        totalComandas: k.totalComandas,
        comandasAnuladas: k.comandasAnuladas,
        ventaTotalPEN: k.ventaTotalPEN,
        ticketPromedioPEN: k.ticketPromedioPEN,
        csatPromedio: cs.csatPromedio,
        totalValoraciones: cs.totalValoraciones,
      });
      setLogs(
        (au.data ?? []).map((l: any) => ({
          id: l.id,
          timestamp: new Date(l.timestamp).toLocaleTimeString('es-PE'),
          entidad: l.entidad,
          entidadId: l.entidadId ? String(l.entidadId).slice(0, 8) : '—',
          accion: l.accion,
          usuario: l.usuarioId ?? (l.mesaId ? 'Comensal (mesa)' : 'sistema'),
          servicio: l.servicio,
          categoria: l.categoria,
        })),
      );
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Sin conexión con analitica-auditoria-service');
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, [cargar]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1D23] p-5 rounded-2xl border border-stone-800 shadow-md">
        <div>
          <h2 className="font-serif-tacama text-xl font-bold text-stone-100 flex items-center gap-2">
            Panel de Analítica Empresarial & KPIs (TOGAF ADM)
          </h2>
          <p className="text-xs text-stone-400">
            Medición de impacto del maridaje digital, satisfacción del comensal y auditoría inmutable (RN11).
          </p>
        </div>
      </div>

      {error && <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Venta Cruzada */}
        <div className="bg-[#22262F] rounded-2xl p-5 border border-amber-900/40 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Venta Cruzada Maridaje</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wine className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-serif-tacama">
            {indicadores.tasaVentaCruzada}%
          </div>
          <p className="text-[11px] text-stone-400">
            Comensales que agregaron vino/pisco sugerido por el sommelier digital.
          </p>
        </div>

        {/* Satisfacción CSAT */}
        <div className="bg-[#22262F] rounded-2xl p-5 border border-emerald-900/40 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Satisfacción (CSAT)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-serif-tacama">
            {indicadores.csatPromedio} / 5.0
          </div>
          <p className="text-[11px] text-stone-400">
            Basado en {indicadores.totalValoraciones} encuestas completadas hoy.
          </p>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-[#22262F] rounded-2xl p-5 border border-stone-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-serif-tacama">
            S/ {indicadores.ticketPromedioPEN.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-400">
            Venta total del turno: S/ {indicadores.ventaTotalPEN.toLocaleString('es-PE')}
          </p>
        </div>

        {/* Eficiencia de Cocina */}
        <div className="bg-[#22262F] rounded-2xl p-5 border border-stone-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400">Tasa de Anulación</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-100 font-serif-tacama">
            {(indicadores.totalComandas ? (indicadores.comandasAnuladas / indicadores.totalComandas) * 100 : 0).toFixed(1)}%
          </div>
          <p className="text-[11px] text-stone-400">
            {indicadores.comandasAnuladas} de {indicadores.totalComandas} comandas atendidas.
          </p>
        </div>
      </div>

      {/* Audit Log Table (Inmutable RF22) */}
      <div className="bg-[#22262F] rounded-2xl border border-stone-800 overflow-hidden shadow-lg space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif-tacama text-base font-bold text-stone-100">
              Log de Auditoría Inmutable (RF22 · RN11)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">Retención legal: 12 meses</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 text-stone-400 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-800">
              <tr>
                <th className="p-3">Hora</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">ID</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Usuario / Agente</th>
                <th className="p-3">Microservicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 font-mono text-[11px]">
              {logsAuditoria.map((log) => (
                <tr key={log.id} className="hover:bg-stone-800/40 transition">
                  <td className="p-3 text-stone-400">{log.timestamp}</td>
                  <td className="p-3 font-semibold text-stone-200">{log.entidad}</td>
                  <td className="p-3 text-amber-300">{log.entidadId}</td>
                  <td className="p-3 font-bold text-stone-100">{log.accion}</td>
                  <td className="p-3">
                    <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-[10px]">
                      {log.categoria}
                    </span>
                  </td>
                  <td className="p-3 text-stone-400">{log.usuario}</td>
                  <td className="p-3 text-stone-500">{log.servicio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
