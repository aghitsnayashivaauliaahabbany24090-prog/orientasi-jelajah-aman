// app/(tabs)/tentang.tsx
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typeScale, spacing } from "../../constants/styles";
import { useAppTheme } from "../../contexts/ThemeContext";

export default function TabTentang() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background, padding: spacing.sedang, gap: spacing.sedang }}
    >
      <Text
        accessible
        accessibilityLabel="Tentang aplikasi Jelajah Aman"
        style={{ fontWeight: "bold", fontSize: typeScale.judul, color: colors.text }}
      >
        Tentang
      </Text>
      <Text style={{ fontSize: typeScale.isi, lineHeight: 22, color: colors.text }}>
        Jelajah Aman adalah aplikasi panduan orientasi yang menampilkan suhu dan kualitas udara suatu kota agar perjalananmu lebih aman.
      </Text>
      <Text style={{ fontSize: typeScale.keterangan, color: colors.textSecondary }}>
        Versi 1.0.0
      </Text>
    </SafeAreaView>
  );
}