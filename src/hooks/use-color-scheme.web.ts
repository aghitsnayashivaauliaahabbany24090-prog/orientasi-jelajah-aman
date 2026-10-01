import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Placeholder: tidak ada store yang perlu didengarkan, kita hanya butuh
// tahu apakah render sudah terjadi di sisi klien (hydrated).
const subscribe = () => () => {};
const sudahHydrate = () => true;
const belumHydrate = () => false;

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const hasHydrated = useSyncExternalStore(subscribe, sudahHydrate, belumHydrate);

  return hasHydrated ? colorScheme : 'light';
}