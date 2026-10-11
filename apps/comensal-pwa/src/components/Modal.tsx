import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  onClose: () => void;
  /** Texto accesible del diálogo */
  etiqueta: string;
  children: React.ReactNode;
}

/**
 * Ventana emergente modal:
 * - se renderiza en document.body (centrada en la pantalla, sin importar el scroll ni los
 *   contenedores con transform que rompen position: fixed);
 * - bloquea el scroll y la interacción con el resto de la página hasta cerrarse;
 * - se cierra con Escape o al tocar el fondo; devuelve el foco al elemento que la abrió.
 */
export const Modal: React.FC<ModalProps> = ({ onClose, etiqueta, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef(onClose);
  cerrarRef.current = onClose;

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const raiz = document.getElementById('root');

    // Bloquea scroll del fondo sin que la página "salte" por la barra de desplazamiento
    const anchoBarra = window.innerWidth - document.documentElement.clientWidth;
    const overflowPrevio = document.body.style.overflow;
    const paddingPrevio = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (anchoBarra > 0) document.body.style.paddingRight = `${anchoBarra}px`;

    // Bloquea clics, teclado y lectores de pantalla sobre el resto de la página
    raiz?.setAttribute('inert', '');
    raiz?.setAttribute('aria-hidden', 'true');

    dialogRef.current?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cerrarRef.current();
        return;
      }
      // Mantiene el foco dentro de la ventana
      if (e.key === 'Tab' && dialogRef.current) {
        const foco = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (foco.length === 0) return;
        const primero = foco[0];
        const ultimo = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', alTeclear);

    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
      document.body.style.paddingRight = paddingPrevio;
      raiz?.removeAttribute('inert');
      raiz?.removeAttribute('aria-hidden');
      previo?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        tabIndex={-1}
        className="outline-none w-full flex items-center justify-center"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
