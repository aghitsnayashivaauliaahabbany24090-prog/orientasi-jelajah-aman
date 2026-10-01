// app/detail/[kota].tsx
import { View, Button } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import WeatherCard from "../../components/WeatherCard";
import { spacing } from "../../constants/styles";

export default function HalamanDetail() {
 const { kota } = useLocalSearchParams<{ kota: string }>();
 return (
 <View style={{ padding: spacing.sedang, gap: spacing.sedang }}>
 <WeatherCard kota={kota} suhu={29} tingkatAQI="BAIK" />
 <Button
 title="Tambahkan ke Favorit"
 onPress={() => router.push("/tambah-favorit")}
 accessibilityLabel={`Tambahkan ${kota} ke daftar favorit`}
 />
 </View>
 );
}