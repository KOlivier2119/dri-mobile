/**
 * Kigali pick-up / drop-off points. The API prices from coordinates and has no
 * place search yet, so customers choose from this list (or their GPS
 * position). Coordinates are neighbourhood centres, WGS84.
 */
export type Place = { name: string; area: string; lng: number; lat: number };

export const KIGALI_PLACES: Place[] = [
  { name: 'Kigali Convention Centre', area: 'Kimihurura', lng: 30.0934, lat: -1.9545 },
  { name: 'Kigali Heights', area: 'Kimihurura', lng: 30.0927, lat: -1.9531 },
  { name: 'Kacyiru', area: 'Gasabo', lng: 30.0619, lat: -1.9441 },
  { name: 'Kimihurura', area: 'Gasabo', lng: 30.0878, lat: -1.9566 },
  { name: 'Nyarutarama', area: 'Gasabo', lng: 30.1003, lat: -1.9356 },
  { name: 'Kibagabaga', area: 'Gasabo', lng: 30.1145, lat: -1.9312 },
  { name: 'Kimironko Market', area: 'Gasabo', lng: 30.1255, lat: -1.9493 },
  { name: 'Remera', area: 'Gasabo', lng: 30.1110, lat: -1.9573 },
  { name: 'Amahoro Stadium', area: 'Remera', lng: 30.1166, lat: -1.9556 },
  { name: 'Kigali International Airport', area: 'Kanombe', lng: 30.1395, lat: -1.9686 },
  { name: 'Kicukiro Centre', area: 'Kicukiro', lng: 30.1036, lat: -1.9877 },
  { name: 'Gikondo', area: 'Kicukiro', lng: 30.0757, lat: -1.9752 },
  { name: 'Kigali City Tower', area: 'Nyarugenge', lng: 30.0606, lat: -1.9441 },
  { name: 'Downtown (CBD)', area: 'Nyarugenge', lng: 30.0588, lat: -1.9466 },
  { name: 'Nyamirambo', area: 'Nyarugenge', lng: 30.0444, lat: -1.9776 },
  { name: 'Kiyovu', area: 'Nyarugenge', lng: 30.0637, lat: -1.9520 },
  { name: 'Gisozi', area: 'Gasabo', lng: 30.0700, lat: -1.9195 },
  { name: 'Kinyinya', area: 'Gasabo', lng: 30.0950, lat: -1.9180 },
  { name: 'Rebero', area: 'Kicukiro', lng: 30.0750, lat: -2.0000 },
  { name: 'Nyabugogo', area: 'Nyarugenge', lng: 30.0442, lat: -1.9381 },
];
