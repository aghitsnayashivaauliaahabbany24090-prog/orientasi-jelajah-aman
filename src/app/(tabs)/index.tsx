// app/(tabs)/index.tsx
import { useState, useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Button, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { HasilGeocoding } from "../../types/geocoding";
import { spacing } from "../../constants/styles";

export default function HalamanUtama() {
 const [teksCari, setTeksCari] = useState("");
 const [hasil, setHasil] = useState<HasilGeocoding[]>([]);
 const [sedangMemuat, setSedangMemuat] = useState(false);
 const [pesanError, setPesanError] = useState<string | null>(null);
 const { width } = useWindowDimensions();
 const isTablet = width > 768;
 // Menandai permintaan mana yang masih berlaku, agar respons yang telat
 // tidak menimpa hasil pencarian yang lebih baru.
 const idPermintaan = useRef(0);

 const teksTertunda = useDebounce(teksCari, 800);

 // Diturunkan, bukan disinkronkan di dalam effect, agar tidak memicu render bertingkat
 const adaKataKunci = teksTertunda.trim().length > 0;
 const hasilTampil = adaKataKunci ? hasil : [];
 const errorTampil = adaKataKunci ? pesanError : null;
 const sedangMemuatTampil = adaKataKunci && sedangMemuat;

 useEffect(() => {
 if (!adaKataKunci) {
 idPermintaan.current++; // batalkan permintaan yang masih berjalan
 return;
 }
 ambilData(teksTertunda);
 }, [teksTertunda, adaKataKunci]);

 async function ambilData(nama: string) {
 const iniPermintaanSaya = ++idPermintaan.current;
 setSedangMemuat(true);
 setPesanError(null);
 try {
 const data = await cariKota(nama);
 if (iniPermintaanSaya !== idPermintaan.current) return; // sudah usang
 setHasil(data);
 } catch {
 if (iniPermintaanSaya !== idPermintaan.current) return; // sudah usang
 setPesanError("Gagal mengambil data. Periksa koneksi internet Anda.");
 } finally {
 if (iniPermintaanSaya === idPermintaan.current) {
 setSedangMemuat(false);
 }
 }
 }

 return (
 <SafeAreaView
 style={{
 flex: 1,
 padding: isTablet ? spacing.besar : spacing.sedang,
 gap: spacing.sedang,
 }}
 >
 <SearchBox onCari={setTeksCari} />

 {sedangMemuatTampil && <ActivityIndicator />}

 {errorTampil && (
 <View style={{ gap: spacing.kecil }}>
 <Text accessibilityLabel={errorTampil}>{errorTampil}</Text>
 <Button title="Coba Lagi" onPress={() => ambilData(teksTertunda)} />
 </View>
 )}

 {!sedangMemuatTampil &&
 !errorTampil &&
 adaKataKunci &&
 hasilTampil.length === 0 && (
 <Text accessibilityLabel="Kota tidak ditemukan">Kota tidak ditemukan</Text>
 )}

 {hasilTampil.length > 0 && (
 <Text accessibilityLabel={`Ditemukan ${hasilTampil.length} kota`}>
 Ditemukan {hasilTampil.length} kota
 </Text>
 )}

 {hasilTampil.map((kota) => (
 <WeatherCard key={kota.id} kota={kota.name} suhu={29} tingkatAQI="BAIK" />
 ))}
 </SafeAreaView>
 );
}