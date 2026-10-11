# Privacidad y protección de datos personales (Perú)

> **Aviso:** este documento resume la investigación hecha para el proyecto y deja una lista de pendientes. **No es asesoría legal.** El texto de la política y el resto de obligaciones deben revisarse con un abogado especializado en protección de datos antes de operar con clientes reales.

## 1. Marco legal aplicable

| Norma | Qué importa para TacamaMesa |
|---|---|
| **Ley N.º 29733**, Ley de Protección de Datos Personales | Principios (consentimiento, finalidad, proporcionalidad, seguridad), derechos del titular, obligación de inscribir los bancos de datos y sanciones (infracciones leves, graves y muy graves, con multas en UIT). |
| **D.S. N.º 016-2024-JUS**, nuevo Reglamento | Publicado el 30/11/2024; según el Ministerio de Justicia, vigente desde el 31/03/2025. Reemplaza al D.S. 003-2013-JUS. Refuerza el consentimiento, la transparencia y la seguridad. |

Puntos del marco que condicionan el diseño del sistema (las fuentes secundarias citadas abajo; **verificar los artículos exactos en el texto oficial**):

- **Consentimiento** libre, previo, expreso, inequívoco e informado. La **prueba** de que se obtuvo le corresponde al responsable del banco de datos.
- **Datos sensibles** (entre ellos los de salud, como **alergias e intolerancias**): exigen una forma reforzada de consentimiento, por escrito, incluida la forma electrónica que garantice la voluntad del titular (artículo 8 del Reglamento según el análisis de Estudio Ugaz).
- **Deber de informar** al titular (artículo 18 de la Ley): quién es el responsable, para qué se usan los datos, a quién se comunican, plazo de conservación y cómo ejercer sus derechos.
- **Derechos ARCO** (acceso, rectificación, cancelación y oposición), más información y los que añade el nuevo Reglamento. Plazos citados por fuentes secundarias: 8 días hábiles (información), 20 (acceso) y 10 (rectificación, cancelación u oposición). **Verificar en el Reglamento vigente.**
- **Registro** de los bancos de datos personales ante la Autoridad Nacional de Protección de Datos Personales (ANPD, del Ministerio de Justicia y Derechos Humanos).
- **Incidentes de seguridad:** fuentes secundarias mencionan notificación a la ANPD en 48 horas; el dato proviene de blogs y de un proyecto de reglamento, **debe confirmarse** en el texto vigente.
- Menores de edad: el tratamiento de sus datos requiere el consentimiento de quien ejerce la patria potestad. El sistema solo registra si un comensal es niño; el consentimiento lo da el adulto de la mesa.

## 2. Qué datos maneja hoy el sistema

| Dato | Dónde queda | Cuánto tiempo | Observaciones |
|---|---|---|---|
| Gustos, perfil, nombre o apodo por comensal | Solo en el navegador del comensal (`sessionStorage`) | Hasta cerrar la pestaña | No se envía al servidor, salvo lo que va en la nota del pedido |
| Alergias e intolerancias (dato de salud) | Navegador y, dentro de la comanda, base `comandas` | Comanda: política propone 12 meses | Con consentimiento y versión de los términos registrados por comanda |
| Nombre o apodo de cada comensal | Nota de cada plato en la comanda | Igual que la comanda | Opcional |
| Marca de "comensal niño" | Solo navegador | Hasta cerrar la pestaña | |
| Método de pago y monto con el que paga en efectivo | Comanda | Igual que la comanda | Sin datos de tarjeta ni cuentas |
| Calificación y comentario | Comanda y auditoría | Igual que la comanda | Se asocia a mesa y pedido, no a una persona |
| Mozo responsable de la mesa | Comanda | Igual que la comanda | Dato del personal, no del cliente |

No se piden DNI, teléfono, correo ni dirección, y no hay cuentas de comensal. No se usan cookies publicitarias ni de seguimiento.

## 3. Lo que ya está implementado

