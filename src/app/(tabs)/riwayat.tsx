// src/app/(tabs)/riwayat.tsx
import { useState, useCallback } from "react";
import { View, Text, Button, Alert, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import { KotaFavorit } from "../../types/favorit";

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then(setDaftarFavorit);
    }, []),
  );

  async function eksekusiHapus(kota: KotaFavorit) {
    await hapusFavorit(kota.id);
    setDaftarFavorit((prev) => prev.filter((k) => k.id !== kota.id));
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

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Kota Favorit</Text>
      <Text>Tersimpan {daftarFavorit.length} kota</Text>
      {daftarFavorit.length === 0 && <Text>Belum ada kota favorit</Text>}
      {daftarFavorit.map((kota) => (
        <View
          key={kota.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{kota.nama}</Text>
          <Button title="Hapus" onPress={() => konfirmasiHapus(kota)} />
        </View>
      ))}
    </SafeAreaView>
  );
}
