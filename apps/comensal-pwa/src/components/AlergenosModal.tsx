import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { ALERGENOS_NOMBRE } from '../lib/i18n';
import { ShieldAlert, X, Check, AlertCircle } from 'lucide-react';

export const AlergenosModal: React.FC = () => {
  const {
    alergiasDeclaradas,
    setAlergiasDeclaradas,
    modalAlergenosAbierto,
    setModalAlergenosAbierto,
    nombreAlergeno,
    perfil,
    comensales,
    activoIdx,
    seleccionarComensal,
    nombreComensal,
    t,
  } = useApp();
  const ALERGENOS_DISPONIBLES = Object.keys(ALERGENOS_NOMBRE).filter((c) => !(perfil?.esNino && c === 'SULFITOS')); // a los niños no se les ofrece vino
  const varios = comensales.length > 1;

  const [seleccionadas, setSeleccionadas] = useState<string[]>(alergiasDeclaradas);

  // Cada vez que se abre la ventana, o cambia el comensal activo, se cargan SUS alergias:
  // el estado local no debe arrastrar la selección de otro comensal.
  useEffect(() => {
    if (modalAlergenosAbierto) setSeleccionadas(alergiasDeclaradas);
  }, [modalAlergenosAbierto, activoIdx]);

  if (!modalAlergenosAbierto) return null;

  const toggleAlergeno = (item: string) => {
    setSeleccionadas((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const cambiarComensal = (idx: number) => {
    if (idx === activoIdx) return;
    setAlergiasDeclaradas(seleccionadas);
    seleccionarComensal(idx);
  };

  const handleGuardar = () => {
    setAlergiasDeclaradas(seleccionadas);
    setModalAlergenosAbierto(false);
  };

  return (
    <Modal onClose={() => setModalAlergenosAbierto(false)} etiqueta={t('alTitulo')}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif-tacama text-lg font-bold text-stone-900">
                {t('alTitulo')}
              </h3>
              <p className="text-xs text-stone-500">
                {varios && comensales[activoIdx] ? t('alDe', { n: nombreComensal(comensales[activoIdx]) }) : t('alSub')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAlergenosAbierto(false)}
            aria-label={t('cerrar')}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning banner */}
        <div className="my-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>
            {t('alAviso')}
          </span>
        </div>

        {/* Comensal cuyas alergias se editan */}
        {varios && (
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={t('pidiendoPara')}>
            {comensales.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={i === activoIdx}
                onClick={() => cambiarComensal(i)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  i === activoIdx ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]' : 'bg-white text-stone-700 border-stone-300 hover:border-[#1F1F1F]'
                }`}
              >
                {nombreComensal(c)}
                {(i === activoIdx ? seleccionadas.length : c.alergias.length) > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${i === activoIdx ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'}`}>
                    {i === activoIdx ? seleccionadas.length : c.alergias.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* List of allergens */}
        <div className="grid grid-cols-2 gap-2.5 overflow-y-auto py-2 flex-grow pr-1">
          {ALERGENOS_DISPONIBLES.map((alergeno) => {
            const isSelected = seleccionadas.includes(alergeno);
            return (
              <button
                key={alergeno}
                type="button"
                onClick={() => toggleAlergeno(alergeno)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold shadow-sm'
                    : 'bg-stone-50/70 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="text-xs">{nombreAlergeno(alergeno)}</span>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-rose-600 text-white' : 'border border-stone-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSeleccionadas([])}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium underline"
          >
            {t('limpiar')}
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setModalAlergenosAbierto(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition"
            >
              {t('cancelar')}
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="px-5 py-2 text-xs font-semibold bg-[#577A17] text-white rounded-xl shadow-md hover:bg-[#466212] transition"
            >
              {t('guardar')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
