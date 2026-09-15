// app/index.tsx
import { Platform, View } from "react-native";
import { useState, useEffect } from "react";
// Catatan: gunakan ../components/ jika file berada di dalam folder app/
// yang sejajar dengan folder components/
import WeatherCard from "../components/WeatherCard";
import SearchBox from "../components/SearchBox";
import RiwayatList from "../components/RiwayatList";
import IndikatorAQI from "../components/IndikatorAQI";
export default function HalamanUtama() {
const [kotaAktif, setKotaAktif] = useState("Pekalongan");
const [riwayat, setRiwayat] = useState<string[]>(["Pekalongan"]);
// Tambahkan useEffect untuk mencatat perubahan kota aktif
useEffect(() => {
console.log("Kota aktif berubah menjadi:", kotaAktif);
}, [kotaAktif]);
function handleCari(kota: string) {
setKotaAktif(kota);
if (!riwayat.includes(kota)) {
setRiwayat([...riwayat, kota]);
}
}
const paddingTop = Platform.OS === "web" ? 80 : 16;
return (
<View style={{ padding: 16, gap: 16, paddingTop }}>
<SearchBox onCari={handleCari} />
<WeatherCard kota={kotaAktif} suhu={29} tingkatAQI="BAIK" />
<IndikatorAQI laporan={{ kota: kotaAktif, indeksAQI: 50, tingkat: "BAIK" }} />
<RiwayatList daftarKota={riwayat} />
</View>
);
}