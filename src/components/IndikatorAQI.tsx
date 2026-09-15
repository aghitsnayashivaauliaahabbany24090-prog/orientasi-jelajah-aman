// components/IndikatorAQI.tsx
import { View, Text } from "react-native";
import { LaporanUdara } from "../../types/cuaca";

export default function IndikatorAQI({ laporan }: { laporan: LaporanUdara }) {
  const warnaTingkat: Record<LaporanUdara["tingkat"], string> = {
    BAIK: "#1B8B3A",
    SEDANG: "#E8860D",
    TIDAK_SEHAT: "#D93025",
    BERBAHAYA: "#7B1FA2",
  };

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#F4F7FA",
        borderLeftWidth: 4,
        borderLeftColor: warnaTingkat[laporan.tingkat],
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 12, color: "#60646C" }}>Indikator Kualitas Udara</Text>
      <Text style={{ fontWeight: "bold", fontSize: 16, color: warnaTingkat[laporan.tingkat] }}>
        {laporan.kota}: {laporan.tingkat}
      </Text>
      <Text style={{ fontSize: 14, color: "#60646C" }}>
        Indeks AQI: {laporan.indeksAQI}
        {laporan.diperbaruiPada ? ` (Diperbarui: ${laporan.diperbaruiPada})` : ""}
      </Text>
    </View>
  );
}