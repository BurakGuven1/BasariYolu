import React from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { packages } from '../data/packages';
import { PackageCard } from '../components/PackageCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.badge}>Expo</Text>
        <Text style={styles.heading}>Başarı Yolu Mobil</Text>
        <Text style={styles.subtitle}>Paketlerinizi seçin ve deneyin.</Text>
        <View style={styles.actions}>
          {!user ? (
            <Button title="Giriş yap" onPress={() => navigation.navigate('Auth')} />
          ) : (
            <Button title="Panoya git" onPress={() => navigation.navigate('Dashboard')} />
          )}
        </View>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <PackageCard
            item={item}
            onSelect={() => {
              // Payment flow to be integrated; for now navigate to auth if not logged in
              if (!user) {
                navigation.navigate('Auth');
              } else {
                navigation.navigate('Dashboard');
              }
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
  },
  heading: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
  },
  actions: {
    marginTop: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
