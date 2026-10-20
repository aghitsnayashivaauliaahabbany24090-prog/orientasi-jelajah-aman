// src/services/riwayatPencarian.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HasilGeocoding } from "../types/geocoding";

const KUNCI_RIWAYAT = "@jelajah_aman:riwayat_pencarian";
const MAKS_RIWAYAT = 10;

export type RiwayatPencarian = HasilGeocoding & { dicariPada: number };

export async function ambilRiwayatPencarian(): Promise<RiwayatPencarian[]> {
  try {
    const json = await AsyncStorage.getItem(KUNCI_RIWAYAT);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function simpanRiwayatPencarian(kota: HasilGeocoding): Promise<void> {
  try {
    const daftar = await ambilRiwayatPencarian();
    // Hapus jika sudah ada dengan id yang sama
    const filtered = daftar.filter((item) => item.id !== kota.id);
    const baru: RiwayatPencarian = { ...kota, dicariPada: Date.now() };
    const daftarBaru = [baru, ...filtered].slice(0, MAKS_RIWAYAT);
    await AsyncStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(daftarBaru));
  } catch {
    // ignore
  }
}

export async function hapusSemuaRiwayat(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KUNCI_RIWAYAT);
  } catch {
    // ignore
  }
}
