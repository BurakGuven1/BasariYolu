import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import {
  Product,
  ProductPurchase,
  PurchaseError,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { supabase } from '../lib/supabase';
import { getAllProductIds } from '../constants/iapProducts';

export class IAPService {
  private static instance: IAPService;
  private products: Product[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * IAP sistemini başlat
   */
  async initialize(): Promise<void> {
    try {
      // Connection kurulumu
      await RNIap.initConnection();

      // Platform belirleme
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const productIds = getAllProductIds(platform);

      // Ürünleri yükle
      if (Platform.OS === 'android') {
        this.products = await RNIap.getProducts({ skus: productIds });
      } else {
        this.products = await RNIap.getProducts({ skus: productIds });
      }

      // Satın alma listener'ları
      this.setupPurchaseListeners();

      // iOS için pending transactions'ları temizle
      if (Platform.OS === 'ios') {
        await this.clearPendingTransactions();
      }
    } catch (error) {
      console.error('❌ IAP initialization failed:', error);
      throw error;
    }
  }

  /**
   * Satın alma listener'larını kur
   */
  private setupPurchaseListeners(): void {
    // Satın alma başarılı olduğunda
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: ProductPurchase) => {

        try {
          // Receipt'i backend'e gönder ve doğrula
          const isValid = await this.validatePurchase(purchase);

          if (isValid) {
            // Satın alma başarılı, finish et
            await RNIap.finishTransaction({ purchase, isConsumable: false });
          } else {
            console.error('❌ Purchase validation failed');
          }
        } catch (error) {
          console.error('❌ Error processing purchase:', error);
        }
      }
    );

    // Satın alma hatası olduğunda
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('❌ Purchase error:', error);
      }
    );
  }

  /**
   * Pending transactions'ları temizle (iOS)
   */
  private async clearPendingTransactions(): Promise<void> {
    try {
      const availablePurchases = await RNIap.getAvailablePurchases();

      for (const purchase of availablePurchases) {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      }

    } catch (error) {
      console.error('❌ Error clearing pending transactions:', error);
    }
  }

  /**
   * Ürünleri getir
   */
  getProducts(): Product[] {
    return this.products;
  }

  /**
   * Belirli bir ürünü getir
   */
  getProduct(productId: string): Product | undefined {
    return this.products.find((p) => p.productId === productId);
  }

  /**
   * Satın alma işlemi başlat
   */
  async purchasePackage(
    productId: string,
    studentCount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Ürünü kontrol et
      const product = this.getProduct(productId);
      if (!product) {
        return { success: false, error: 'Ürün bulunamadı' };
      }

      // Satın alma başlat
      await RNIap.requestPurchase({ sku: productId });

      // Listener otomatik olarak handle edecek
      return { success: true };
    } catch (error: any) {
      console.error('❌ Purchase request failed:', error);
      return {
        success: false,
        error: error.message || 'Satın alma başlatılamadı',
      };
    }
  }

  /**
   * Satın almayı backend'de doğrula
   */
  private async validatePurchase(purchase: ProductPurchase): Promise<boolean> {
    try {

      // Backend'e receipt gönder
      const { data, error } = await supabase.functions.invoke('validate-iap-purchase', {
        body: {
          platform: Platform.OS,
          productId: purchase.productId,
          transactionReceipt: purchase.transactionReceipt,
          transactionId: purchase.transactionId,
        },
      });

      if (error) {
        console.error('❌ Backend validation error:', error);
        return false;
      }
      return data.valid === true;
    } catch (error) {
      console.error('❌ Error validating purchase:', error);
      return false;
    }
  }

  /**
   * Restore purchases (iOS için önemli)
   */
  async restorePurchases(): Promise<ProductPurchase[]> {
    try {

      const purchases = await RNIap.getAvailablePurchases();
      return purchases;
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      return [];
    }
  }

  /**
   * IAP connection'ı kapat
   */
  async disconnect(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
      }
      await RNIap.endConnection();
    } catch (error) {
      console.error('❌ Error disconnecting IAP:', error);
    }
  }
}

export const iapService = IAPService.getInstance();
