import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Package } from '../data/packages';

type Props = {
  item: Package;
  onSelect?: () => void;
};

export function PackageCard({ item, onSelect }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onSelect}>
      <Text style={styles.title}>{item.name}</Text>
      {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.price}>₺{item.monthlyPrice}/ay</Text>
        <Text style={styles.tag}>{item.aiSupport ? 'AI Destekli' : 'Temel'}</Text>
      </View>
      <Text style={styles.subtitle}>Öne çıkanlar</Text>
      {item.features.slice(0, 4).map((feat) => (
        <Text key={feat} style={styles.feature}>
          • {feat}
        </Text>
      ))}
      <Text style={styles.small}>
        6 ay: ₺{item.sixMonthPrice} · 12 ay: ₺{item.yearlyPrice} · Veli: {item.maxParents}
      </Text>
      <Text style={styles.cta}>Satın alma adımı yakında (payment stub)</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  pressed: {
    opacity: 0.92,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  desc: {
    color: '#475569',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  price: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 16,
  },
  tag: {
    color: '#6B7280',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  subtitle: {
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 6,
  },
  feature: {
    color: '#4B5563',
    fontSize: 13,
  },
  small: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 6,
  },
  cta: {
    color: '#2563EB',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
