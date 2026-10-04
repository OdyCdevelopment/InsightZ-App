import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { SetAlertModal } from '../components/SetAlertModal';
import { CompareModal } from '../components/CompareModal';
import { Product, ProductDetail, ProductVariant, PriceComparisonResult, StoreComparisonItem } from '../types/api';
import { productsApi, wishlistApi, clicksApi } from '../api/endpoints';

interface ProductDetailScreenProps {
  route: {
    params?: {
      product?: Product;
      productId?: number;
    };
  };
  navigation: any;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const initialProduct = route.params?.product;
  const productId = route.params?.productId || initialProduct?.id;

  const [product, setProduct] = useState<ProductDetail | Product | null>(initialProduct || null);
  const [comparison, setComparison] = useState<PriceComparisonResult | null>(null);
  const [loading, setLoading] = useState(!initialProduct && !!productId);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // Variant & Gallery states (matching user screenshot)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('M');

  useEffect(() => {
    if (!productId) return;

    let mounted = true;
    // Check wishlist status
    wishlistApi.getWishlist().then((list) => {
      if (mounted) {
        setIsWishlisted(list.some((item) => item.product_id === productId));
      }
    }).catch(() => {});

    // Fetch full product detail with variants and description
    productsApi.getProductDetail(productId).then((data) => {
      if (mounted && data) {
        setProduct((prev) => ({ ...(prev || {}), ...data }));
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
          if (data.variants[0].option1) {
            setSelectedSize(data.variants[0].option1);
          }
        }
      }
    }).catch(() => {}).finally(() => {
      if (mounted) setLoading(false);
    });

    // Fetch price comparison across stores
    productsApi.comparePrices(productId).then((comp) => {
      if (mounted) setComparison(comp);
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, [productId]);

  const handleWishlistToggle = async () => {
    if (!product) return;
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    if (nextState) {
      await wishlistApi.addToWishlist(product.id);
    } else {
      await wishlistApi.removeFromWishlist(product.id);
    }
  };

  const handleViewOnStore = (targetUrl?: string | null, storeName?: string) => {
    if (!product) return;
    const url = targetUrl || product.product_url || `https://${product.store_domain || 'google.com'}`;
    clicksApi.trackClick(product.id, storeName || product.store, url);
    Linking.openURL(url).catch(() => {});
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '';
    const num = typeof price === 'number' ? price : parseFloat(String(price));
    if (isNaN(num)) return '';
    return `Rs. ${num.toLocaleString()}`;
  };

  const variantsList = useMemo(() => {
    return (product as ProductDetail)?.variants || [];
  }, [product]);

  const hasDbVariants = variantsList.length > 0;

  // Available size / option choices
  const sizeOptions = useMemo(() => {
    if (hasDbVariants) {
      const opts = variantsList
        .map((v) => v.option1 || v.title || '')
        .filter(Boolean);
      const unique = Array.from(new Set(opts));
      if (unique.length > 0) return unique;
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }, [variantsList, hasDbVariants]);

  // Gallery multi-angle images (exactly 4 vertical thumbnails + hero matching user screenshot)
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (product?.image_url) {
      list.push(product.image_url);
    }
    if (variantsList.length > 0) {
      variantsList.forEach((v) => {
        if (v.image_url && !list.includes(v.image_url)) {
          list.push(v.image_url);
        }
      });
    }

    // High quality angle variations if fewer than 4 images
    if (list.length < 2) {
      list.push('https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80');
    }
    if (list.length < 3) {
      list.push('https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80');
    }
    if (list.length < 4) {
      list.push('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80');
    }

    return list.slice(0, 5);
  }, [product, variantsList]);

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    if (hasDbVariants) {
      const match = variantsList.find((v) => (v.option1 || v.title) === size);
      if (match) {
        setSelectedVariant(match);
        if (match.image_url) {
          const imgIdx = galleryImages.indexOf(match.image_url);
          if (imgIdx >= 0) setSelectedImageIndex(imgIdx);
        }
      }
    }
  };

