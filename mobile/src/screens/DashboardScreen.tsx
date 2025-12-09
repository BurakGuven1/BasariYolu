import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hoş geldin 👋</Text>
        <Text style={styles.subtitle}>{user?.email ?? 'Bilinmeyen kullanıcı'}</Text>
        <Text style={styles.helper}>
          Burada öğrenciler/veliler için Supabase’den gelen veri, istatistikler ve AI özellikleri
          gösterilecek. Şimdilik hızlı çıkış butonu ekledik.
        </Text>
        <Button title="Çıkış yap" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E16',
    padding: 20,
  },
  card: {
    backgroundColor: '#111626',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1F2A44',
  },
  title: {
    color: '#E5ECFF',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9EF0A1',
    fontSize: 14,
  },
  helper: {
    color: '#A8B6D9',
    fontSize: 14,
    lineHeight: 20,
  },
});
