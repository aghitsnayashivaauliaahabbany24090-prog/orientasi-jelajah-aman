// src/app/(tabs)/riwayat.tsx
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import {
  ambilRiwayatPencarian,
  hapusSemuaRiwayat,
  RiwayatPencarian,
} from "../../services/riwayatPencarian";
import { hapusCacheTersimpan } from "../../services/cacheRepository";
import { KotaFavorit } from "../../types/favorit";
import { typeScale, spacing } from "../../constants/styles";
import { useAppTheme } from "../../contexts/ThemeContext";

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [riwayatPencarian, setRiwayatPencarian] = useState<RiwayatPencarian[]>([]);
  const { colors } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then(setDaftarFavorit);
      ambilRiwayatPencarian().then(setRiwayatPencarian);
    }, []),
  );

  async function eksekusiHapus(kota: KotaFavorit) {
    await hapusFavorit(kota.id);
    setDaftarFavorit((prev) => prev.filter((k) => k.id !== kota.id));
  }

  async function hapusCacheItem(kota: KotaFavorit) {
    const kunci = `${kota.latitude.toFixed(2)},${kota.longitude.toFixed(2)}`;
    try {
      await hapusCacheTersimpan(kunci);
    } catch {
      // ignore
    }
  }

  function konfirmasiHapusCache(kota: KotaFavorit) {
    const pertanyaan = `Hapus cache cuaca untuk ${kota.nama}?`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(pertanyaan)) {
        hapusCacheItem(kota);
      }
      return;
    }
    Alert.alert("Hapus Cache", pertanyaan, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => hapusCacheItem(kota) },
    ]);
  }

  function konfirmasiHapus(kota: KotaFavorit) {
    const pertanyaan = `Yakin hapus ${kota.nama}?`;

    // Alert.alert tidak diimplementasi di react-native-web (stub kosong),
    // jadi di web dipakai confirm bawaan browser agar alur hapus tetap bisa
    // diuji. Di Android dan iOS tetap memakai Alert.alert sesuai modul.
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(pertanyaan)) {
        eksekusiHapus(kota);
      }
      return;
    }

    Alert.alert("Hapus Favorit", pertanyaan, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => eksekusiHapus(kota),
      },
    ]);
  }

  async function hapusRiwayatSemua() {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Hapus seluruh riwayat pencarian?")) {
        await hapusSemuaRiwayat();
        setRiwayatPencarian([]);
      }
      return;
    }
    Alert.alert("Hapus Riwayat", "Hapus seluruh riwayat pencarian?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await hapusSemuaRiwayat();
          setRiwayatPencarian([]);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.sedang, gap: spacing.sedang }}>
      <View style={{ gap: spacing.kecil }}>
        <Text style={{ fontSize: typeScale.subjudul, fontWeight: "bold", color: colors.text }}>Kota Favorit</Text>
        <Text style={{ color: colors.textSecondary }}>Tersimpan {daftarFavorit.length} kota</Text>
        {daftarFavorit.length === 0 && <Text style={{ color: colors.textSecondary }}>Belum ada kota favorit</Text>}
        {daftarFavorit.map((kota) => (
          <View
            key={kota.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: spacing.kecil,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.backgroundElement,
              backgroundColor: colors.backgroundElement,
              gap: spacing.kecil,
            }}
          >
            <Text style={{ fontSize: typeScale.isi, flex: 1, color: colors.text }}>{kota.nama}</Text>
            <Button title="Hapus Cache" onPress={() => konfirmasiHapusCache(kota)} />
            <Button title="Hapus Favorit" onPress={() => konfirmasiHapus(kota)} />
          </View>
        ))}
      </View>

      <View style={{ gap: spacing.kecil }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: typeScale.subjudul, fontWeight: "bold", color: colors.text }}>Riwayat Pencarian Terakhir</Text>
        {riwayatPencarian.length > 0 && (
          <Button title="Hapus Semua" onPress={hapusRiwayatSemua} />
        )}
      </View>
      {riwayatPencarian.length === 0 && <Text style={{ color: colors.textSecondary }}>Belum ada riwayat pencarian</Text>}
        {riwayatPencarian.map((item) => (
          <TouchableOpacity
            key={`${item.id}-${item.dicariPada}`}
            onPress={() => {
              router.navigate("/(tabs)" as any);
              setTimeout(() => {
                router.setParams({
                  kotaCari: item.name,
                  lat: String(item.latitude),
                  lon: String(item.longitude),
                  id: String(item.id),
                } as any);
              }, 100);
            }}
            style={{
              padding: spacing.kecil,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.backgroundSelected,
              backgroundColor: colors.backgroundElement,
            }}
          >
            <Text style={{ fontSize: typeScale.isi, color: colors.text }}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
