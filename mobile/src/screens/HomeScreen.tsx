import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GraduationCap, Target, TrendingUp, Users } from 'lucide-react-native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-6 pt-12 pb-8">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
              <GraduationCap size={40} color="#6366f1" />
            </View>
            <Text className="text-4xl font-bold text-gray-900 text-center mb-3">
              BasariYolu
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              Öğrenci Başarı Takip Sistemi
            </Text>
          </View>

          {/* Description */}
          <View className="bg-indigo-50 rounded-2xl p-6 mb-8">
            <Text className="text-base text-gray-700 text-center leading-6">
              Sınav sonuçlarınızı takip edin, ödevlerinizi yönetin ve başarı
              yolculuğunuzda ilerlemenizi görün
            </Text>
          </View>

          {/* Features */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-6">Özellikler</Text>

            <View className="space-y-4">
              <View className="flex-row items-start mb-4">
                <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4">
                  <Target size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    Sınav Takibi
                  </Text>
                  <Text className="text-base text-gray-600">
                    Sınav sonuçlarınızı kaydedin ve ilerleyişinizi görün
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                  <TrendingUp size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    İlerleme Analizi
                  </Text>
                  <Text className="text-base text-gray-600">
                    Detaylı grafikler ve analizlerle performansınızı takip edin
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-4">
                <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4">
                  <Users size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    Veli Takibi
                  </Text>
                  <Text className="text-base text-gray-600">
                    Veliler öğrenci ilerlemesini anlık takip edebilir
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-4">
            <TouchableOpacity
              className="bg-indigo-600 rounded-xl py-4 px-6 active:bg-indigo-700"
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text className="text-white text-center text-lg font-semibold">
                Giriş Yap
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white border-2 border-indigo-600 rounded-xl py-4 px-6 active:bg-indigo-50"
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text className="text-indigo-600 text-center text-lg font-semibold">
                Kayıt Ol
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 border-t border-gray-200">
          <Text className="text-center text-sm text-gray-500">
            © 2024 BasariYolu. Tüm hakları saklıdır.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
