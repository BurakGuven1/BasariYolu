import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as RNIap from 'react-native-iap';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

// Google Play Console'dan alacağınız product ID'ler
const productIds = [
  'basariyolu_basic_monthly',
  'basariyolu_basic_yearly',
  'basariyolu_premium_monthly',
  'basariyolu_premium_yearly',
];

export default function SubscriptionScreen({ navigation }: Props) {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    initIAP();

    return () => {
      RNIap.endConnection();
    };
  }, []);

  const initIAP = async () => {
    try {
      await RNIap.initConnection();
      const products = await RNIap.getProducts({ skus: productIds });
      setProducts(products);
    } catch (error) {
      console.error('IAP initialization error:', error);
      Alert.alert('Hata', 'Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    setPurchasing(true);
    try {
      await RNIap.requestPurchase({ sku: productId });

      // Purchase başarılı, backend'e bildir
      Alert.alert(
        'Başarılı',
        'Satın alma işlemi tamamlandı! Aboneliğiniz aktif.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Purchase error:', error);
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert('Hata', 'Satın alma başarısız oldu');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const getProductPrice = (productId: string) => {
    const product = products.find((p) => p.productId === productId);
    return product?.localizedPrice || '...';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium'a Geç</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tax Advantage Banner */}
        <View style={styles.taxBanner}>
          <Text style={styles.taxBannerIcon}>🎉</Text>
          <View style={styles.taxBannerContent}>
            <Text style={styles.taxBannerTitle}>
              Mobil uygulama özel avantajı!
            </Text>
            <Text style={styles.taxBannerText}>
              Mobil uygulama üzerinden yapılan ödemelerde %15 vergi avantajı
            </Text>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Paketler</Text>

          {/* Basic Monthly */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Temel</Text>
              <Text style={styles.planBadge}>Aylık</Text>
            </View>
            <Text style={styles.planPrice}>
              {getProductPrice('basariyolu_basic_monthly')}/ay
            </Text>
            <View style={styles.planFeatures}>
              <Text style={styles.planFeature}>✓ Temel soru çözümü</Text>
              <Text style={styles.planFeature}>✓ İstatistikler</Text>
              <Text style={styles.planFeature}>✓ Pomodoro timer</Text>
            </View>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={() => handlePurchase('basariyolu_basic_monthly')}
              disabled={purchasing}
            >
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'İşleniyor...' : 'Satın Al'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Basic Yearly */}
          <View style={[styles.planCard, styles.popularPlan]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>EN POPÜLEr</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Temel</Text>
              <Text style={styles.planBadge}>Yıllık</Text>
            </View>
            <Text style={styles.planPrice}>
              {getProductPrice('basariyolu_basic_yearly')}/yıl
            </Text>
            <Text style={styles.planSaving}>2 ay ücretsiz!</Text>
            <View style={styles.planFeatures}>
              <Text style={styles.planFeature}>✓ Tüm Temel özellikler</Text>
              <Text style={styles.planFeature}>✓ %15 vergi avantajı</Text>
            </View>
            <TouchableOpacity
              style={[styles.purchaseButton, styles.purchaseButtonPrimary]}
              onPress={() => handlePurchase('basariyolu_basic_yearly')}
              disabled={purchasing}
            >
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'İşleniyor...' : 'Satın Al'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Monthly */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Premium</Text>
              <Text style={styles.planBadge}>Aylık</Text>
            </View>
            <Text style={styles.planPrice}>
              {getProductPrice('basariyolu_premium_monthly')}/ay
            </Text>
            <View style={styles.planFeatures}>
              <Text style={styles.planFeature}>✓ Tüm Temel özellikler</Text>
              <Text style={styles.planFeature}>✓ AI destekli analiz</Text>
              <Text style={styles.planFeature}>✓ Kişisel mentorluk</Text>
              <Text style={styles.planFeature}>✓ Sınırsız soru çözümü</Text>
            </View>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={() => handlePurchase('basariyolu_premium_monthly')}
              disabled={purchasing}
            >
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'İşleniyor...' : 'Satın Al'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Yearly */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Premium</Text>
              <Text style={styles.planBadge}>Yıllık</Text>
            </View>
            <Text style={styles.planPrice}>
              {getProductPrice('basariyolu_premium_yearly')}/yıl
            </Text>
            <Text style={styles.planSaving}>2 ay ücretsiz!</Text>
            <View style={styles.planFeatures}>
              <Text style={styles.planFeature}>✓ Tüm Premium özellikler</Text>
              <Text style={styles.planFeature}>✓ %15 vergi avantajı</Text>
              <Text style={styles.planFeature}>✓ Öncelikli destek</Text>
            </View>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={() => handlePurchase('basariyolu_premium_yearly')}
              disabled={purchasing}
            >
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'İşleniyor...' : 'Satın Al'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            • Abonelikler otomatik yenilenir
          </Text>
          <Text style={styles.infoText}>
            • İptal için Google Play Store'dan yönetin
          </Text>
          <Text style={styles.infoText}>
            • 7 gün ücretsiz deneme
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#1f2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  taxBanner: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  taxBannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  taxBannerContent: {
    flex: 1,
  },
  taxBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  taxBannerText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  plansSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  popularPlan: {
    borderColor: '#3b82f6',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  planBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  planSaving: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 12,
  },
  planFeatures: {
    marginBottom: 16,
  },
  planFeature: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  purchaseButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  purchaseButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
});
