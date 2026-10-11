import React, { useMemo, useState } from 'react';
import { useApp, ItemServidor } from '../context/AppContext';
import { Modal } from './Modal';
import { X, Search, Check } from 'lucide-react';

/** Cambia un plato ya pedido por otro disponible (solo durante los 5 minutos posteriores a la confirmación). */
export const CambiarPlatoModal: React.FC<{ item: ItemServidor; onClose: () => void }> = ({ item, onClose }) => {
  const { platos, momento, cambiarItem, t } = useApp();
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const actual = platos.find((p) => p.id === item.platoId);
  const opciones = useMemo(
    () =>
      platos
        .filter((p) => p.disponible && p.id !== item.platoId && p.categoria !== 'BEBIDA' && p.rol !== 'COMPLEMENTO')
        .filter((p) => p.momentos.includes(momento.toUpperCase()))
        .filter((p) => !busqueda.trim() || p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
        // Primero los de la misma sección que el plato actual
        .sort((a, b) => Number(b.seccion === actual?.seccion) - Number(a.seccion === actual?.seccion) || a.nombre.localeCompare(b.nombre))
        .slice(0, 60),
    [platos, item.platoId, momento, busqueda, actual?.seccion],
  );
  const nuevo = platos.find((p) => p.id === elegido);
  const dif = nuevo ? (nuevo.precioPEN - item.precioUnit) * item.cantidad : 0;

  const confirmar = async () => {
    if (!nuevo) return;
    setEnviando(true);
    setError(null);
    try {
      await cambiarItem(item.id, nuevo);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? t('cambioError'));
      setEnviando(false);
    }
  };

  return (
    <Modal onClose={onClose} etiqueta={t('cambiarTitulo')}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CFE1A5] max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1F1F1F]">{t('cambiarTitulo')}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{item.cantidad} x {item.platoNombre}</p>
          </div>
          <button onClick={onClose} aria-label={t('tycCerrar')} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('cambiarBuscar')}
            className="w-full border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
          />
        </div>

        <ul className="overflow-y-auto py-3 space-y-1.5 flex-grow">
          {opciones.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={elegido === p.id}
                onClick={() => setElegido(p.id)}
                className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl border transition ${
                  elegido === p.id ? 'border-[#577A17] bg-[#F4F8EA]' : 'border-stone-200 hover:border-[#577A17]'
                }`}
              >
                {p.imagenUrl ? <img src={p.imagenUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-[#F4F8EA] shrink-0" />}
                <span className="flex-grow text-sm text-[#1F1F1F] leading-snug">{p.nombre}</span>
                <span className="text-xs font-bold text-[#466212] shrink-0">S/ {p.precioPEN.toFixed(2)}</span>
                {elegido === p.id && <Check className="w-4 h-4 text-[#577A17] shrink-0" />}
              </button>
            </li>
          ))}
          {opciones.length === 0 && <li className="text-sm text-stone-500 text-center py-6">{t('sinPlatosCambio')}</li>}
        </ul>

        <div className="pt-3 border-t border-stone-100 space-y-2">
          {nuevo && (
            <p className="text-xs text-stone-600 text-center">
              {t('cambiarDif', { d: (dif >= 0 ? '+' : '-') + 'S/ ' + Math.abs(dif).toFixed(2) })}
            </p>
          )}
          {error && <p role="alert" className="text-xs text-rose-700 text-center">{error}</p>}
          <button
            type="button"
            disabled={!nuevo || enviando}
            onClick={confirmar}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:bg-stone-300 transition"
          >
            {t('cambiarPor')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
