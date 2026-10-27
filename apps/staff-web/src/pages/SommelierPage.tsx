import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { ReglaMaridaje } from '../types';
import { Wine, Sparkles, Plus, Check, RefreshCw, BookOpen } from 'lucide-react';

export const SommelierPage: React.FC = () => {
  const [reglas, setReglas] = useState<ReglaMaridaje[]>([]);
  const [platosCarta, setPlatosCarta] = useState<{ codigo: string; nombre: string }[]>([]);
  const [etiquetasCat, setEtiquetasCat] = useState<{ id: string; nombre: string; linea: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalNuevo, setModalNuevo] = useState<boolean>(false);
  const [nuevoPlato, setNuevoPlato] = useState<string>('');
  const [nuevoVino, setNuevoVino] = useState<string>('');
  const [nuevaExplicacion, setNuevaExplicacion] = useState<string>('');
  const [afinidad, setAfinidad] = useState<number>(95);

  const cargar = useCallback(async () => {
    try {
      const [{ data: rg }, { data: carta }, { data: etq }] = await Promise.all([
        api<{ data: any[] }>('/reglas-maridaje'),
        api<{ data: any[] }>('/carta'),
        api<{ data: any[] }>('/etiquetas'),
      ]);
      const plato = new Map<string, string>(carta.map((p) => [p.codigoInterno as string, p.nombre as string]));
      setPlatosCarta(carta.map((p) => ({ codigo: p.codigoInterno, nombre: p.nombre })));
      const lineaPorId = new Map<string, string>(etq.map((e) => [e.id as string, (e.cepa ?? e.tipo) as string]));
      setEtiquetasCat(etq.map((e) => ({ id: e.id, nombre: e.nombre, linea: e.cepa ?? e.tipo })));
      setNuevoPlato((v) => v || carta[0]?.codigoInterno || '');
      setNuevoVino((v) => v || etq[0]?.id || '');
      setReglas(
        rg.map((r) => ({
          id: r.id,
          platoId: r.platoId,
          platoNombre: plato.get(r.platoId) ?? r.platoId,
          etiquetaId: r.etiquetaId,
          etiquetaNombre: r.etiqueta?.nombre ?? r.etiquetaId,
          linea: lineaPorId.get(r.etiquetaId) ?? r.etiqueta?.tipo ?? '',
          afinidad: r.puntaje * 10,
          explicacion: r.motivo ?? '',
          creadoPor: r.creadaPor ?? 'Sommelier Tacama',
        })),
      );
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Sin conexión con maridaje-service');
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrearRegla = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/reglas-maridaje', {
        method: 'POST',
        body: { platoId: nuevoPlato, etiquetaId: nuevoVino, puntaje: Math.round(afinidad / 10), motivo: nuevaExplicacion },
      });
      setModalNuevo(false);
      setNuevaExplicacion('');
      setError(null);
      await cargar();
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear la regla');
      setModalNuevo(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      {error && <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300">{error}</div>}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1A1D23] p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#577A17] to-[#8FB339] flex items-center justify-center text-white shadow-md">
            <Wine className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-serif-tacama text-xl font-bold text-stone-100 flex items-center gap-2">
              Gestión de Reglas de Maridaje (Sommelier)
            </h2>
            <p className="text-xs text-stone-400">
              Administración de afinidad enológica, notas de cata y recomendaciones para el comensal.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNuevo(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Regla Enológica</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-[#22262F] rounded-2xl border border-stone-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 text-stone-400 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-800">
              <tr>
                <th className="p-4">Plato Criollo</th>
                <th className="p-4">Etiqueta Tacama</th>
                <th className="p-4">Línea</th>
                <th className="p-4 text-center">Afinidad</th>
                <th className="p-4">Fundamentación del Sommelier</th>
                <th className="p-4">Autor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {reglas.map((reg) => (
                <tr key={reg.id} className="hover:bg-stone-800/40 transition">
                  <td className="p-4 font-bold text-stone-100">{reg.platoNombre}</td>
                  <td className="p-4 font-semibold text-amber-300">{reg.etiquetaNombre}</td>
                  <td className="p-4 text-stone-400">{reg.linea}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center space-x-1 bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{reg.afinidad}%</span>
                    </span>
                  </td>
                  <td className="p-4 text-stone-300 italic max-w-md">
                    "{reg.explicacion}"
                  </td>
                  <td className="p-4 text-stone-400 text-[11px]">{reg.creadoPor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Regla */}
      {modalNuevo && (
        <Modal onClose={() => setModalNuevo(false)} etiqueta="Crear nueva regla de maridaje">
          <div className="bg-[#1A1D23] rounded-3xl max-w-lg w-full p-6 border border-stone-800 shadow-2xl space-y-4">
            <h3 className="font-serif-tacama text-lg font-bold text-stone-100">
              Crear Nueva Regla de Maridaje
            </h3>

            <form onSubmit={handleCrearRegla} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 font-semibold block mb-1">Plato de la Carta</label>
                <select value={nuevoPlato} onChange={(e) => setNuevoPlato(e.target.value)} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500" required>
                  {platosCarta.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">Etiqueta o Pisco Tacama</label>
                <select value={nuevoVino} onChange={(e) => setNuevoVino(e.target.value)} className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500" required>
                  {etiquetasCat.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">Porcentaje de Afinidad ({afinidad}%)</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={afinidad}
                  onChange={(e) => setAfinidad(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">Nota de Maridaje / Fundamentación Enológica</label>
                <textarea
                  rows={3}
                  value={nuevaExplicacion}
                  onChange={(e) => setNuevaExplicacion(e.target.value)}
                  placeholder="Explique el balance de taninos, acidez o aromas..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-bold rounded-xl shadow"
                >
                  Guardar Regla (Invalida Caché Redis)
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
