// src/app/(tabs)/index.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilCuaca } from "../../services/weatherService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import {
  mintaIzinLokasi,
  ambilKoordinatSaatIni,
} from "../../services/locationService";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";
import { typeScale, spacing } from "../../constants/styles";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [cuaca, setCuaca] = useState<DataCuacaLengkap | null>(null);
  const [kualitasUdara, setKualitasUdara] = useState<DataKualitasUdara | null>(
    null,
  );
  const [kataKunciSelesaiDicari, setKataKunciSelesaiDicari] = useState<
    string | null
  >(null);
  const [ulanganCari, setUlanganCari] = useState(0);
  const [pesanCari, setPesanCari] = useState<string | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [daftarIdFavorit, setDaftarIdFavorit] = useState<number[]>([]);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const idPermintaan = useRef(0);
  const requestIdRef = useRef(0);

  const teksTertunda = useDebounce(teksCari, 800);

  const adaKataKunci = teksTertunda.trim().length > 0;
  const hasilTampil = adaKataKunci ? hasilPencarian : [];
  const sedangCariTampil =
    adaKataKunci &&
    (teksCari !== teksTertunda || teksTertunda !== kataKunciSelesaiDicari);
  const errorCariTampil = adaKataKunci && !sedangCariTampil ? pesanCari : null;

  // Daftar id favorit dimuat ulang setiap kali tab ini difokuskan, karena
  // favorit bisa ditambah atau dihapus lewat modal dan tab Riwayat. Tanpa ini
  // tombol "Tambahkan ke Favorit" masih tampil untuk kota yang sudah tersimpan.
  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then((daftar) =>
        setDaftarIdFavorit(daftar.map((k) => k.id)),
      );
    }, []),
  );

  const kotaSudahFavorit =
    kotaTerpilih !== null && daftarIdFavorit.includes(kotaTerpilih.id);

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

  async function gunakanLokasiSaatIni() {
    const status = await mintaIzinLokasi();
    if (status === "denied") {
      setPesanLokasi(
        "Izin lokasi ditolak. Silakan cari kota secara manual di atas.",
      );
      return;
    }
    if (status === "unavailable") {
      setPesanLokasi(
        "Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual.",
      );
      return;
    }
    setPesanLokasi(null);
    const koordinat = await ambilKoordinatSaatIni();
    // id: -1 menandai ini lokasi GPS, bukan hasil pencarian kota, dan country
    // dikosongkan karena tidak relevan untuk koordinat mentah.
    pilihKota({
      id: -1,
      name: "Lokasi Saat Ini",
      latitude: koordinat.latitude,
      longitude: koordinat.longitude,
      country: "",
    });
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: isTablet ? spacing.besar : spacing.sedang,
      }}
    >
      <ScrollView
        contentContainerStyle={{ gap: spacing.sedang }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBox onCari={ubahTeksCari} />

        <Button
          title="Gunakan Lokasi Saat Ini"
          onPress={gunakanLokasiSaatIni}
        />

        {pesanLokasi && <Text>{pesanLokasi}</Text>}

        {sedangCariTampil && (
          <ActivityIndicator accessibilityLabel="Sedang mencari kota" />
        )}

        {!sedangCariTampil &&
          !errorCariTampil &&
          adaKataKunci &&
          hasilTampil.length === 0 && (
            <Text
              accessibilityLabel="Kota tidak ditemukan"
              accessibilityRole="alert"
            >
              Kota tidak ditemukan
            </Text>
          )}

        {errorCariTampil && (
          <View style={{ gap: spacing.kecil }}>
            <Text
              accessibilityLabel={errorCariTampil}
              accessibilityRole="alert"
            >
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
            <Text style={{ fontSize: typeScale.keterangan, color: "#888" }}>
              Hari ini: {cuaca.harian.suhuMinimal[0]}° -{" "}
              {cuaca.harian.suhuMaksimal[0]}°
            </Text>
            {!kotaSudahFavorit && (
              <Button
                title="Tambahkan ke Favorit"
                onPress={() =>
                  router.push({
                    pathname: "/tambah-favorit",
                    params: {
                      id: String(kotaTerpilih.id),
                      nama: kotaTerpilih.name,
                      lat: String(kotaTerpilih.latitude),
                      lon: String(kotaTerpilih.longitude),
                    },
                  })
                }
              />
            )}
          </>
        )}

        {kualitasUdara && (
          <Text style={{ fontSize: typeScale.keterangan, color: "#888" }}>
            Partikel halus: PM2.5 {kualitasUdara.pm25} µg/m³ • PM10{" "}
            {kualitasUdara.pm10} µg/m³
          </Text>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}
