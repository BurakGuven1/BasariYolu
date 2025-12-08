import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { iapService } from '../services/iapService';
import { Product } from 'react-native-iap';
import {
  PACKAGE_INFO,
  PackageInfo,
  PackageLevel,
  PackageDuration,
  getProductId,
} from '../constants/iapProducts';
import { Button } from '../components/ui/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'PackageSelection'>;

export function PackageSelectionScreen({ navigation, route }: Props) {
  const { userId, userEmail } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<PackageLevel>('advanced');
  const [selectedDuration, setSelectedDuration] = useState<PackageDuration>('yearly');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    initializeIAP();
  }, []);

  const initializeIAP = async () => {
    try {
      setLoading(true);
      await iapService.initialize();
      const loadedProducts = iapService.getProducts();
      setProducts(loadedProducts);
      console.log(`✅ Loaded ${loadedProducts.length} products from store`);
    } catch (error: any) {
      console.error('❌ IAP initialization failed:', error);
      Alert.alert(
        'Hata',
        'Paket bilgileri yüklenemedi. Lütfen internet bağlantınızı kontrol edin.',
        [{ text: 'Tekrar Dene', onPress: initializeIAP }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);

      // Get product ID
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const productId = getProductId(platform, selectedLevel, selectedDuration);

      // Find product in loaded products
      const product = products.find((p) => p.productId === productId);
      if (!product) {
        Alert.alert('Hata', 'Seçili paket bulunamadı. Lütfen tekrar deneyin.');
        return;
      }

      // Start purchase
      const result = await iapService.purchasePackage(productId, 1);

      if (result.success) {
        Alert.alert(
          '✅ Satın Alma Başarılı',
          'Paketiniz başarıyla aktive edildi!',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Navigate to appropriate dashboard
                navigation.replace('Student');
              },
            },
          ]
        );
      } else {
        Alert.alert('Hata', result.error || 'Satın alma tamamlanamadı');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Hata', error.message || 'Satın alma sırasında bir hata oluştu');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const purchases = await iapService.restorePurchases();

      if (purchases.length > 0) {
        Alert.alert(
          '✅ Başarılı',
          `${purchases.length} adet satın alma geri yüklendi.`,
          [{ text: 'Tamam', onPress: () => navigation.replace('Student') }]
        );
      } else {
        Alert.alert('Bilgi', 'Geri yüklenecek satın alma bulunamadı.');
      }
    } catch (error: any) {
      Alert.alert('Hata', 'Satın almalar geri yüklenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPackageInfo = (): PackageInfo | undefined => {
    return PACKAGE_INFO.find(
      (pkg) => pkg.level === selectedLevel && pkg.duration === selectedDuration
    );
  };

  const getProductPrice = (level: PackageLevel, duration: PackageDuration): string => {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const productId = getProductId(platform, level, duration);
    const product = products.find((p) => p.productId === productId);

    if (product) {
      // Return store price (formatted by store)
      return product.localizedPrice;
    }

    // Fallback to base price from constants
    const packageInfo = PACKAGE_INFO.find((p) => p.level === level && p.duration === duration);
    return packageInfo ? `₺${packageInfo.base_price}` : '...';
  };

  const selectedPackage = getSelectedPackageInfo();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Paketler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paket Seçimi</Text>
          <Text style={styles.headerSubtitle}>
            Size en uygun paketi seçin ve öğrenme yolculuğunuza başlayın
          </Text>
        </View>

        {/* Level Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Seviye Seçin</Text>
          <View style={styles.levelButtons}>
            {(['basic', 'advanced', 'professional'] as PackageLevel[]).map((level) => {
              const isSelected = selectedLevel === level;
              const label =
                level === 'basic' ? 'Temel' : level === 'advanced' ? 'Gelişmiş' : 'Profesyonel';
              const isPopular = level === 'advanced';

              return (
                <Pressable
                  key={level}
                  style={[styles.levelButton, isSelected && styles.levelButtonSelected]}
                  onPress={() => setSelectedLevel(level)}
                >
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>EN POPÜLER</Text>
                    </View>
                  )}
                  <Text style={[styles.levelButtonText, isSelected && styles.levelButtonTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Süre Seçin</Text>
          <View style={styles.durationButtons}>
            {(['monthly', '6months', 'yearly'] as PackageDuration[]).map((duration) => {
              const isSelected = selectedDuration === duration;
              const label = duration === 'monthly' ? 'Aylık' : duration === '6months' ? '6 Aylık' : 'Yıllık';
              const packageInfo = PACKAGE_INFO.find(
                (p) => p.level === selectedLevel && p.duration === duration
              );
              const discount = packageInfo?.discount_percent || 0;

              return (
                <Pressable
                  key={duration}
                  style={[styles.durationButton, isSelected && styles.durationButtonSelected]}
                  onPress={() => setSelectedDuration(duration)}
                >
                  <View style={styles.durationButtonContent}>
                    <Text style={[styles.durationLabel, isSelected && styles.durationLabelSelected]}>
                      {label}
                    </Text>
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>%{discount} İNDİRİM</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.durationPrice, isSelected && styles.durationPriceSelected]}>
                    {getProductPrice(selectedLevel, duration)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Package Details */}
        {selectedPackage && (
          <View style={styles.packageDetails}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{selectedPackage.name}</Text>
              {selectedPackage.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>✨ ÖNERİLEN</Text>
                </View>
              )}
            </View>

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Toplam Fiyat</Text>
              <Text style={styles.priceValue}>{getProductPrice(selectedLevel, selectedDuration)}</Text>
              {selectedPackage.duration_months > 1 && (
                <Text style={styles.pricePerMonth}>
                  (Aylık ~₺{Math.round(selectedPackage.base_price / selectedPackage.duration_months)})
                </Text>
              )}
            </View>

            <View style={styles.featuresBox}>
              <Text style={styles.featuresTitle}>✅ Paket Özellikleri</Text>
              {selectedPackage.features.map((feature, idx) => (
                <Text key={idx} style={styles.featureItem}>
                  • {feature}
                </Text>
              ))}
            </View>

            <View style={styles.limitsBox}>
              <Text style={styles.limitsTitle}>📊 Limitler</Text>
              <Text style={styles.limitItem}>• Sınıf: {selectedPackage.limits.maxClasses === 999999 ? 'Sınırsız' : selectedPackage.limits.maxClasses}</Text>
              <Text style={styles.limitItem}>
                • Sınıf başına öğrenci: {selectedPackage.limits.maxStudentsPerClass === 999999 ? 'Sınırsız' : selectedPackage.limits.maxStudentsPerClass}
              </Text>
              <Text style={styles.limitItem}>• Depolama: {selectedPackage.limits.storage}</Text>
              <Text style={styles.limitItem}>• Destek: {selectedPackage.limits.support}</Text>
            </View>
          </View>
        )}

        {/* Purchase Button */}
        <View style={styles.actionButtons}>
          <Button
            title={purchasing ? 'İşleniyor...' : '🛒 Paketi Satın Al'}
            onPress={handlePurchase}
            disabled={purchasing || loading}
            style={styles.purchaseButton}
          />

          <Pressable onPress={handleRestore} style={styles.restoreButton}>
            <Text style={styles.restoreButtonText}>Satın Alımları Geri Yükle</Text>
          </Pressable>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            • Abonelikler otomatik olarak yenilenir{'\n'}
            • İstediğiniz zaman iptal edebilirsiniz{'\n'}
            • 3 gün yetkisiz kullanım süresi{'\n'}
            • Tüm özellikler web tarayıcıda kullanılabilir
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  levelButtons: {
    gap: 12,
  },
  levelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    overflow: 'visible',
  },
  levelButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  levelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  levelButtonTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  durationButtons: {
    gap: 12,
  },
  durationButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  durationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  durationLabelSelected: {
    color: '#10B981',
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  durationPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  durationPriceSelected: {
    color: '#10B981',
  },
  packageDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2563EB',
    gap: 20,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  recommendedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recommendedText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
  },
  priceBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  pricePerMonth: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  featuresBox: {
    gap: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureItem: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  limitsBox: {
    gap: 6,
  },
  limitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  limitItem: {
    fontSize: 13,
    color: '#64748B',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: '#2563EB',
  },
  restoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
