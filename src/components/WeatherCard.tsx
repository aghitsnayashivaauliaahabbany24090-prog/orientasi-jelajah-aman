// components/WeatherCard.tsx
import { View, Text } from "react-native";
import { WeatherCardProps } from "../../types/cuaca";
// 1. Tambahkan baris import ini untuk memanggil variabel dari styles.ts
import { typeScale, spacing } from "../../constants/styles";
export default function WeatherCard({ kota, suhu, tingkatAQI }: WeatherCardProps) {
const warnaAQI = tingkatAQI === "BAIK" ? "green" : "orange";
return (
// 2. Ganti angka padding menjadi spacing.sedang
<View
accessible
accessibilityLabel={`Cuaca ${kota}, suhu ${suhu} derajat, kualitas udara
${tingkatAQI}`}
style={{ padding: spacing.sedang, borderRadius: 8, backgroundColor: "#F4F7FA" }}
>
{/* isi WeatherCard tetap seperti sebelumnya */}
</View>
);
}