- **Aviso previo** a cualquier uso (pantalla de términos) en 5 idiomas, con **dos autorizaciones separadas**: condiciones generales y **datos de salud**. Ambas son obligatorias para continuar.
- **Política de privacidad completa** (español, que es el texto vinculante, e inglés de cortesía) accesible desde la pantalla de términos y desde el pie de la carta: responsable, datos, finalidades, consentimiento, destinatarios, plazos, derechos, seguridad y cambios (`apps/comensal-pwa/src/lib/legal.ts`).
- **Evidencia del consentimiento:** cada comanda guarda la declaración de alergias con `consentimiento` y la **versión de los términos** aceptados y la fecha (`RestriccionAlergeno`). Al cambiar la versión de los términos, se vuelve a pedir la aceptación.
- **Mínimo de datos:** el perfil y los gustos no salen del dispositivo.
- **Menores:** la política indica que el consentimiento lo da el adulto responsable.

## 4. Pendientes para el restaurante

Antes de operar con clientes reales:

1. **Definir el responsable legal** (razón social, RUC y domicilio) y completarlos en `lib/legal.ts`. Hoy figura "El Tambo de Tacama (Viña Tacama S.A.), Ica, Perú".
2. **Definir el contacto de privacidad** para ejercer derechos (correo o dirección). Hoy dice "por definir por el restaurante antes de operar".
3. **Inscribir el banco de datos** («Comandas y atención de comensales» u otro nombre) ante la ANPD, y los de clientes, personal y videovigilancia si existen. Confirmar el procedimiento vigente.
4. **Confirmar el plazo de conservación.** La política propone 12 meses; debe alinearlo con sus obligaciones tributarias y de reclamos.
5. **Contrato con el proveedor de alojamiento** (encargado del tratamiento) y saber **dónde están los servidores**: si están fuera del Perú hay reglas de flujo transfronterizo.
6. **Procedimiento ARCO** con responsable designado y plazos, y **registro de incidentes** con el plazo de notificación confirmado.
7. Revisión legal del texto de la política y de la casilla de datos de salud.
8. Decidir si se designa un **oficial de protección de datos** (algunas fuentes indican que cierta clase de organizaciones debe hacerlo; verificar si le aplica).

Mejoras técnicas recomendadas:

- Publicar **solo con HTTPS**.
- Verificar la **firma de la sesión del personal** en los servicios (hoy los roles se aplican como regla de flujo).
- **Política de retención automática**: borrar o anonimizar las comandas pasado el plazo definido.
- Procedimiento para **atender solicitudes de cancelación** de una comanda concreta.

## 5. Fuentes consultadas

- [Ley N.º 29733 vigente (portal de la SMV)](https://www.smv.gob.pe/Uploads/Ley_29733_vigente_2025.pdf)
- [MINJUSDH: nuevo Reglamento de Protección de Datos Personales](https://www.gob.pe/institucion/minjus/noticias/1137398-nuevo-reglamento-de-proteccion-de-datos-personales-refuerza-el-consentimiento-de-usuarios-para-recibir-llamadas-publicitarias)
- [IAPP: Se publica el nuevo reglamento de protección de datos personales en Perú](https://iapp.org/news/a/se-publica-el-nuevo-reglamento-de-protecci-n-de-datos-personales-en-per-)
- [Estudio Ugaz: El consentimiento en el nuevo reglamento](https://estudiougaz.com/publicaciones/el-consentimiento-en-el-nuevo-reglamento-de-proteccion-de-datos-personales/)
- [CPL Consultores: Ingresa en vigencia nuevo reglamento de datos personales](https://www.cplconsultores.com/publicaciones/ingresa-en-vigencia-nuevo-reglamento-de-datos-personales)
- [Modelo de política de privacidad (gob.pe)](https://cdn.www.gob.pe/uploads/document/file/1975604/1991056-modelo-de-politica-de-privacidad.pdf)
- [Guía de protección de datos para emprendedores (kom.pe)](https://kom.pe/proteccion-de-datos-personales-en-peru-guia-completa-para-emprendedores-2026/)
- [Política de privacidad y Ley 29733 (modelo.pe)](https://modelo.pe/blog/politica-de-privacidad-y-ley-29733-datos-personales/)

Varias de estas fuentes son análisis de estudios y blogs comerciales, no el texto oficial; por eso los plazos y artículos citados arriba deben contrastarse con el Reglamento publicado en *El Peruano* (D.S. 016-2024-JUS).
