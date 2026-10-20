// app/(tabs)/pengaturan.tsx
import { useState } from "react";
import { Text, Button, View, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hapusSemuaCache } from "../../services/cacheRepository";
import { useAppTheme } from "../../contexts/ThemeContext";
import { typeScale, spacing } from "../../constants/styles";

export default function TabPengaturan() {
  const [pesan, setPesan] = useState<string | null>(null);
  const { themeMode, setThemeMode, colors } = useAppTheme();

  async function hapusDataTersimpan() {
    const pertanyaan = "Yakin hapus seluruh cache cuaca tersimpan?";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(pertanyaan)) {
        try {
          await hapusSemuaCache();
          setPesan("Data cuaca tersimpan sudah dihapus.");
        } catch {
          setPesan("Data gagal dihapus. Coba lagi.");
        }
      }
      return;
    }
    Alert.alert("Hapus Cache", pertanyaan, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await hapusSemuaCache();
            setPesan("Data cuaca tersimpan sudah dihapus.");
          } catch {
            setPesan("Data gagal dihapus. Coba lagi.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.sedang, gap: spacing.sedang }}>
      <Text style={{ fontSize: typeScale.subjudul, fontWeight: "bold", color: colors.text }}>Jelajah Aman</Text>
      <Text style={{ fontSize: typeScale.isi, color: colors.textSecondary }}>Versi 1.0.0</Text>

      <View style={{ gap: spacing.kecil }}>
        <Text style={{ fontSize: typeScale.isi, fontWeight: "600", color: colors.text }}>Tema Tampilan</Text>
        <Button
          title={`Terang ${themeMode === "light" ? "(Aktif)" : ""}`}
          onPress={() => setThemeMode("light")}
        />
        <Button
          title={`Gelap ${themeMode === "dark" ? "(Aktif)" : ""}`}
          onPress={() => setThemeMode("dark")}
        />
        <Button
          title={`Ikuti Sistem ${themeMode === "system" ? "(Aktif)" : ""}`}
          onPress={() => setThemeMode("system")}
        />
      </View>

      <View style={{ gap: spacing.kecil }}>
        <Button title="Hapus Data Cuaca Tersimpan" onPress={hapusDataTersimpan} />
        {pesan && <Text accessibilityLabel={pesan}>{pesan}</Text>}
      </View>
    </SafeAreaView>
  );
}
