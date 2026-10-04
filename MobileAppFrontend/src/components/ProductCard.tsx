import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onComparePress?: () => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onComparePress,
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const discount = Math.round(Number(product.discount_percentage) || 45);
  const hasDiscount = discount > 0;

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '';
    const num = typeof price === 'number' ? price : parseFloat(String(price));
    if (isNaN(num)) return '';
    return `Rs. ${num.toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      style={styles.flashCard}
      activeOpacity={0.88}
      onPress={onPress || onComparePress}
    >
      {/* Product Image Wrapper */}
      <View style={styles.flashImageWrapper}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.flashImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="shirt-outline" size={32} color="#94A3B8" />
          </View>
        )}

        {/* Top-Left Red Pill Sale Tag */}
        {hasDiscount ? (
          <View style={styles.flashSaleTag}>
            <Text style={styles.flashSaleTagText}>Sale -{discount}%</Text>
          </View>
        ) : null}

        {/* Bottom-Right Floating Heart Button */}
        <TouchableOpacity
          style={styles.flashHeartBtn}
          activeOpacity={0.8}
          onPress={onWishlistToggle}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? '#EF4444' : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.flashInfo}>
        <Text style={styles.flashTitle} numberOfLines={1} ellipsizeMode="tail">
          {product.title}
        </Text>

        {/* Price Row */}
        <View style={styles.flashPriceRow}>
          <Text style={styles.flashPriceText}>{formatPrice(product.price)}</Text>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) ? (
            <Text style={styles.flashComparePrice}>
              {formatPrice(product.compare_at_price)}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flashCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  flashImageWrapper: {
    width: '100%',
    aspectRatio: 0.95,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    overflow: 'hidden',
  },
  flashImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  flashSaleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flashSaleTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  flashHeartBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashInfo: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  flashTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  flashRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  flashRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  flashReviewCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  flashPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  flashPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669', // Emerald green price
  },
  flashComparePrice: {
    fontSize: 11.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
});
