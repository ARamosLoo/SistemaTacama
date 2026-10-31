import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Plato, EtiquetaTacama, ItemCarrito, MaridajeRecomendacion, EstadoComanda, Alergeno, PerfilComensal, Momento, Comensal,
} from '../types';
import { api } from '../lib/api';
import { mensajeStock } from '../lib/stock';
import { VERSION_TERMINOS } from '../lib/legal';
import { recomendarPlatos, armarMenuRecomendado, armarMenuPopular, PlatoRecomendado, MenuRecomendado } from '../lib/recomendar';
import { notaSin } from '../lib/ingredientes';
import { texto, ClaveTexto, Idioma, detectarIdioma, ALERGENOS_NOMBRE } from '../lib/i18n';

interface AppContextType {
  mesa: string;
  idioma: Idioma;
  setIdioma: (idioma: Idioma) => void;
  alergiasDeclaradas: string[]; // alergias del comensal activo
  setAlergiasDeclaradas: (alergias: string[]) => void;
  comensales: Comensal[];
  activoIdx: number;
  mesaConfigurada: boolean;
  iniciarMesa: (cantidad: number) => void;
  seleccionarComensal: (idx: number) => void;
  avanzarComensal: () => void;
  retrocederComensal: () => void;
  terminosAceptados: boolean;
  aceptarTerminos: () => void;
  aviso: string | null;
  cambiarTamanoGrupo: (cantidad: number) => void;
  reiniciarMesa: () => void;
  terminarConfiguracion: () => void;
  renombrarComensal: (idx: number, nombre: string) => void;
  nombreComensal: (c: Comensal) => string;
  reasignarItem: (lineaId: string, comensalId: string) => void;
  alergenosCatalogo: Alergeno[];
  momento: Momento;
  setMomento: (m: Momento) => void;
  perfil: PerfilComensal | null;
  guardarPerfil: (p: PerfilComensal | null) => void;
  recomendados: PlatoRecomendado[];
  menuRecomendado: MenuRecomendado | null;
  mostrarRecomendacion: boolean;
  setMostrarRecomendacion: (v: boolean) => void;
  t: (clave: ClaveTexto, vars?: Record<string, string | number>) => string;
  nombreAlergeno: (codigo: string) => string;
  modalAlergenosAbierto: boolean;
  setModalAlergenosAbierto: (abierto: boolean) => void;
  platos: Plato[];
  etiquetas: EtiquetaTacama[];
  cargandoCarta: boolean;
  errorCarta: string | null;
  carrito: ItemCarrito[];
  agregarAlCarrito: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void;
  eliminarDelCarrito: (id: string) => void;
  /** Cambia los ingredientes que el comensal no desea en una línea del carrito */
  actualizarIngredientes: (lineaId: string, sin: string[]) => void;
  actualizarCantidad: (id: string, delta: number) => void;
  limpiarCarrito: () => void;
  totalPEN: number;
  comandaActivaId: string | null;
  estadoComanda: EstadoComanda | null;
  confirmarComanda: () => Promise<void>;
  obtenerMaridajes: (plato: Plato) => Promise<MaridajeRecomendacion[]>;
  csatEnviado: boolean;
  enviarCsat: (puntuacion: number, comentario: string) => Promise<void>;
  /** Pedido tal como lo registró el servidor (con ids de ítem y hora límite para cambios) */
  comandaServidor: ComandaServidor | null;
  anularItem: (itemId: string) => Promise<void>;
  cambiarItem: (itemId: string, plato: Plato) => Promise<void>;
  /** true si el ítem del carrito corresponde a un plato o etiqueta que ya se agotó */
  itemAgotado: (item: ItemCarrito) => boolean;
  /** Aviso dinámico de stock de una etiqueta ("¡Últimas 3 botellas!"), o null */
  avisoStock: (codigoEtiqueta: string) => string | null;
  cuenta: { solicitada: boolean; metodoPago: string | null };
  solicitarCuenta: (omitirCalificacion: boolean, metodoPago: string, efectivoPagaCon?: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mapa categoría del backend → categoría de la UI
const CATEGORIA: Record<string, Plato['categoria']> = {
  ENTRADA: 'ENTRADA', PRINCIPAL: 'FONDO', FONDO: 'FONDO', POSTRE: 'POSTRE', BEBIDA: 'BEBIDA',
};

const esPisco = (tipo: string) => tipo.startsWith('PISCO');
// La carta no define precio por copa; se estima en un cuarto de botella para vinos
const precioCopa = (tipo: string, botella: number) => (esPisco(tipo) ? undefined : Math.round(botella / 4));

const ESTADO_UI: Record<string, EstadoComanda> = {
  BORRADOR: 'CREADA', PENDIENTE: 'CONFIRMADA', EN_PREPARACION: 'EN_PREPARACION',
  LISTA: 'LISTA', ENTREGADA: 'SERVIDA', CERRADA: 'CERRADA', ANULADA: 'ANULADA',
};

export interface ItemServidor {
  id: string;
  platoId: string;
  platoNombre: string;
  cantidad: number;
  precioUnit: number;
  etiquetaId?: string | null;
  notas?: string | null;
}
export interface ComandaServidor {
  items: ItemServidor[];
  /** Hora límite (ms) para cambiar o anular platos, ya corregida con el reloj del servidor */
  ventanaHasta: number | null;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // El QR de la mesa llega por URL (?mesa=QR-MESA-004); por defecto la mesa 4
  const qr = new URLSearchParams(window.location.search).get('mesa') ?? 'QR-MESA-004';

  // 'mesa' se calcula con el idioma activo: número de mesa o estado de conexión
  const [mesaNumero, setMesaNumero] = useState<number | null>(null);
  const [mesaEstado, setMesaEstado] = useState<'conectando' | 'ok' | 'error'>('conectando');
  const [mesaId, setMesaId] = useState<string | null>(null);
  const [tokenMesa, setTokenMesa] = useState<string | null>(null);
  // Idioma detectado desde la configuración del dispositivo; se actualiza si el usuario la cambia
  const [idioma, setIdioma] = useState<Idioma>(detectarIdioma);
  useEffect(() => {
    const alCambiar = () => setIdioma(detectarIdioma());
    window.addEventListener('languagechange', alCambiar);
    return () => window.removeEventListener('languagechange', alCambiar);
  }, []);
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);
  // Momento del día: antes de las 11:00 se propone desayuno, luego almuerzo; el comensal puede cambiarlo
  const [momento, setMomentoEstado] = useState<Momento>(() => {
    try {
      const g = sessionStorage.getItem('tacama.momento');
      if (g === 'desayuno' || g === 'almuerzo') return g;
    } catch { /* sin almacenamiento */ }
    return new Date().getHours() < 11 ? 'desayuno' : 'almuerzo';
  });
  const setMomento = (m: Momento) => {
    setMomentoEstado(m);
    try { sessionStorage.setItem('tacama.momento', m); } catch { /* sin almacenamiento */ }
  };
  // ── Comensales de la mesa: un solo celular puede pedir por varias personas, cada una con su perfil ──
  type Grupo = { comensales: Comensal[]; activoIdx: number; configurada: boolean };
  const [grupo, setGrupo] = useState<Grupo>(() => {
    try {
      const g = sessionStorage.getItem('tacama.mesa');
      if (g) return JSON.parse(g) as Grupo;
    } catch { /* sin almacenamiento */ }
    return { comensales: [], activoIdx: 0, configurada: false };
  });
  const actualizarGrupo = (fn: (g: Grupo) => Grupo) =>
    setGrupo((prev) => {
      const nuevo = fn(prev);
      try { sessionStorage.setItem('tacama.mesa', JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
      return nuevo;
    });
  const comensales = grupo.comensales;
  const activoIdx = Math.min(grupo.activoIdx, Math.max(comensales.length - 1, 0));
  const activo: Comensal | undefined = comensales[activoIdx];
  const perfil: PerfilComensal | null = activo?.perfil ?? null;
  const alergiasDeclaradas: string[] = activo?.alergias ?? [];
  const mesaConfigurada = grupo.configurada;

  const modificarActivo = (fn: (c: Comensal) => Comensal) =>
    actualizarGrupo((g) => ({ ...g, comensales: g.comensales.map((c, i) => (i === Math.min(g.activoIdx, g.comensales.length - 1) ? fn(c) : c)) }));
  const guardarPerfil = (p: PerfilComensal | null) => modificarActivo((c) => ({ ...c, perfil: p }));
  const setAlergiasDeclaradas = (alergias: string[]) => modificarActivo((c) => ({ ...c, alergias }));
  const iniciarMesa = (cantidad: number) =>
    actualizarGrupo(() => ({
      comensales: Array.from({ length: cantidad }, (_, i) => ({ id: 'c' + (i + 1), nombre: '', perfil: null, alergias: [] })),
      activoIdx: 0,
      configurada: false,
    }));
  const seleccionarComensal = (idx: number) => actualizarGrupo((g) => ({ ...g, activoIdx: idx }));
  const avanzarComensal = () => actualizarGrupo((g) => ({ ...g, activoIdx: Math.min(g.activoIdx + 1, g.comensales.length - 1) }));
  const retrocederComensal = () => actualizarGrupo((g) => ({ ...g, activoIdx: Math.max(g.activoIdx - 1, 0) }));
  // Cambia el tamaño del grupo conservando los perfiles existentes. Si crece, los nuevos comensales se
  // configuran a continuación; si se reduce, lo pedido por quienes se quitan pasa al primer comensal.
  const cambiarTamanoGrupo = (cantidad: number) => {
    const actual = grupo.comensales;
    if (cantidad === actual.length || cantidad < 1) return;
    if (cantidad > actual.length) {
      let sig = Math.max(0, ...actual.map((c) => Number(c.id.slice(1)) || 0)) + 1;
      const nuevos: Comensal[] = Array.from({ length: cantidad - actual.length }, () => ({ id: 'c' + sig++, nombre: '', perfil: null, alergias: [] }));
      actualizarGrupo((g) => ({ comensales: [...g.comensales, ...nuevos], activoIdx: g.comensales.length, configurada: false }));
      return;
    }
    const quitados = new Set(actual.slice(cantidad).map((c) => c.id));
    const destino = actual[0].id;
    setCarrito((prev) => {
      const out: ItemCarrito[] = [];
      for (const i of prev) {
        const it = quitados.has(i.comensalId ?? '') ? { ...i, comensalId: destino, lineaId: i.id + '::' + destino } : i;
        const dup = out.findIndex((o) => clave(o) === clave(it));
        if (dup >= 0) out[dup] = { ...out[dup], cantidad: out[dup].cantidad + it.cantidad };
        else out.push(it);
      }
      return out;
    });
    actualizarGrupo((g) => ({ ...g, comensales: g.comensales.slice(0, cantidad), activoIdx: Math.min(g.activoIdx, cantidad - 1) }));
  };
  const reiniciarMesa = () => actualizarGrupo(() => ({ comensales: [], activoIdx: 0, configurada: false }));
  const terminarConfiguracion = () => actualizarGrupo((g) => ({ ...g, configurada: true }));
  const renombrarComensal = (idx: number, nombre: string) =>
    actualizarGrupo((g) => ({ ...g, comensales: g.comensales.map((c, i) => (i === idx ? { ...c, nombre } : c)) }));
  // Aceptación de términos y datos: solo vale para esta visita (sessionStorage), no se guarda en servidor
  const [terminosAceptados, setTerminosAceptados] = useState<boolean>(() => {
    try {
      // Solo vale la aceptación de la versión vigente de los términos
      const g = sessionStorage.getItem('tacama.terminos');
      return g === '1' || (!!g && JSON.parse(g).v === VERSION_TERMINOS);
    } catch { return false; }
  });
  const aceptarTerminos = () => {
    setTerminosAceptados(true);
    try { sessionStorage.setItem('tacama.terminos', JSON.stringify({ v: VERSION_TERMINOS, ts: new Date().toISOString(), salud: true })); } catch { /* sin almacenamiento */ }
  };
  // Aviso breve al agregar un plato a la comanda
  const [aviso, setAviso] = useState<string | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrarAviso = (msg: string) => {
    setAviso(msg);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 2200);
  };
  const [mostrarRecomendacion, setMostrarRecomendacion] = useState<boolean>(false);
  const [alergenosCatalogo, setAlergenosCatalogo] = useState<Alergeno[]>([]);
  const [modalAlergenosAbierto, setModalAlergenosAbierto] = useState<boolean>(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [comandaActivaId, setComandaActivaId] = useState<string | null>(null);
  const [estadoComanda, setEstadoComanda] = useState<EstadoComanda | null>(null);
  const [csatEnviado, setCsatEnviado] = useState<boolean>(false);
  const [comandaServidor, setComandaServidor] = useState<ComandaServidor | null>(null);
  const sincronizarRef = useRef<() => Promise<void>>(async () => undefined);
  const [cuenta, setCuenta] = useState<{ solicitada: boolean; metodoPago: string | null }>({ solicitada: false, metodoPago: null });
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaTacama[]>([]);
  const [cargandoCarta, setCargandoCarta] = useState<boolean>(true);
  const [errorCarta, setErrorCarta] = useState<string | null>(null);
  const comandaRef = useRef<string | null>(null);

  // ── Sesión de mesa por QR ───────────────────────────────────
  useEffect(() => {
    let activo = true;
    const abrir = (intento: number) =>
      api<{ tokenMesa: string; mesaId: string; numeroMesa: number }>(`/mesas/${qr}/sesion`)
        .then((s) => {
          if (!activo) return;
          setTokenMesa(s.tokenMesa);
          setMesaId(s.mesaId);
          setMesaNumero(s.numeroMesa);
          setMesaEstado('ok');
        })
        .catch(() => {
          if (!activo) return;
          if (intento < 5) setTimeout(() => abrir(intento + 1), 2000);
          else setMesaEstado('error');
        });
    abrir(1);
    return () => { activo = false; };
  }, [qr]);

  // ── Carta localizada (RF02: Accept-Language). Se vuelve a leer cada 45 s: lo que administración marca como agotado se actualiza solo ──
  const cargarCarta = useCallback(async (): Promise<Plato[]> => {
    const { data } = await api<{ data: any[] }>('/carta', { idioma });
    const catalogo = new Map<string, Alergeno>();
    const lista = data.map((p) => {
      (p.alergenos ?? []).forEach((a: any) => catalogo.set(a.codigo, { codigo: a.codigo, nombre: a.nombre }));
      return {
        id: p.id,
        codigo: p.codigoInterno,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precioPEN: Number(p.precioBase),
        categoria: CATEGORIA[p.categoria] ?? 'FONDO',
        imagenUrl: p.imagenUrl ?? undefined,
        alergenos: (p.alergenos ?? []).map((a: any) => ({ codigo: a.codigo, nombre: a.nombre })),
        disponible: p.disponible,
        seccion: p.seccion ?? 'ESPECIALIDADES',
        esVegetariano: !!p.esVegetariano,
        libreLactosa: !!p.libreLactosa,
        picante: p.picante ?? 0,
        estilo: p.estilo ?? null,
        tags: p.tags ?? [],
        maridajeTexto: p.maridajeTexto ?? null,
        rol: p.rol ?? 'FONDO',
        momentos: p.momentos?.length ? p.momentos : ['ALMUERZO'],
      } as Plato;
    });
    setPlatos(lista);
    setAlergenosCatalogo((prev) => {
      const m = new Map(prev.map((a) => [a.codigo, a]));
      catalogo.forEach((v, k) => m.set(k, v));
      return [...m.values()];
    });
    setErrorCarta(null);
    return lista;
  }, [idioma]);

  useEffect(() => {
    setCargandoCarta(true);
    cargarCarta()
      .catch((e) => setErrorCarta(e.message ?? 'No se pudo cargar la carta'))
      .finally(() => setCargandoCarta(false));
    const timer = setInterval(() => { cargarCarta().catch(() => undefined); }, 45000);
    return () => clearInterval(timer);
  }, [cargarCarta]);

  // ── Catálogo de etiquetas + stock en tiempo real ────────────
  const cargarEtiquetas = useCallback(async () => {
    try {
      const [{ data: etq }, { data: stock }] = await Promise.all([
        api<{ data: any[] }>('/etiquetas'),
        api<{ data: any[] }>('/existencias/todas'),
      ]);
      const stockPorSku = new Map<string, any>(stock.map((s) => [s.sku, s]));
      const lista: EtiquetaTacama[] = etq.map((e) => {
        const st = stockPorSku.get(e.codigoInterno);
        const agotado = !st || !!st.agotado || st.stockActual <= 0;
        return {
          id: e.codigoInterno,
          nombre: e.nombre,
          linea: e.cepa ?? '',
          tipo: e.tipo,
          precioBotellaPEN: Number(e.precioLista),
          precioCopaPEN: precioCopa(e.tipo, Number(e.precioLista)),
          // Una etiqueta agotada desde administración no se ofrece aunque quede stock físico
          stockActual: agotado ? 0 : st.stockActual,
          agotado,
          nivel: st?.nivel ?? 'AGOTADO',
          minutosRestantes: st?.minutosRestantes ?? null,
          notaCata: e.notasDegust ?? e.descripcionEs,
          maridajeSugerido: e.maridajeGeneral ?? '',
        };
      });
      setEtiquetas(lista);
      return lista;
    } catch {
      /* la carta de platos sigue operativa aunque falle la bodega */
      return [] as EtiquetaTacama[];
    }
  }, []);
  useEffect(() => {
    cargarEtiquetas();
    const timer = setInterval(cargarEtiquetas, 30000);
    return () => clearInterval(timer);
  }, [cargarEtiquetas]);

  // ── Estado de la comanda en tiempo real (WebSocket + sondeo de respaldo) ──
  useEffect(() => {
    const socket: Socket = io('/cocina', { query: { rol: 'comensal' } });
    // Lee la comanda: estado, si pidió la cuenta y si ya calificó
    const sincronizar = async () => {
      if (!comandaRef.current) return;
      try {
        const { data } = await api<{ data: { estado: string; cuentaSolicitadaEn?: string | null; valoracion?: unknown; metodoPago?: string | null; items?: any[]; ventanaCambioHasta?: string | null; ahoraServidor?: string } }>(`/comandas/${comandaRef.current}`);
        setEstadoComanda(ESTADO_UI[data.estado] ?? null);
        setCuenta({ solicitada: !!data.cuentaSolicitadaEn, metodoPago: data.metodoPago ?? null });
        if (data.valoracion) setCsatEnviado(true);
        // Reloj del servidor: la hora límite de cambios no depende de la hora del celular
        const desfase = data.ahoraServidor ? Date.parse(data.ahoraServidor) - Date.now() : 0;
        setComandaServidor({
          items: (data.items ?? []).map((i: any) => ({
            id: i.id, platoId: i.platoId, platoNombre: i.platoNombre, cantidad: i.cantidad,
            precioUnit: Number(i.precioUnit), etiquetaId: i.etiquetaId, notas: i.notas,
          })),
          ventanaHasta: data.ventanaCambioHasta ? Date.parse(data.ventanaCambioHasta) - desfase : null,
        });
      } catch { /* reintenta en el próximo ciclo */ }
    };
    sincronizarRef.current = sincronizar;
    socket.on('cocina:estado_cambiado', (p: { comandaId: string }) => {
      if (p.comandaId === comandaRef.current) sincronizar();
    });
    const timer = setInterval(sincronizar, 6000);
    return () => { socket.close(); clearInterval(timer); };
  }, []);

  const agregarAlCarrito = (item: Omit<ItemCarrito, 'cantidad'>, cantidad: number = 1) => {
    // El ítem se asigna al comensal activo (se puede reasignar desde la comanda)
    const comensalId = item.comensalId ?? activo?.id;
    // Dos líneas del mismo plato con distintos ingredientes quitados son pedidos distintos
    const sinClave = item.sinIngredientes?.length ? '::sin:' + [...item.sinIngredientes].sort().join(',') : '';
    const lineaId = item.id + '::' + comensalId + sinClave;
    const quien = comensales.length > 1 && activo ? ' ' + texto(idioma, 'toastPara', { c: nombreComensal(activo) }) : '';
    mostrarAviso(texto(idioma, 'toastAgregado', { n: item.nombre }) + quien);
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => (i.lineaId ?? i.id) === lineaId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
        return copy;
      }
      return [...prev, { ...item, comensalId, lineaId, cantidad }];
    });
  };

