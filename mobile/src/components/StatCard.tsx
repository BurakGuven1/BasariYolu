import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = '#3B82F6',
  valueColor = '#3B82F6',
}: StatCardProps) {
  return (
    <View className="bg-white rounded-lg p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-gray-600 text-sm mb-1">{title}</Text>
          <Text
            className="text-2xl font-bold mb-1"
            style={{ color: valueColor }}
          >
            {value}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-500">{subtitle}</Text>
          )}
        </View>
        <Icon size={32} color={iconColor} />
      </View>
    </View>
  );
}
