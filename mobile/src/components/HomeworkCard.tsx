import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CheckCircle, Circle, Edit2, Trash2, MoreVertical, Calendar } from 'lucide-react-native';

interface HomeworkCardProps {
  homework: {
    id: string;
    title: string;
    subject: string;
    due_date: string;
    completed: boolean;
    description?: string;
  };
  onToggleComplete?: (homeworkId: string, completed: boolean) => void;
  onEdit?: (homework: any) => void;
  onDelete?: (homeworkId: string) => void;
}

export default function HomeworkCard({
  homework,
  onToggleComplete,
  onEdit,
  onDelete,
}: HomeworkCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Ödevi Sil',
      'Bu ödevi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setShowMenu(false);
            onDelete?.(homework.id);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(homework);
  };

  const handleToggle = () => {
    onToggleComplete?.(homework.id, !homework.completed);
  };

  const isOverdue =
    !homework.completed &&
    new Date(homework.due_date) < new Date(new Date().toDateString());

  return (
    <View
      className={`bg-white rounded-lg p-4 mb-3 shadow-sm border-l-4 ${
        homework.completed
          ? 'border-green-500'
          : isOverdue
          ? 'border-red-500'
          : 'border-orange-500'
      }`}
    >
      <View className="flex-row items-start justify-between mb-2">
        <TouchableOpacity
          onPress={handleToggle}
          className="flex-row items-start flex-1"
          disabled={!onToggleComplete}
        >
          {homework.completed ? (
            <CheckCircle size={24} color="#10B981" />
          ) : (
            <Circle size={24} color="#6B7280" />
          )}
          <View className="flex-1 ml-3">
            <Text
              className={`text-base font-semibold ${
                homework.completed ? 'text-gray-400 line-through' : 'text-gray-900'
              }`}
            >
              {homework.title}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">{homework.subject}</Text>
          </View>
        </TouchableOpacity>
        {(onEdit || onDelete) && (
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            className="p-2"
          >
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {homework.description && (
        <Text className="text-sm text-gray-600 mt-2 ml-9">
          {homework.description}
        </Text>
      )}

      <View className="flex-row items-center mt-2 ml-9">
        <Calendar size={14} color={isOverdue ? '#EF4444' : '#6B7280'} />
        <Text
          className={`text-xs ml-1 ${
            isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'
          }`}
        >
          {isOverdue ? 'Gecikmiş: ' : 'Son tarih: '}
          {new Date(homework.due_date).toLocaleDateString('tr-TR')}
        </Text>
      </View>

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
