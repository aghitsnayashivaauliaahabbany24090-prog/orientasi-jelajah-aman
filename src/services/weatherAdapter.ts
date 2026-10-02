// src/services/weatherAdapter.ts
import { TingkatAQI } from "../types/cuaca";

// Satu-satunya tempat yang menerjemahkan angka european_aqi dari Open-Meteo
// menjadi kategori teks. Bila someday sumber AQI diganti ke skala lain,
// cukup ubah fungsi ini tanpa menyentuh komponen lain.
export function konversiTingkatAQI(indeksEropa: number): TingkatAQI {
  if (indeksEropa <= 20) return "BAIK";
  if (indeksEropa <= 40) return "SEDANG";
  if (indeksEropa <= 60) return "TIDAK_SEHAT";
  return "BERBAHAYA";
}