import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const getUserTypeText = () => {
    switch (user?.userType) {
      case 'parent':
        return 'Veli';
      case 'teacher':
        return 'Öğretmen';
      case 'institution':
        return 'Kurum';
      default:
        return 'Öğrenci';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="person" size={40} color="#3B82F6" />
        </View>
        <Text style={styles.name}>{user?.profile?.full_name || 'Kullanıcı'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getUserTypeText()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Profil Bilgileri</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="notifications-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Bildirimler</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="lock-closed-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Güvenlik</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ayarlar</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="moon-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Karanlık Mod</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="language-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Dil</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Destek</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="help-circle-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Yardım</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="document-text-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Kullanım Koşulları</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="shield-checkmark-outline" size={24} color="#6B7280" />
          <Text style={styles.menuItemText}>Gizlilik Politikası</Text>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out-outline" size={24} color="#EF4444" />
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versiyon 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
    marginBottom: 40,
  },
});
