// components/SearchBox.tsx
import { useState } from "react";
import { View, TextInput } from "react-native";
import { spacing } from "../constants/styles";

interface SearchBoxProps {
 onCari: (teks: string) => void;
}

export default function SearchBox({ onCari }: SearchBoxProps) {
 const [teks, setTeks] = useState("");

 function handleChange(nilaiBaru: string) {
 setTeks(nilaiBaru);
 onCari(nilaiBaru); // kirim setiap perubahan, debounce diatur di pemanggilnya
 }

 return (
 <View>
 <TextInput
 placeholder="Cari nama kota..."
 value={teks}
 onChangeText={handleChange}
 accessibilityLabel="Cari cuaca untuk kota yang dimasukkan"
 accessibilityHint="Ketik nama kota untuk mencari hasil cuaca"
 style={{
 borderWidth: 1,
 padding: spacing.kecil,
 borderRadius: 8,
 }}
 />
 </View>
 );
}