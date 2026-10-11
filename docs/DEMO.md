# Guía de demostración: TacamaMesa en El Tambo de Tacama

Proyecto académico de estudiantes de la UTP (ver [COPYRIGHT.md](../COPYRIGHT.md)). Demo **local**: todo corre en esta computadora y no se publica nada. Los celulares entran por la red Wi-Fi.

## 1. Preparar la demo (5 minutos antes)

```bash
pnpm run demo
```

Hace tres cosas: levanta el sistema (si no está arriba), lo deja en estado inicial y genera los QR de las mesas.

- **Estado inicial:** carta con sus precios y fotos originales, bodega con su stock inicial, sin comandas.
- **Historial de ejemplo:** carga comandas, calificaciones y consumo de vinos **ficticios** para que los indicadores y los avisos de stock se vean con vida. Con `pnpm run demo -- -SinHistorial` no se carga.
- **QR:** abre `docs/demo/qr-mesas.html` para imprimirlos. Cada QR apunta a la IP de esta computadora; si cambia de red, vuelve a ejecutar `pnpm run demo:qr`.

Antes de empezar:

- El celular debe estar en el **mismo Wi-Fi** que la computadora. Si no abre la página, permite en el Firewall de Windows los puertos 5173 y 5174 (red privada).
- Docker Desktop debe estar abierto (el script lo abre si hace falta).
- Entre una demostración y otra: `pnpm run demo:reset` (deja todo como al inicio).

| Quién | Dirección | Cuenta |
|---|---|---|
| Comensal (esta PC) | http://localhost:5173/?mesa=QR-MESA-004 | no necesita cuenta |
| Comensal (celular) | la que imprime `pnpm run demo` | no necesita cuenta |
| Mozo | http://localhost:5174 | `mozo1@tacama.pe` / `Mozo2024!` (también `mozo2@` y `mozo3@`) |
| Cocina | http://localhost:5174 | `cocina@tacama.pe` / `Cocina2024!` |
| Jefe de salón | http://localhost:5174 | `jefe@tacama.pe` / `JefeSalon2024!` |
| Sommelier | http://localhost:5174 | `sommelier@tacama.pe` / `Sommelier2024!` |
| Administrador | http://localhost:5174 | `admin@tacama.pe` / `Admin2024!` |

Conviene tener abiertas, en ventanas separadas: el celular (comensal), la cocina, y el mozo.

## 2. Recorrido sugerido (10 a 12 minutos)

**A. El comensal pide desde su mesa**
1. Escanear el QR de la mesa. Aparece primero el aviso de privacidad, con dos casillas (condiciones generales y datos de salud).
2. Elegir cuántas personas son, "peruano" o "extranjero" y completar alergias y gustos. Mostrar que el idioma sigue al del celular.
3. "Ver mi recomendación": entrada, fondo, postre, bebida (vino o pisco que marida) y piqueo para compartir. En almuerzo, probar también la versión de un niño (menú kids y bebida sin alcohol).
4. En "Vinos y piscos": **Don Manuel Petit Verdot** muestra "¡Últimas 2 botellas!" con el tiempo estimado, según la frecuencia de pedidos. **Ambrosía** aparece agotada.
5. Agregar platos y **confirmar** el pedido.

**B. Cocina y mozo**
1. En cocina llega la comanda con la alerta de alergias. Iniciar preparación y marcar lista.
2. En el portal del mozo, la mesa aparece **"Sin atender"**. El mozo pulsa **"Atender esta mesa"** y queda como responsable hasta que se cierre. Otro mozo ya no puede tomarla (solo el jefe de salón).
3. El mozo confirma la entrega en mesa. Cocina no puede hacerlo.

**C. Cambios durante los primeros 5 minutos**
- Justo después de confirmar, en "Tu pedido" el comensal ve la cuenta regresiva y puede **cambiar** un plato por otro o **anularlo**. Pasados los 5 minutos, o con el plato ya listo, se indica que consulte con el mozo. Cocina ve la etiqueta "Modificada".

**D. Administración (jefe de salón o administrador)**
1. "Carta y precios": marcar un plato como **agotado**, cambiar un precio y subir una **foto**.
2. En el celular, el plato aparece como agotado en menos de un minuto y no se puede agregar.
3. Inventario (sommelier): ajustar el stock de una etiqueta, cambiar el umbral y marcar **agotado**; los avisos al comensal se actualizan.

**E. Cuenta y pago**
1. Con el pedido entregado, el comensal pulsa **"Pedir la cuenta"**: primero la calificación (con el mensaje "Tu opinión es muy importante para nosotros"), luego el método de pago.
2. El mozo ve cómo va a pagar (por ejemplo, el vuelto si es efectivo, o que lleve el POS si es tarjeta), emite el comprobante y lo imprime.
3. El comensal descarga el comprobante en **PDF** o lo **comparte** como imagen. El mozo confirma el cobro y cierra la mesa.

**F. Indicadores**
- Administrador: "KPIs y auditoría" (ticket promedio, venta cruzada, calificación). **Aclarar que el historial es de ejemplo.**

## 3. Qué decir con honestidad

- Es una demo funcional, no un sistema listo para operar. Faltan, entre otras cosas, la **boleta electrónica** (hoy es un comprobante de consumo informativo), la integración con el **POS** (Izipay u otro), la publicación con HTTPS y la revisión legal de privacidad (ver `docs/PRIVACIDAD.md`).
- Los **alérgenos** de la carta están inferidos de las descripciones: la cocina debe validarlos antes de usarlos con clientes reales.
- Los **precios de vinos y piscos** son referenciales.
- El **stock de la bodega** se maneja con datos de prueba, no con el sistema real del restaurante.
- El control de roles del portal aún no verifica la firma de la sesión (suficiente para la demo, no para producción).

## 4. Si algo falla

| Síntoma | Qué hacer |
|---|---|
| El celular no abre la página | Mismo Wi-Fi; permitir los puertos 5173 y 5174 en el Firewall; verificar la IP con `pnpm run demo:qr` |
| "Sin conexión" o servicios caídos | `pnpm run stop:local` y luego `pnpm run demo` |
| El stock o el maridaje no se actualizan | Vuelve a ejecutar `pnpm run demo` (alinea la contraseña de RabbitMQ y reinicia) |
| Quieres empezar de cero | `pnpm run demo:reset` |