  const clave = (i: ItemCarrito) => i.lineaId ?? i.id;
  const eliminarDelCarrito = (lineaId: string) => setCarrito((prev) => prev.filter((i) => clave(i) !== lineaId));

  const actualizarIngredientes = (lineaId: string, sin: string[]) => {
    setCarrito((prev) => {
      const origen = prev.find((i) => clave(i) === lineaId);
      if (!origen) return prev;
      const sinClave = sin.length ? '::sin:' + [...sin].sort().join(',') : '';
      const nuevaLinea = origen.id + '::' + origen.comensalId + sinClave;
      const resto = prev.filter((i) => clave(i) !== lineaId);
      const existente = resto.findIndex((i) => clave(i) === nuevaLinea);
      if (existente >= 0) {
        // si ya había la misma versión del plato, se suman las cantidades
        const copy = [...resto];
        copy[existente] = { ...copy[existente], cantidad: copy[existente].cantidad + origen.cantidad };
        return copy;
      }
      return prev.map((i) => (clave(i) === lineaId ? { ...i, sinIngredientes: sin, lineaId: nuevaLinea } : i));
    });
  };

  const actualizarCantidad = (lineaId: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (clave(item) !== lineaId) return item;
          const n = item.cantidad + delta;
          return n > 0 ? { ...item, cantidad: n } : null;
        })
        .filter(Boolean) as ItemCarrito[],
    );
  };

  const reasignarItem = (lineaId: string, comensalId: string) => {
    setCarrito((prev) => {
      const origen = prev.find((i) => clave(i) === lineaId);
      if (!origen) return prev;
      const sinClave = origen.sinIngredientes?.length ? '::sin:' + [...origen.sinIngredientes].sort().join(',') : '';
      const nuevaLinea = origen.id + '::' + comensalId + sinClave;
      const resto = prev.filter((i) => clave(i) !== lineaId);
      const existente = resto.findIndex((i) => clave(i) === nuevaLinea);
      if (existente >= 0) {
        // si ya había el mismo ítem para ese comensal, se suman las cantidades
        const copy = [...resto];
        copy[existente] = { ...copy[existente], cantidad: copy[existente].cantidad + origen.cantidad };
        return copy;
      }
      return prev.map((i) => (clave(i) === lineaId ? { ...i, comensalId, lineaId: nuevaLinea } : i));
    });
  };

  const limpiarCarrito = () => setCarrito([]);
  const totalPEN = carrito.reduce((acc, item) => acc + item.precioPEN * item.cantidad, 0);

  const t = (clave: ClaveTexto, vars?: Record<string, string | number>) => texto(idioma, clave, vars);
  const nombreComensal = (c: Comensal) => c.nombre.trim() || texto(idioma, 'comensalN', { n: comensales.indexOf(c) + 1 });
  const nombreAlergeno = (codigo: string) => ALERGENOS_NOMBRE[codigo]?.[idioma] ?? codigo;
  const mesa =
    mesaEstado === 'ok' ? `${texto(idioma, 'mesa')} ${String(mesaNumero).padStart(2, '0')}` : texto(idioma, mesaEstado === 'error' ? 'mesaSinConexion' : 'mesaConectando');
  const recomendados =
    perfil && !perfil.omitido ? recomendarPlatos(platos, perfil, alergiasDeclaradas, momento) : [];
  // Sin perfil de gustos (omitió preferencias) o sin coincidencias: se sugieren los más solicitados
  const menuRecomendado = (() => {
    if (!perfil || platos.length === 0) return null;
    if (!perfil.omitido || perfil.esNino) {
      const m = armarMenuRecomendado(platos, perfil, alergiasDeclaradas, momento);
      if (m.entrada.length + m.fondo.length + m.postre.length > 0) return m;
    }
    return armarMenuPopular(platos, alergiasDeclaradas, momento);
  })();

  // ── Maridaje (RF06): hasta 3 etiquetas con stock ────────────
  const obtenerMaridajes = async (plato: Plato): Promise<MaridajeRecomendacion[]> => {
    try {
      const { data } = await api<{ data: any[] }>(`/maridajes?plato=${encodeURIComponent(plato.codigo)}`);
      return data.map((r) => ({
        etiquetaId: r.codigoInterno,
        nombre: r.nombre,
        linea: r.cepa ?? '',
        tipo: r.tipo,
        precioBotellaPEN: r.precioLista,
        precioCopaPEN: precioCopa(r.tipo, r.precioLista),
        stockActual: r.stockDisponible,
        explicacionSommelier: r.motivo ?? r.descripcion,
        puntuacionAfinidad: r.puntaje * 10,
      }));
    } catch {
      return [];
    }
  };

  // ── Comanda: crear → declarar alergias (RN01) → confirmar ───
  const confirmarComanda = async () => {
    if (!mesaId || !tokenMesa) throw new Error('Mesa no identificada');
    // Antes de enviar a cocina se vuelve a leer la carta y la bodega: nada agotado puede llegar a la comanda
    const [platosAhora, etiquetasAhora] = await Promise.all([cargarCarta().catch(() => platos), cargarEtiquetas()]);
    const agotados = carrito.filter((i) =>
      i.tipo === 'PLATO'
        ? platosAhora.some((p) => p.id === i.id && !p.disponible)
        : etiquetasAhora.length > 0 && etiquetasAhora.some((e) => e.id === (i.etiquetaId ?? i.id.replace(/-(copa|botella)$/, '')) && e.agotado),
    );
    if (agotados.length) {
      throw new Error(texto(idioma, 'platoAgotadoCarrito', { n: [...new Set(agotados.map((i) => i.nombre))].join(', ') }));
    }
    const varios = comensales.length > 1;
    const items = carrito.map((i) => {
      const esBebida = i.tipo !== 'PLATO';
      // Nota para cocina: comensal y sus alergias (en español, idioma de la cocina)
      const com = comensales.find((c) => c.id === i.comensalId);
      const partes: string[] = [];
      if (varios && com) partes.push(nombreComensal(com));
      if (com && com.alergias.length) partes.push('ALERGIA: ' + com.alergias.map((a) => ALERGENOS_NOMBRE[a]?.es ?? a).join(', '));
      if (i.sinIngredientes?.length) partes.push(notaSin(i.sinIngredientes));
      if (i.notas) partes.push(i.notas);
      const nota = partes.join(' | ');
      const codigo = i.etiquetaId ?? (esBebida ? i.id.replace(/-(copa|botella)$/, '') : undefined);
      return {
        platoId: esBebida ? codigo! : i.id,
        platoNombre: i.nombre,
        precioUnit: i.precioPEN,
        cantidad: i.cantidad,
        ...(esBebida ? { etiquetaId: codigo, etiquetaNombre: i.nombre } : {}),
        ...(nota ? { notas: nota } : {}),
      };
    });

    const { data: comanda } = await api<{ data: { id: string } }>('/comandas', {
      method: 'POST',
      body: { mesaId, sesionMesaId: tokenMesa.slice(-32), items },
    });

    // Alergias de todos los comensales de la mesa (códigos de alérgeno)
    const codigos = [...new Set(comensales.flatMap((c) => c.alergias))];
    await api(`/comandas/${comanda.id}/restricciones`, {
      method: 'POST',
      body: { alergenos: codigos, consentimiento: true, versionTerminos: VERSION_TERMINOS },
    });
    await api(`/comandas/${comanda.id}`, { method: 'PATCH', body: { estado: 'PENDIENTE' } });

    comandaRef.current = comanda.id;
    setComandaServidor(null);
    setComandaActivaId(comanda.id.slice(0, 8).toUpperCase());
    setEstadoComanda('CONFIRMADA');
    setCsatEnviado(false);
    setCuenta({ solicitada: false, metodoPago: null });
    sincronizarRef.current();
    setTimeout(cargarEtiquetas, 1500); // refleja el descuento de stock
  };

  const enviarCsat = async (puntuacion: number, comentario: string) => {
    if (comandaRef.current && mesaId) {
      await api('/valoraciones', {
        method: 'POST',
        body: { comandaId: comandaRef.current, mesaId, puntuacion, comentario },
      });
    }
    setCsatEnviado(true);
  };

  // Cambiar o anular un plato: el servidor solo lo permite durante los 5 minutos posteriores a la confirmación
  const anularItem = async (itemId: string) => {
    if (!comandaRef.current) return;
    await api(`/comandas/${comandaRef.current}/items/${itemId}`, { method: 'DELETE' });
    await sincronizarRef.current();
    setTimeout(cargarEtiquetas, 1500); // si era un vino o pisco, se devuelve al stock
  };
  const cambiarItem = async (itemId: string, plato: Plato) => {
    if (!comandaRef.current) return;
    await api(`/comandas/${comandaRef.current}/items/${itemId}`, {
      method: 'PATCH',
      body: { platoId: plato.id, platoNombre: plato.nombre, precioUnit: plato.precioPEN },
    });
    await sincronizarRef.current();
  };
  const itemAgotado = (item: ItemCarrito) =>
    item.tipo === 'PLATO'
      ? platos.some((p) => p.id === item.id && !p.disponible)
      : etiquetas.some((e) => e.id === (item.etiquetaId ?? item.id.replace(/-(copa|botella)$/, '')) && e.agotado);
  const avisoStock = (codigo: string) => {
    const e = etiquetas.find((x) => x.id === codigo);
    return e ? mensajeStock(e, t) : null;
  };

  // Pedir la cuenta: solo con el pedido entregado y calificado (o, si lo prefiere, sin calificar)
  const solicitarCuenta = async (omitirCalificacion: boolean, metodoPago: string, efectivoPagaCon?: number) => {
    if (!comandaRef.current) return;
    await api(`/comandas/${comandaRef.current}/cuenta`, { method: 'POST', body: { omitirCalificacion, metodoPago, efectivoPagaCon } });
    setCuenta((c) => ({ ...c, solicitada: true, metodoPago }));
  };

  return (
    <AppContext.Provider
      value={{
        mesa, idioma, setIdioma, alergiasDeclaradas, setAlergiasDeclaradas, alergenosCatalogo,
        comensales, activoIdx, mesaConfigurada, iniciarMesa, seleccionarComensal, avanzarComensal, retrocederComensal, terminosAceptados, aceptarTerminos, aviso, cambiarTamanoGrupo, reiniciarMesa, terminarConfiguracion,
        renombrarComensal, nombreComensal, reasignarItem,
        momento, setMomento, perfil, guardarPerfil, recomendados, menuRecomendado, mostrarRecomendacion, setMostrarRecomendacion, t, nombreAlergeno,
        modalAlergenosAbierto, setModalAlergenosAbierto, platos, etiquetas, cargandoCarta, errorCarta,
        carrito, agregarAlCarrito, eliminarDelCarrito, actualizarIngredientes, actualizarCantidad, limpiarCarrito, totalPEN,
        comandaActivaId, estadoComanda, confirmarComanda, obtenerMaridajes, csatEnviado, enviarCsat, cuenta, solicitarCuenta,
        comandaServidor, anularItem, cambiarItem, itemAgotado, avisoStock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
