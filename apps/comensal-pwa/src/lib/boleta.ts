/** Comprobante de consumo: HTML autónomo que se puede imprimir, guardar como PDF o descargar. */
export interface BoletaDatos {
  codigo: string;
  mesa: string;
  emitidaEn: string;
  items: { nombre: string; cantidad: number; precioUnit: number; subtotal: number; notas?: string | null }[];
  subtotal: number;
  igv: number;
  total: number;
  metodoPago?: string | null;
}
export interface BoletaTextos {
  pago: string;
  metodos: Record<string, string>;
  titulo: string; mesa: string; fecha: string; detalle: string; subtotal: string; igv: string; total: string; nota: string; gracias: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const soles = (n: number) => 'S/ ' + n.toFixed(2);

export function boletaHtml(d: BoletaDatos, x: BoletaTextos): string {
  const fecha = new Date(d.emitidaEn).toLocaleString();
  const filas = d.items
    .map((i) => `<tr><td>${i.cantidad} x ${esc(i.nombre)}${i.notas ? `<div class="n">${esc(i.notas)}</div>` : ''}</td><td class="r">${soles(i.subtotal)}</td></tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(x.titulo)} ${esc(d.codigo)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#1F1F1F;max-width:380px;margin:24px auto;padding:0 16px}
h1{font-family:Georgia,serif;font-size:20px;margin:0;text-align:center;letter-spacing:.04em}
.s{text-align:center;color:#577A17;font-size:12px;margin:2px 0 14px}
.m{font-size:12px;color:#555;margin-bottom:10px;line-height:1.6}
table{width:100%;border-collapse:collapse;font-size:13px}
td{padding:5px 0;border-bottom:1px dashed #ccc;vertical-align:top}.r{text-align:right;white-space:nowrap}
.n{font-size:11px;color:#777}
.t td{border:none;padding:3px 0}.g td{font-weight:bold;font-size:15px;border-top:2px solid #1F1F1F;padding-top:8px}
.f{font-size:11px;color:#777;margin-top:16px;text-align:center;line-height:1.5}
@media print{body{margin:0}}
</style></head><body>
<h1>TAMBO DE TACAMA</h1><div class="s">${esc(x.titulo)}</div>
<div class="m"><b>${esc(d.codigo)}</b><br>${esc(x.mesa)}: ${esc(d.mesa)}<br>${esc(x.fecha)}: ${esc(fecha)}${d.metodoPago ? `<br>${esc(x.pago)}: ${esc(x.metodos[d.metodoPago] ?? d.metodoPago)}` : ''}</div>
<table>${filas}</table>
<table class="t"><tr><td>${esc(x.subtotal)}</td><td class="r">${soles(d.subtotal)}</td></tr><tr><td>${esc(x.igv)}</td><td class="r">${soles(d.igv)}</td></tr><tr class="g"><td>${esc(x.total)}</td><td class="r">${soles(d.total)}</td></tr></table>
<div class="f">${esc(x.nota)}<br><br>${esc(x.gracias)}</div>
</body></html>`;
}

export function imprimirBoleta(d: BoletaDatos, x: BoletaTextos) {
  const w = window.open('', '_blank', 'width=460,height=700');
  if (!w) return;
  w.document.write(boletaHtml(d, x));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export function descargarBoleta(d: BoletaDatos, x: BoletaTextos) {
  const url = URL.createObjectURL(new Blob([boletaHtml(d, x)], { type: 'text/html;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'comprobante-' + d.codigo + '.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
