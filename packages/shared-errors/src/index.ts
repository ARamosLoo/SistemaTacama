// ============================================================
// Códigos de error estandarizados para TacamaMesa
// Cada servicio usa estos códigos para respuestas de error.
// ============================================================

export enum CodigoError {
  // ── Autenticación ─────────────────────────────────────────
  TOKEN_INVALIDO = 'AUTH_001',
  TOKEN_EXPIRADO = 'AUTH_002',
  CREDENCIALES_INVALIDAS = 'AUTH_003',
  SIN_PERMISOS = 'AUTH_004',
  QR_INVALIDO = 'AUTH_005',
  QR_EXPIRADO = 'AUTH_006',

  // ── Catálogo ──────────────────────────────────────────────
  PLATO_NO_ENCONTRADO = 'CAT_001',
  IDIOMA_NO_SOPORTADO = 'CAT_002',

  // ── Comandas ──────────────────────────────────────────────
  COMANDA_NO_ENCONTRADA = 'CMD_001',
  ALERGIAS_NO_DECLARADAS = 'CMD_002',  // RN01: obligatorio
  COMANDA_NO_ANULABLE = 'CMD_003',
  MESA_SIN_SESION = 'CMD_004',

  // ── Maridaje ──────────────────────────────────────────────
  SIN_RECOMENDACIONES = 'MAR_001',
  REGLA_DUPLICADA = 'MAR_002',

  // ── Inventario ────────────────────────────────────────────
  ETIQUETA_NO_ENCONTRADA = 'INV_001',
  STOCK_INSUFICIENTE = 'INV_002',
  SANDBOX_NO_DISPONIBLE = 'INV_003',

  // ── General ───────────────────────────────────────────────
  ENTIDAD_NO_ENCONTRADA = 'GEN_001',
  VALIDACION_FALLIDA = 'GEN_002',
  ERROR_INTERNO = 'GEN_500',
}

// ── Mensajes en español por defecto ──────────────────────────
export const MENSAJES_ERROR: Record<CodigoError, string> = {
  [CodigoError.TOKEN_INVALIDO]: 'El token de acceso no es válido',
  [CodigoError.TOKEN_EXPIRADO]: 'El token de acceso ha expirado',
  [CodigoError.CREDENCIALES_INVALIDAS]: 'Credenciales incorrectas',
  [CodigoError.SIN_PERMISOS]: 'No tienes permisos para realizar esta acción',
  [CodigoError.QR_INVALIDO]: 'El código QR no es válido',
  [CodigoError.QR_EXPIRADO]: 'La sesión de mesa ha expirado, escanea el QR nuevamente',
  [CodigoError.PLATO_NO_ENCONTRADO]: 'El plato solicitado no existe en la carta',
  [CodigoError.IDIOMA_NO_SOPORTADO]: 'Idioma no soportado, se usará español por defecto',
  [CodigoError.COMANDA_NO_ENCONTRADA]: 'La comanda no existe',
  [CodigoError.ALERGIAS_NO_DECLARADAS]: 'Debe declarar alergias o indicar que no tiene antes de ordenar',
  [CodigoError.COMANDA_NO_ANULABLE]: 'La comanda no puede ser anulada en su estado actual',
  [CodigoError.MESA_SIN_SESION]: 'La mesa no tiene una sesión activa',
  [CodigoError.SIN_RECOMENDACIONES]: 'No hay recomendaciones disponibles para este plato',
  [CodigoError.REGLA_DUPLICADA]: 'Ya existe una regla de maridaje para esta combinación',
  [CodigoError.ETIQUETA_NO_ENCONTRADA]: 'La etiqueta no existe en el inventario',
  [CodigoError.STOCK_INSUFICIENTE]: 'Stock insuficiente para completar el pedido',
  [CodigoError.SANDBOX_NO_DISPONIBLE]: 'El sandbox de la bodega no está disponible',
  [CodigoError.ENTIDAD_NO_ENCONTRADA]: 'El recurso solicitado no existe',
  [CodigoError.VALIDACION_FALLIDA]: 'Los datos enviados no son válidos',
  [CodigoError.ERROR_INTERNO]: 'Error interno del servidor',
};
