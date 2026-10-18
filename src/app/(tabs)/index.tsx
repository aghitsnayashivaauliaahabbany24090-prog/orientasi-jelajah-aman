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
import StatusData from "../../components/StatusData";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import {
  ambilCuacaOfflineFirst,
  BATAS_CACHE_MS,
} from "../../services/cuacaRepository";
import {
  bersihkanCacheLama,
  daftarKotaTersimpan,
} from "../../services/cacheRepository";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import {
  mintaIzinLokasi,
  ambilKoordinatSaatIni,
} from "../../services/locationService";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import {
  HasilCuacaOffline,
  RingkasanKotaTersimpan,
} from "../../types/cache";
import { typeScale, spacing } from "../../constants/styles";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);
  const [kotaTersimpan, setKotaTersimpan] = useState<
    RingkasanKotaTersimpan[]
  >([]);
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

  async function muatKotaTersimpan() {
    try {
      setKotaTersimpan(await daftarKotaTersimpan());
    } catch {
      // Daftar tersimpan bersifat pelengkap, kegagalannya tidak boleh mengganggu
    }
  }

  // Saat aplikasi dibuka: buang cache > 7 hari, lalu tampilkan daftar tersimpan
  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS)
      .then(muatKotaTersimpan)
      .catch(() => {});
  }, []);

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
    setHasil(null);
    setPesanError(null);
    setSedangMemuat(false);
  }

  async function pilihKota(kota: HasilGeocoding, paksaPerbarui = false) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    try {
      const data = await ambilCuacaOfflineFirst(
        {
          id: kota.id,
          nama: kota.name,
          latitude: kota.latitude,
          longitude: kota.longitude,
        },
        { paksaPerbarui },
      );
      if (idSaatIni !== requestIdRef.current) return; // hasil basi, abaikan
      setHasil(data);
      muatKotaTersimpan();
    } catch {
      if (idSaatIni !== requestIdRef.current) return;
      // Data lama dikosongkan supaya tidak tampil di bawah nama kota yang salah
      setHasil(null);
      setPesanError(
        "Belum ada data tersimpan dan tidak ada koneksi internet. Sambungkan internet lalu coba lagi.",
      );
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

        {kotaTersimpan.length > 0 && (
          <View style={{ gap: spacing.kecil }}>
            <Text
              accessibilityRole="header"
              style={{ fontSize: typeScale.subjudul, fontWeight: "600" }}
            >
              Tersimpan di perangkat (bisa dibuka offline)
            </Text>
            {kotaTersimpan.map((k) => (
              <TouchableOpacity
                key={k.kunci}
                onPress={() =>
                  pilihKota({
                    id: k.id,
                    name: k.nama,
                    latitude: k.latitude,
                    longitude: k.longitude,
                    country: "",
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Lihat cuaca kota tersimpan ${k.nama}`}
                style={{
                  padding: spacing.kecil,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#B7E4D4",
                  backgroundColor: "#F4FBF8",
                }}
              >
                <Text style={{ fontSize: typeScale.isi }}>{k.nama}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
              accessibilityLabel="Coba muat ulang data cuaca"
            />
          </View>
        )}

        {hasil && kotaTerpilih && !sedangMemuat && (
          <>
            <StatusData
              sumber={hasil.sumber}
              disimpanPada={hasil.disimpanPada}
            />
            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={hasil.cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(hasil.kualitasUdara.indeksAQI)}
              indeksAQI={hasil.kualitasUdara.indeksAQI}
            />
            <Text style={{ fontSize: typeScale.keterangan, color: "#888" }}>
              Kondisi: {labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)} • Angin{" "}
              {hasil.cuaca.saatIni.kecepatanAngin} km/j
            </Text>
            <Text style={{ fontSize: typeScale.keterangan, color: "#888" }}>
              Hari ini: {hasil.cuaca.harian.suhuMinimal[0]}° -{" "}
              {hasil.cuaca.harian.suhuMaksimal[0]}°
            </Text>
            <Text style={{ fontSize: typeScale.keterangan, color: "#888" }}>
              Partikel halus: PM2.5 {hasil.kualitasUdara.pm25} µg/m³ • PM10{" "}
              {hasil.kualitasUdara.pm10} µg/m³
            </Text>
            <Button
              title="Perbarui Sekarang"
              onPress={() => pilihKota(kotaTerpilih, true)}
              accessibilityLabel="Paksa perbarui data cuaca dari internet"
            />
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

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}
