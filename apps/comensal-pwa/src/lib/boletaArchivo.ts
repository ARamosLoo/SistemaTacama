import type { BoletaDatos, BoletaTextos } from './boleta';

/** Comprobante como archivo: PDF real (formato ticket) e imagen PNG para compartir. */

const soles = (n: number) => 'S/ ' + n.toFixed(2);
const nombreMetodo = (d: BoletaDatos, x: BoletaTextos) => (d.metodoPago ? x.metodos[d.metodoPago] ?? d.metodoPago : null);

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ── PDF ────────────────────────────────────────────────────────
export async function guardarBoletaPdf(d: BoletaDatos, x: BoletaTextos) {
  const { jsPDF } = await import('jspdf');
  const ANCHO = 80, M = 6, W = ANCHO - M * 2, XR = ANCHO - M;
  const fecha = new Date(d.emitidaEn).toLocaleString();
  const metodo = nombreMetodo(d, x);

  // Medición previa para calcular el alto del ticket
  const medidor = new jsPDF({ unit: 'mm', format: [ANCHO, 200] });
  medidor.setFontSize(9);
  const lineasItem = d.items.map((i) => medidor.splitTextToSize(i.cantidad + ' x ' + i.nombre, W - 22) as string[]);
  medidor.setFontSize(7);
  const lineasNota = medidor.splitTextToSize(x.nota, W) as string[];
  const alto = 52 + lineasItem.reduce((a, l) => a + l.length * 4 + 1.5, 0) + 30 + lineasNota.length * 3 + 12;

  const doc = new jsPDF({ unit: 'mm', format: [ANCHO, Math.max(alto, 90)] });
  let y = 12;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('TAMBO DE TACAMA', ANCHO / 2, y, { align: 'center' });
  y += 5.5; doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(87, 122, 23); doc.text(x.titulo, ANCHO / 2, y, { align: 'center' });
  doc.setTextColor(40, 40, 40);
  y += 7; doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.text(d.codigo, M, y);
  doc.setFont('helvetica', 'normal');
  y += 4.2; doc.text(x.mesa + ': ' + d.mesa, M, y);
  y += 4.2; doc.text(x.fecha + ': ' + fecha, M, y);
  if (metodo) { y += 4.2; doc.text(x.pago + ': ' + metodo, M, y); }
  y += 3; doc.setDrawColor(190, 190, 190); doc.line(M, y, XR, y);

  y += 5; doc.setFontSize(9);
  d.items.forEach((i, k) => {
    doc.text(lineasItem[k], M, y);
    doc.text(soles(i.subtotal), XR, y, { align: 'right' });
    y += lineasItem[k].length * 4 + 1.5;
  });
  y += 0.5; doc.setDrawColor(190, 190, 190); doc.line(M, y, XR, y);

  y += 5; doc.setFontSize(9);
  doc.text(x.subtotal, M, y); doc.text(soles(d.subtotal), XR, y, { align: 'right' });
  y += 4.5; doc.text(x.igv, M, y); doc.text(soles(d.igv), XR, y, { align: 'right' });
  y += 3; doc.setDrawColor(30, 30, 30); doc.line(M, y, XR, y);
  y += 5.5; doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(x.total, M, y); doc.text(soles(d.total), XR, y, { align: 'right' });

  y += 9; doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(110, 110, 110);
  doc.text(lineasNota, ANCHO / 2, y, { align: 'center' });
  y += lineasNota.length * 3 + 4; doc.text(x.gracias, ANCHO / 2, y, { align: 'center' });

  descargar(doc.output('blob'), 'comprobante-' + d.codigo + '.pdf');
}

