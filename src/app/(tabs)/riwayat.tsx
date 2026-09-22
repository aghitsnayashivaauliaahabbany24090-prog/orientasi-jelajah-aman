// app/(tabs)/riwayat.tsx (ganti <View> terluar menjadi <SafeAreaView>)
import { SafeAreaView } from "react-native-safe-area-context";
import RiwayatList from "../../components/RiwayatList";
export default function TabRiwayat() {
const daftarKota = ["Pekalongan", "Jakarta", "Semarang"];
return (
<SafeAreaView style={{ flex: 1, padding: 16 }}>
<RiwayatList daftarKota={daftarKota} />
</SafeAreaView>
);
}