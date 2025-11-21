import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ExamsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sınavlarım</Text>
        <Text style={styles.subtitle}>Tüm sınav sonuçlarınız</Text>
      </View>

      <TouchableOpacity style={styles.addButton}>
        <Icon name="add-circle" size={24} color="#3B82F6" />
        <Text style={styles.addButtonText}>Yeni Sınav Ekle</Text>
      </TouchableOpacity>

      <View style={styles.comingSoon}>
        <Icon name="construct-outline" size={60} color="#9CA3AF" />
        <Text style={styles.comingSoonText}>Sınav yönetimi yakında!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});
