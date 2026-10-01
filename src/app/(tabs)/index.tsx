// app/(tabs)/index.tsx
import { useState, useEffect } from "react";
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

 const teksTertunda = useDebounce(teksCari, 500);

 useEffect(() => {
 if (teksTertunda.trim().length === 0) {
 setHasil([]);
 setPesanError(null);
 return;
 }
 ambilData(teksTertunda);
 }, [teksTertunda]);

 async function ambilData(nama: string) {
 setSedangMemuat(true);
 setPesanError(null);
 try {
 const data = await cariKota(nama);
 setHasil(data);
 } catch {
 setPesanError("Gagal mengambil data. Periksa koneksi internet Anda.");
 } finally {
 setSedangMemuat(false);
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

 {sedangMemuat && <ActivityIndicator />}

 {pesanError && (
 <View style={{ gap: spacing.kecil }}>
 <Text>{pesanError}</Text>
 <Button title="Coba Lagi" onPress={() => ambilData(teksTertunda)} />
 </View>
 )}

 {!sedangMemuat &&
 !pesanError &&
 teksTertunda.trim().length > 0 &&
 hasil.length === 0 && <Text>Kota tidak ditemukan</Text>}

 {hasil.map((kota) => (
 <WeatherCard key={kota.id} kota={kota.name} suhu={29} tingkatAQI="BAIK" />
 ))}
 </SafeAreaView>
 );
}