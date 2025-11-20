import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Edit2, Trash2, MoreVertical } from 'lucide-react-native';

interface ExamCardProps {
  exam: {
    id: string;
    exam_name: string;
    exam_type: string;
    exam_date: string;
    total_score?: number;
    turkish?: number;
    math?: number;
    science?: number;
    social?: number;
  };
  onEdit?: (exam: any) => void;
  onDelete?: (examId: string) => void;
}

export default function ExamCard({ exam, onEdit, onDelete }: ExamCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Sınavı Sil',
      'Bu sınavı silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setShowMenu(false);
            onDelete?.(exam.id);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(exam);
  };

  return (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {exam.exam_name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {exam.exam_type} • {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        {(onEdit || onDelete) && (
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            className="p-2"
          >
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {exam.total_score !== undefined && (
        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <Text className="text-sm text-gray-600">Toplam Puan</Text>
          <Text className="text-xl font-bold text-blue-600">
            {exam.total_score.toFixed(1)}
          </Text>
        </View>
      )}

      {(exam.turkish || exam.math || exam.science || exam.social) && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          <View className="flex-row flex-wrap gap-2">
            {exam.turkish !== undefined && (
              <View className="bg-blue-50 px-2 py-1 rounded">
                <Text className="text-xs text-blue-700">
                  Türkçe: {exam.turkish}
                </Text>
              </View>
            )}
            {exam.math !== undefined && (
              <View className="bg-green-50 px-2 py-1 rounded">
                <Text className="text-xs text-green-700">
                  Mat: {exam.math}
                </Text>
              </View>
            )}
            {exam.science !== undefined && (
              <View className="bg-purple-50 px-2 py-1 rounded">
                <Text className="text-xs text-purple-700">
                  Fen: {exam.science}
                </Text>
              </View>
            )}
            {exam.social !== undefined && (
              <View className="bg-orange-50 px-2 py-1 rounded">
                <Text className="text-xs text-orange-700">
                  Sosyal: {exam.social}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {showMenu && (
        <View className="absolute top-12 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          {onEdit && (
            <TouchableOpacity
              onPress={handleEdit}
              className="flex-row items-center px-4 py-3 border-b border-gray-100"
            >
              <Edit2 size={16} color="#3B82F6" />
              <Text className="ml-2 text-blue-600">Düzenle</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center px-4 py-3"
            >
              <Trash2 size={16} color="#EF4444" />
              <Text className="ml-2 text-red-600">Sil</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