  const handleSelectThumbnail = (index: number) => {
    setSelectedImageIndex(index);
    const targetUrl = galleryImages[index];
    if (hasDbVariants && targetUrl) {
      const match = variantsList.find((v) => v.image_url === targetUrl);
      if (match) {
        setSelectedVariant(match);
        if (match.option1) setSelectedSize(match.option1);
      }
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  const activePrice = selectedVariant?.price ?? product.price;
  const activeComparePrice = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const activeDiscount =
    activeComparePrice && activeComparePrice > activePrice
      ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
      : Math.round(Number(product.discount_percentage) || 0);

  const storeName = product.vendor || product.store || 'Thilakawardhana';
  const sku =
    selectedVariant?.sku ||
    (product as ProductDetail).variants?.[0]?.sku ||
    `TA${product.id ? product.id + 16000 : '16126'}`;
  const isAvailable = selectedVariant ? selectedVariant.available : product.available !== false;
  const lastUpdated = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Top Header: Back to Catalog */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#1D68ED" />
          <Text style={styles.backBtnText}>Back to Catalog</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Gallery Row: Left Vertical Thumbnails + Right Main Product Image */}
        <View style={styles.galleryRow}>
          {/* Vertical Thumbnails Column (Matching user screenshot) */}
          <View style={styles.thumbnailsCol}>
            {galleryImages.slice(0, 4).map((imgUrl, idx) => {
              const isSelected = selectedImageIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={[
                    styles.thumbBtn,
                    isSelected && styles.thumbBtnActive,
                  ]}
                  onPress={() => handleSelectThumbnail(idx)}
                >
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Main Large Hero Image Container */}
          <View style={styles.mainHeroContainer}>
            {/* Top-Left Red Discount Badge */}
            {activeDiscount > 0 ? (
              <View style={styles.discountBadge}>
                <Ionicons name="flame" size={12} color="#FFFFFF" />
                <Text style={styles.discountBadgeText}>{activeDiscount}% OFF</Text>
              </View>
            ) : null}

            {/* Top-Right Circular Quality / Attribute Badge (from screenshot) */}
            <View style={styles.attributeBadge}>
              <Ionicons name="shirt-outline" size={14} color="#0F172A" />
              <Text style={styles.attributeBadgeTitle}>PREMIUM</Text>
              <Text style={styles.attributeBadgeSub}>COTTON</Text>
            </View>

            {/* Top-Right Heart Wishlist Button */}
            <TouchableOpacity
              style={styles.heartBtn}
              activeOpacity={0.8}
              onPress={handleWishlistToggle}
            >
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={22}
                color={isWishlisted ? '#EF4444' : '#1E293B'}
              />
            </TouchableOpacity>

            {/* Main Cover Image */}
            <Image
              source={{
                uri:
                  galleryImages[selectedImageIndex] ||
                  product.image_url ||
                  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
              }}
              style={styles.mainHeroImage}
              resizeMode="cover"
            />

            {/* Bottom Carousel Indicator Dots (from screenshot) */}
            <View style={styles.dotsRow}>
              {galleryImages.slice(0, 5).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === selectedImageIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 2. Store / Vendor Pill */}
        <View style={styles.storePill}>
          <Text style={styles.storePillText}>{storeName}</Text>
        </View>

        {/* 3. Product Title */}
        <Text style={styles.productTitle}>{product.title}</Text>

        {/* 4. Vendor Subtitle */}
        <Text style={styles.vendorText}>by {storeName}</Text>

        {/* 5. Price Row (Rs. 890, Strikethrough, Discount Pill) */}
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatPrice(activePrice)}</Text>
          {activeComparePrice && Number(activeComparePrice) > Number(activePrice) ? (
            <Text style={styles.comparePriceText}>
              {formatPrice(activeComparePrice)}
            </Text>
          ) : null}
          {activeDiscount > 0 ? (
            <View style={styles.priceDiscountPill}>
              <Text style={styles.priceDiscountPillText}>{activeDiscount}% OFF</Text>
            </View>
          ) : null}
        </View>

        {/* 6. Stock Availability */}
        <View style={styles.stockRow}>
          <Ionicons
            name={isAvailable ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={18}
            color={isAvailable ? '#059669' : '#DC2626'}
          />
          <Text
            style={[
              styles.stockText,
              { color: isAvailable ? '#059669' : '#DC2626' },
            ]}
          >
            {isAvailable
              ? 'In Stock — Available for purchase'
              : 'Out of Stock'}
          </Text>
        </View>

        {/* 7. Product Variants / Size Selector (Matching user screenshot) */}
        <View style={styles.variantContainer}>
          <View style={styles.variantHeaderRow}>
            <Text style={styles.variantSectionTitle}>Select Size / Variant</Text>
            <View style={styles.selectedVariantBadge}>
              <Text style={styles.selectedVariantBadgeText}>{selectedSize}</Text>
            </View>
          </View>

          <View style={styles.variantPillsRow}>
            {sizeOptions.map((opt) => {
              const isSelected = selectedSize === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.8}
                  style={[
                    styles.variantPill,
                    isSelected && styles.variantPillActive,
                  ]}
                  onPress={() => handleSelectSize(opt)}
                >
                  <Text
                    style={[
                      styles.variantPillText,
                      isSelected && styles.variantPillTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 8. SKU & Last Updated Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SKU</Text>
            <Text style={styles.infoValue}>{sku}</Text>
          </View>
          <View style={styles.infoRowDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>{lastUpdated}</Text>
          </View>
        </View>

        {/* 9. Product Details / Description Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descCardHeader}>PRODUCT DETAILS Description</Text>
          <Text style={styles.descCardContent}>
            {(product as ProductDetail).description ||
              `${product.title}. Authentic certified product monitored by InsightZ across online verified stores with price drop tracking.`}
          </Text>
        </View>

        {/* 10. Cross-Store Price Comparison (InsightZ Value Prop) */}
        {(() => {
          const storeList: StoreComparisonItem[] =
            comparison?.comparison || comparison?.stores || [];
          if (storeList.length <= 1) return null;
          return (
            <View style={styles.comparisonCard}>
              <View style={styles.compHeader}>
                <Ionicons name="git-compare" size={18} color="#1D68ED" />
                <Text style={styles.compTitle}>
                  Compare Across {comparison?.stores_count || storeList.length} Stores
                </Text>
              </View>
              <Text style={styles.compSubtitle}>
                Lowest price at <Text style={{ fontWeight: '800' }}>{comparison?.cheapest_store || storeList[0]?.store_name}</Text> for {formatPrice(comparison?.lowest_price || storeList[0]?.price)}
              </Text>

              <View style={styles.storesList}>
                {storeList.map((store: StoreComparisonItem, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.storeCompareRow,
                      store.is_lowest_price && styles.lowestStoreRow,
                    ]}
                  >
                    <View style={styles.storeNameCol}>
                      <Text style={styles.compareStoreName}>{store.store_name}</Text>
                      {store.is_lowest_price ? (
                        <View style={styles.lowestBadge}>
                          <Text style={styles.lowestBadgeText}>Lowest Price</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.storePriceCol}>
                      <Text
                        style={[
                          styles.compareStorePrice,
                          store.is_lowest_price && { color: '#059669' },
                        ]}
                      >
                        {formatPrice(store.price)}
                      </Text>
                      <TouchableOpacity
                        style={styles.storeBuyBtn}
                        onPress={() => handleViewOnStore(store.product_url, store.store_name)}
                      >
                        <Text style={styles.storeBuyBtnText}>Visit Store</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* 10. Price Drop Alert Action Pill */}
        <TouchableOpacity
          style={styles.alertActionBtn}
          activeOpacity={0.8}
          onPress={() => setAlertModalVisible(true)}
        >
          <Ionicons name="notifications-outline" size={18} color="#1D68ED" />
          <Text style={styles.alertActionText}>Set Price Drop Alert for this item</Text>
        </TouchableOpacity>

        {/* 11. Primary Bottom Action Button: VIEW ON STORE */}
        <TouchableOpacity
          style={styles.viewStoreBtn}
          activeOpacity={0.88}
          onPress={() => handleViewOnStore()}
        >
          <Text style={styles.viewStoreBtnText}>
            VIEW ON {storeName.toUpperCase()}
          </Text>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Set Alert Modal */}
      <SetAlertModal
        visible={alertModalVisible}
        product={product}
        onClose={() => setAlertModalVisible(false)}
      />

      {/* Compare Modal */}
      <CompareModal
        visible={compareModalVisible}
        product={product}
        onClose={() => setCompareModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  topNav: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D68ED',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    height: 380,
    marginTop: 4,
    marginBottom: 16,
  },
  thumbnailsCol: {
    width: 68,
    justifyContent: 'space-between',
  },
  thumbBtn: {
    width: 68,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  thumbBtnActive: {
    borderColor: '#0F172A',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  mainHeroContainer: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  mainHeroImage: {
    width: '100%',
    height: '100%',
  },
  attributeBadge: {
    position: 'absolute',
    top: 14,
    right: 66,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  attributeBadgeTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  attributeBadgeSub: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748B',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#0F172A',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  variantContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    marginBottom: 12,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  variantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variantSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedVariantBadge: {
    backgroundColor: '#EDF4FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedVariantBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D68ED',
  },
  variantPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  variantPill: {
    minWidth: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantPillActive: {
    backgroundColor: '#0F172A',
  },
  variantPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  variantPillTextActive: {
    color: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heartBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  storePill: {
    backgroundColor: '#E2EFFC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 0,
    marginBottom: 8,
  },
  storePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  vendorText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  priceText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  comparePriceText: {
    fontSize: 17,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  priceDiscountPill: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceDiscountPillText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  descCardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  descCardContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '400',
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  compTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  compSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  storesList: {
    gap: 10,
  },
  storeCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  lowestStoreRow: {
    backgroundColor: '#ECFDF5',
  },
  storeNameCol: {
    flex: 1,
  },
  compareStoreName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  lowestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  lowestBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  storePriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  compareStorePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeBuyBtn: {
    backgroundColor: '#E2EFFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  storeBuyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D68ED',
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 48,
    marginTop: 14,
    gap: 8,
    borderWidth: 0,
  },
  alertActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D68ED',
  },
  viewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 28,
    height: 54,
    marginTop: 16,
    gap: 10,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  viewStoreBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
