# Luces y Sombras — Web de la compañía

Web de una sola página para el grupo de teatro **Luces y Sombras**, con la
temporada 2027, las obras de la compañía, quiénes somos, elenco y un formulario
de reservas.

## Cómo verla

Abre `index.html` con doble clic. No necesita instalación ni servidor:
todo el HTML, el CSS y el JavaScript están en la carpeta.

```
proyecto-teatro/
├── index.html
├── css/
│   └── styles.css
└── js/
    └── script.js
```

## Qué incluye

- Diseño teatral en negro, crema y oro, con luces, polvo de escenario y póster animado.
- Cuenta atrás automática para la próxima función (5 de febrero de 2027).
- Sección de próximas actuaciones con las dos fechas y sus cuentas atrás.
- Sección «Obras» con las piezas de la compañía: empieza con *El Ascensor
  Nupcial* y su sinopsis. Para añadir otra obra, copia el `<article class="work-card">`
  dentro de `.works__grid`.
- Quiénes somos con dirección (Mercedes Rodríguez) y autoría (Daniel Cobo).
- Elenco con Javier Ruiz, Gabriel Romero, Fernando Santos, Aroa Piñeiro, Tori y Maria Jose.
- Modal de reserva rápida y formulario de solicitud con validación.
- Menú móvil, animaciones al hacer scroll, botón para volver arriba y modo de
  movimiento reducido para quien lo tenga activado en su sistema.
- Auditoría Lighthouse: 100 en accesibilidad, buenas prácticas y SEO.

## Datos que conviene personalizar

1. **Fechas y horas.** Están en dos sitios:
   - El array `SHOWS` al principio de `js/script.js` (fechas reales de la cuenta atrás).
   - El texto visible de las tarjetas, el póster y las opciones de los formularios
     en `index.html` (día, mes y hora que se muestran).
2. **Sala y horario.** Ahora aparece como “Teatro Municipal · Sala Principal” y
   “20:00 h”. Búscalo en `index.html` y cámbialo por el espacio real.
3. **Correo de reservas.** `reservas@lucesysombras.es` es un correo de ejemplo.
   Sustitúyelo en el enlace de contacto, en el pie y en los avisos del formulario.
4. **Redes sociales.** Los iconos del pie apuntan a Instagram y Facebook genéricos.
   Pon las direcciones reales de la compañía.
5. **Apellido de Tori.** En el elenco aparece solo “Tori”; añade el apellido si
   quieres mostrarlo completo.

## Formulario de reservas

El formulario valida los datos y muestra una confirmación, pero **no envía
correos por sí solo**, porque una web estática no tiene backend. Para recibir
las solicitudes tienes varias opciones sencillas:

- [Formspree](https://formspree.io/): cambiar el `action` del formulario.
- [EmailJS](https://www.emailjs.com/): enviar desde JavaScript sin servidor.
- Un pequeño backend propio o el servicio de reservas que uses.

En `js/script.js`, dentro de `setupReservationForm`, está marcado el punto exacto
donde conectar esa llamada (busca el comentario “Punto de integración”).

## Publicarla

Puedes subir la carpeta a cualquier alojamiento estático: Netlify, Vercel,
GitHub Pages, un hosting normal… No hay dependencias que compilar. Solo las
tipografías se cargan desde Google Fonts; si quieres que funcione sin internet,
descarga las fuentes y enlázalas en local.
