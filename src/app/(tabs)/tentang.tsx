// app/(tabs)/tentang.tsx
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typeScale, spacing } from "../../../constants/styles";
export default function TabTentang() {
return (
<SafeAreaView style={{ flex: 1, padding: spacing.sedang, gap: spacing.sedang }}>
<Text
accessible
accessibilityLabel="Tentang aplikasi Jelajah Aman"
style={{ fontWeight: "bold", fontSize: typeScale.judul }}
>
Tentang
</Text>
<Text style={{ fontSize: typeScale.isi, lineHeight: 22 }}>
Jelajah Aman adalah aplikasi panduan orientasi yang menampilkan suhu
dan kualitas udara suatu kota agar perjalananmu lebih aman.
</Text>
<Text style={{ fontSize: typeScale.keterangan, color: "#60646C" }}>
Versi 1.0.0
</Text>
</SafeAreaView>
);
}