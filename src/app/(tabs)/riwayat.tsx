// app/(tabs)/riwayat.tsx
import { View } from "react-native";
import RiwayatList from "../../components/RiwayatList";
export default function TabRiwayat() {
const daftarKota = ["Pekalongan", "Jakarta", "Semarang"]; // data contoh sementara
return (
<View style={{ padding: 16 }}>
<RiwayatList daftarKota={daftarKota} />
</View>
);
}