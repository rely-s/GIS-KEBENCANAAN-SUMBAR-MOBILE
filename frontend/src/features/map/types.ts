/**
 * Tipe data dan antarmuka geospasial untuk modul Peta (Map Feature)
 * GIS Kebencanaan Sumatera Barat - BPBD Prov. Sumbar & LPPM UPI "YPTK" Padang
 */

export interface LayerVisibilityState {
  choropleth: boolean;
  poskoEvakuasi: boolean;
  shelterTes: boolean;
  jalanTerputus: boolean;
  gempa: boolean;
  cuaca: boolean;
  sesarSemangko?: boolean;
  sesarBuffer?: boolean;
  megathrust?: boolean;
  zonaTsunami?: boolean;
  tsunamiRunup?: boolean;
}
