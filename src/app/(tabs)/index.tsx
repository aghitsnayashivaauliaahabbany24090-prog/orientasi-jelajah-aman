// src/app/(tabs)/index.tsx
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilCuaca } from "../../services/weatherService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";
import { typeScale, spacing } from "../../constants/styles";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(null);
  const [kataKunciSelesaiDicari, setKataKunciSelesaiDicari] = useState<string | null>(
    null
  );
  const [ulanganCari, setUlanganCari] = useState(0);
  const [pesanCari, setPesanCari] = useState<string | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Nomor urut permintaan geocoding, agar respons yang telat tidak menimpa
  // hasil pencarian yang lebih baru.
  const idPermintaan = useRef(0);
  // Nomor urut permintaan cuaca + AQI, mencegah respons kota lama menimpa
  // kota yang baru saja dipilih saat pengguna ganti kota dengan cepat.
  const requestIdRef = useRef(0);

  const teksTertunda = useDebounce(teksCari, 800);

  // Diturunkan, bukan disinkronkan di dalam effect, agar tidak memicu render bertingkat
  const adaKataKunci = teksTertunda.trim().length > 0;
  const hasilTampil = adaKataKunci ? hasilPencarian : [];
  // "Sedang mencari" diturunkan dari dua perbandingan, sehingga tidak perlu
  // setState sinkron di dalam effect. Perbandingan dengan teksCari menutup
  // jeda debounce: selama jeda itu teksTertunda masih kata kunci lama, jadi
  // tanpa ini aplikasi sempat menampilkan "Kota tidak ditemukan" palsu.
  const sedangCariTampil =
    adaKataKunci &&
    (teksCari !== teksTertunda || teksTertunda !== kataKunciSelesaiDicari);
  const errorCariTampil = adaKataKunci && !sedangCariTampil ? pesanCari : null;

  useEffect(() => {
    if (!adaKataKunci) {
      idPermintaan.current++; // batalkan permintaan yang masih berjalan
      return;
    }
    const idIni = ++idPermintaan.current;
    cariKota(teksTertunda)
      .then((data) => {
        if (idIni !== idPermintaan.current) return; // sudah usang
        setHasilPencarian(data);
        setPesanCari(null);
      })
      .catch(() => {
        if (idIni !== idPermintaan.current) return; // sudah usang
        setHasilPencarian([]);
        setPesanCari("Gagal mencari kota. Periksa koneksi internet Anda.");
      })
      .finally(() => {
        if (idIni !== idPermintaan.current) return;
        setKataKunciSelesaiDicari(teksTertunda);
      });
  }, [teksTertunda, adaKataKunci, ulanganCari]);

  // Kota yang sudah dimuat tidak lagi relevan begitu pengguna mengubah kata
  // kuncinya. Kalau tidak dibersihkan di sini, kartu kota sebelumnya tetap
  // tampil (dan daftar hasil sebelumnya masih bisa diklik) sepanjang
  // pencarian baru berjalan.
  function ubahTeksCari(nilaiBaru: string) {
    setTeksCari(nilaiBaru);
    requestIdRef.current++; // batalkan pemuatan cuaca kota yang lama
    setHasilPencarian([]);
    setPesanCari(null);
    setKotaTerpilih(null);
    setCuaca(null);
    setKualitasUdara(null);
    setPesanError(null);
    setSedangMemuat(false);
  }

  async function pilihKota(kota: HasilGeocoding) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    try {
      // Cuaca dan kualitas udara saling independen, jadi dipanggil bersamaan.
      const [dataCuaca, dataAQI] = await Promise.all([
        ambilCuaca(kota.latitude, kota.longitude),
        ambilKualitasUdara(kota.latitude, kota.longitude),
      ]);
      if (idSaatIni !== requestIdRef.current) return; // hasil basi, abaikan
      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);
    } catch {
      if (idSaatIni !== requestIdRef.current) return;
      setCuaca(null);
      setKualitasUdara(null);
      setPesanError("Gagal memuat data cuaca. Periksa koneksi internet Anda.");
    } finally {
      if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: isTablet ? spacing.besar : spacing.sedang,
        gap: spacing.sedang,
      }}
    >
      <SearchBox onCari={ubahTeksCari} />

      {sedangCariTampil && (
        <ActivityIndicator accessibilityLabel="Sedang mencari kota" />
      )}

      {!sedangCariTampil &&
        !errorCariTampil &&
        adaKataKunci &&
        hasilTampil.length === 0 && (
          <Text accessibilityLabel="Kota tidak ditemukan" accessibilityRole="alert">
            Kota tidak ditemukan
          </Text>
        )}

      {errorCariTampil && (
        <View style={{ gap: spacing.kecil }}>
          <Text accessibilityLabel={errorCariTampil} accessibilityRole="alert">
            {errorCariTampil}
          </Text>
          <Button
            title="Coba Lagi"
            onPress={() => setUlanganCari((n) => n + 1)}
            accessibilityLabel="Coba cari kota lagi"
          />
        </View>
      )}

      {hasilTampil.length > 0 && (
        <Text
          accessibilityLabel={`Ditemukan ${hasilTampil.length} kota`}
          accessibilityRole="header"
          style={{ fontSize: typeScale.subjudul, fontWeight: "600" }}
        >
          Ditemukan {hasilTampil.length} kota
        </Text>
      )}

      {hasilTampil.map((kota) => (
        <TouchableOpacity
          key={kota.id}
          onPress={() => pilihKota(kota)}
          accessibilityRole="button"
          accessibilityLabel={`Lihat cuaca kota ${kota.name}`}
          accessibilityHint="Mengambil data cuaca dan kualitas udara untuk kota ini"
          style={{
            padding: spacing.kecil,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#D5DCE3",
          }}
        >
          <Text style={{ fontSize: typeScale.isi }}>{kota.name}</Text>
        </TouchableOpacity>
      ))}

      {sedangMemuat && (
        <ActivityIndicator accessibilityLabel="Sedang memuat data cuaca" />
      )}

      {pesanError && (
        <View style={{ gap: spacing.kecil }}>
          <Text accessibilityLabel={pesanError} accessibilityRole="alert">
            {pesanError}
          </Text>
          <Button
            title="Coba Lagi"
            onPress={() => kotaTerpilih && pilihKota(kotaTerpilih)}
            accessibilityLabel="Coba muat ulang data cuaca"
          />
        </View>
      )}

      {cuaca && kualitasUdara && kotaTerpilih && !sedangMemuat && (
        <>
          <WeatherCard
            kota={kotaTerpilih.name}
            suhu={cuaca.saatIni.suhu}
            tingkatAQI={konversiTingkatAQI(kualitasUdara.indeksAQI)}
            indeksAQI={kualitasUdara.indeksAQI}
          />
          <Text style={{ fontSize: typeScale.keterangan, color: "#888" }}>
            Kondisi: {labelKodeCuaca(cuaca.saatIni.kodeCuaca)} • Angin{" "}
            {cuaca.saatIni.kecepatanAngin} km/j
          </Text>
        </>
      )}

      <AtribusiCuaca />
    </SafeAreaView>
  );
}