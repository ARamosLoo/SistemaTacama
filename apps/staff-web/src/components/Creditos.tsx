import React from 'react';

/** Derechos de autor y aviso de proyecto académico (UTP). */
export const Creditos: React.FC<{ oscuro?: boolean; className?: string }> = ({ oscuro = false, className = '' }) => (
  <p className={`text-[10px] leading-relaxed text-center max-w-2xl mx-auto px-4 ${oscuro ? 'text-stone-500' : 'text-stone-500'} ${className}`}>
    © 2026 Proyecto académico desarrollado por estudiantes de la Universidad Tecnológica del Perú (UTP), en un entorno académico. Todos los derechos de autor reservados.
    Sin fines comerciales: la marca, la carta y las imágenes de El Tambo de Tacama pertenecen a sus titulares y se usan solo con fines académicos. Este sistema no es un producto oficial del restaurante.
  </p>
);
