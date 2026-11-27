import L from "leaflet";

const createPinIcon = (color) =>
  L.divIcon({
    className: "avonex-map-marker-icon",
    html: `<svg class="avonex-map-marker-svg" xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2C10.1 2 2 10.1 2 20c0 13 18 26 18 26s18-13 18-26C38 10.1 29.9 2 20 2Z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="20" cy="20" r="9" fill="#fff"/><circle cx="20" cy="20" r="4" fill="${color}"/></svg>`,
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
  });

export const pickupIcon = createPinIcon("#188653");
export const destinationIcon = createPinIcon("#d63f3f");
export const driverIcon = createPinIcon("#1673d1");
export const selectedLocationIcon = createPinIcon("#dc8a10");