// ── Imagen ─────────────────────────────────────────────────────
function envolver(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const palabras = texto.split(' ');
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (ctx.measureText(prueba).width > ancho && actual) { lineas.push(actual); actual = p; } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

async function boletaPng(d: BoletaDatos, x: BoletaTextos): Promise<Blob> {
  const ESC = 2, W = 380, M = 24;
  const fecha = new Date(d.emitidaEn).toLocaleString();
  const metodo = nombreMetodo(d, x);
  const medir = document.createElement('canvas').getContext('2d')!;
  medir.font = '14px Arial, Helvetica, sans-serif';
  const lineasItem = d.items.map((i) => envolver(medir, i.cantidad + ' x ' + i.nombre, W - M * 2 - 80));
  medir.font = '11px Arial, Helvetica, sans-serif';
  const lineasNota = envolver(medir, x.nota, W - M * 2);
  const alto = 140 + (metodo ? 20 : 0) + lineasItem.reduce((a, l) => a + l.length * 19 + 8, 0) + 110 + lineasNota.length * 15 + 40;

  const cv = document.createElement('canvas');
  cv.width = W * ESC; cv.height = alto * ESC;
  const c = cv.getContext('2d')!;
  c.scale(ESC, ESC);
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, alto);
  c.fillStyle = '#577A17'; c.fillRect(0, 0, W, 8);
  let y = 44;
  c.fillStyle = '#1F1F1F'; c.textAlign = 'center';
  c.font = 'bold 22px Georgia, serif'; c.fillText('TAMBO DE TACAMA', W / 2, y);
  y += 22; c.fillStyle = '#577A17'; c.font = '14px Arial, Helvetica, sans-serif'; c.fillText(x.titulo, W / 2, y);

  c.textAlign = 'left'; c.fillStyle = '#444';
  y += 30; c.font = 'bold 13px Arial, Helvetica, sans-serif'; c.fillText(d.codigo, M, y);
  c.font = '13px Arial, Helvetica, sans-serif';
  y += 19; c.fillText(x.mesa + ': ' + d.mesa, M, y);
  y += 19; c.fillText(x.fecha + ': ' + fecha, M, y);
  if (metodo) { y += 19; c.fillText(x.pago + ': ' + metodo, M, y); }
  y += 14; c.strokeStyle = '#CCCCCC'; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(M, y); c.lineTo(W - M, y); c.stroke(); c.setLineDash([]);

  y += 24; c.fillStyle = '#1F1F1F'; c.font = '14px Arial, Helvetica, sans-serif';
  d.items.forEach((i, k) => {
    lineasItem[k].forEach((l, n) => c.fillText(l, M, y + n * 19));
    c.textAlign = 'right'; c.fillText(soles(i.subtotal), W - M, y); c.textAlign = 'left';
    y += lineasItem[k].length * 19 + 8;
  });
  y += 2; c.strokeStyle = '#CCCCCC'; c.beginPath(); c.moveTo(M, y); c.lineTo(W - M, y); c.stroke();

  y += 24; c.fillStyle = '#555'; c.font = '14px Arial, Helvetica, sans-serif';
  c.fillText(x.subtotal, M, y); c.textAlign = 'right'; c.fillText(soles(d.subtotal), W - M, y); c.textAlign = 'left';
  y += 20; c.fillText(x.igv, M, y); c.textAlign = 'right'; c.fillText(soles(d.igv), W - M, y); c.textAlign = 'left';
  y += 12; c.strokeStyle = '#1F1F1F'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(M, y); c.lineTo(W - M, y); c.stroke(); c.lineWidth = 1;
  y += 28; c.fillStyle = '#1F1F1F'; c.font = 'bold 18px Arial, Helvetica, sans-serif';
  c.fillText(x.total, M, y); c.fillStyle = '#466212'; c.textAlign = 'right'; c.fillText(soles(d.total), W - M, y);

  c.textAlign = 'center'; c.fillStyle = '#888'; c.font = '11px Arial, Helvetica, sans-serif';
  y += 34; lineasNota.forEach((l, n) => c.fillText(l, W / 2, y + n * 15));
  y += lineasNota.length * 15 + 14; c.fillText(x.gracias, W / 2, y);

  return new Promise((ok, fail) => cv.toBlob((b) => (b ? ok(b) : fail(new Error('png'))), 'image/png'));
}

/** Comparte el comprobante como imagen con las apps del dispositivo; si el navegador no lo permite, descarga la imagen. */
export async function compartirBoleta(d: BoletaDatos, x: BoletaTextos): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const blob = await boletaPng(d, x);
  const archivo = new File([blob], 'comprobante-' + d.codigo + '.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [archivo] })) {
    try {
      await nav.share({ files: [archivo], title: x.titulo, text: x.titulo + ' ' + d.codigo });
      return 'compartido';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelado';
    }
  }
  descargar(blob, 'comprobante-' + d.codigo + '.png');
  return 'descargado';
}
