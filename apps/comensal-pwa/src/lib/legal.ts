/**
 * Política de privacidad de TacamaMesa (Ley N.º 29733 y su Reglamento, D.S. 016-2024-JUS).
 * Es un borrador de trabajo: debe revisarlo el restaurante y su asesor legal antes de operar.
 * Los datos que el restaurante debe completar están marcados en CONTACTO_PRIVACIDAD y RESPONSABLE.
 * El texto en español es el vinculante; el inglés es una traducción de cortesía (también se muestra en francés, portugués y alemán).
 */

export const VERSION_TERMINOS = '2026-10';

export const RESPONSABLE = 'El Tambo de Tacama (Viña Tacama S.A.), Ica, Perú';
// Debe definirlo el restaurante antes de operar (correo o dirección para ejercer derechos)
export const CONTACTO_PRIVACIDAD = { es: 'por definir por el restaurante antes de operar', en: 'to be defined by the restaurant before going live' };

export interface SeccionLegal { titulo: string; texto: string }

export const POLITICA: Record<'es' | 'en', { titulo: string; actualizada: string; secciones: SeccionLegal[] }> = {
  es: {
    titulo: 'Política de privacidad',
    actualizada: 'Versión ' + VERSION_TERMINOS,
    secciones: [
      { titulo: '1. Quién es el responsable', texto: RESPONSABLE + '. Es el titular del banco de datos «Comandas y atención de comensales» y decide cómo se tratan sus datos. Contacto de privacidad: ' + CONTACTO_PRIVACIDAD.es + '.' },
      { titulo: '2. Qué datos tratamos', texto: 'Los que usted indica: alergias e intolerancias alimentarias (datos de salud, que son datos sensibles), gustos, el nombre o apodo de cada comensal (opcional), si un comensal es niño, el método de pago elegido, y su calificación y comentario. Del pedido guardamos los platos, la hora y la mesa. No pedimos documento de identidad, teléfono ni correo, y no hay cuentas de comensal.' },
      { titulo: '3. Para qué los usamos', texto: 'Para preparar su pedido con seguridad (la cocina ve sus alergias), recomendarle platos y bebidas, preparar el cobro, y mejorar nuestra atención con sus calificaciones y estadísticas agregadas. No los usamos para publicidad ni los vendemos o cedemos a terceros.' },
      { titulo: '4. Consentimiento', texto: 'Tratamos sus datos solo con su consentimiento libre, previo, expreso, informado e inequívoco. Para los datos de salud (alergias) le pedimos una autorización específica y separada, que da marcando la casilla correspondiente. Si el comensal es menor de edad, la acepta su adulto responsable. Puede retirar su consentimiento en cualquier momento; si no desea declarar alergias, consulte a su mozo antes de pedir.' },
      { titulo: '5. Con quién los compartimos', texto: 'Con el personal de cocina y salón del restaurante, solo en lo necesario para atenderlo. Los proveedores tecnológicos que alojan el sistema tratan los datos por encargo del restaurante, con deber de confidencialidad. No hay otras comunicaciones de datos.' },
      { titulo: '6. Cuánto tiempo los conservamos', texto: 'Sus gustos y alergias se guardan en su dispositivo solo mientras la pestaña esté abierta. El pedido (con las alergias y notas que usted indicó) se conserva hasta 12 meses para atender reclamos y obligaciones del restaurante; luego se elimina o se anonimiza.' },
      { titulo: '7. Sus derechos', texto: 'Puede ejercer sus derechos de información, acceso, rectificación, cancelación y oposición, y los demás que reconoce la Ley N.º 29733 y su Reglamento, escribiendo al contacto de privacidad indicado arriba. Si considera que no atendimos su solicitud, puede acudir a la Autoridad Nacional de Protección de Datos Personales (Ministerio de Justicia y Derechos Humanos).' },
      { titulo: '8. Seguridad y almacenamiento en su dispositivo', texto: 'El personal accede con cuenta propia y según su rol. En su dispositivo usamos solo el almacenamiento de sesión del navegador para recordar su perfil mientras la pestaña está abierta; no usamos cookies publicitarias ni de seguimiento.' },
      { titulo: '9. Cambios', texto: 'Si esta política cambia, le pediremos su aceptación nuevamente en su próxima visita.' },
    ],
  },
  en: {
    titulo: 'Privacy policy',
    actualizada: 'Version ' + VERSION_TERMINOS,
    secciones: [
      { titulo: '1. Who is responsible', texto: RESPONSABLE + '. It owns the "Orders and guest service" database and decides how your data is handled. Privacy contact: ' + CONTACTO_PRIVACIDAD.en + '.' },
      { titulo: '2. What data we process', texto: 'What you tell us: food allergies and intolerances (health data, which is sensitive data), tastes, each guest\'s name or nickname (optional), whether a guest is a child, the payment method you choose, and your rating and comment. From the order we keep the dishes, the time and the table. We do not ask for ID, phone or email, and there are no guest accounts.' },
      { titulo: '3. What we use it for', texto: 'To prepare your order safely (the kitchen sees your allergies), recommend dishes and drinks, prepare payment and issue your receipt, and improve our service with ratings and aggregate statistics. We do not use it for advertising and we do not sell or hand it to third parties.' },
      { titulo: '4. Consent', texto: 'We process your data only with your free, prior, express, informed and unequivocal consent. For health data (allergies) we ask for a specific, separate authorisation, which you give by ticking the corresponding box. For a minor, the responsible adult accepts. You can withdraw consent at any time; if you prefer not to declare allergies, please ask your waiter before ordering.' },
      { titulo: '5. Who we share it with', texto: 'With the restaurant\'s kitchen and floor staff, only as needed to serve you. The technology providers that host the system process the data on the restaurant\'s behalf, under a duty of confidentiality. There are no other disclosures.' },
      { titulo: '6. How long we keep it', texto: 'Your tastes and allergies stay on your device only while the tab is open. The order (with the allergies and notes you gave) is kept for up to 12 months to handle claims and the restaurant\'s obligations; afterwards it is deleted or anonymised.' },
      { titulo: '7. Your rights', texto: 'You can exercise your rights of information, access, rectification, cancellation and objection, and the others recognised by Peruvian Law No. 29733 and its Regulations, by writing to the privacy contact above. If you feel we did not handle your request, you can go to the National Authority for Personal Data Protection (Ministry of Justice and Human Rights).' },
      { titulo: '8. Security and storage on your device', texto: 'Staff sign in with their own account according to their role. On your device we only use the browser\'s session storage to remember your profile while the tab is open; we use no advertising or tracking cookies.' },
      { titulo: '9. Changes', texto: 'If this policy changes, we will ask for your acceptance again on your next visit.' },
    ],
  },
};
