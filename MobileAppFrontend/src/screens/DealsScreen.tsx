import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DealProduct, Product, Category } from '../types/api';
import { dealsApi, wishlistApi, categoriesApi } from '../api/endpoints';

const { width } = Dimensions.get('window');

interface StoryCategory {
  id: string;
  name: string;
  iconType: 'ionicons' | 'material';
  iconName: string;
  categoryId?: number;
}

const getCategoryIconDetails = (name: string, index: number) => {
  const n = (name || '').toLowerCase();
  if (n.includes('shoe') || n.includes('footwear') || n.includes('sneaker')) {
    return { iconType: 'material' as const, iconName: 'shoe-sneaker' };
  }
  if (n.includes('watch') || n.includes('jewel') || n.includes('access')) {
    return { iconType: 'material' as const, iconName: 'watch' };
  }
  if (n.includes('electr') || n.includes('gadget') || n.includes('phone') || n.includes('headphone')) {
    return { iconType: 'ionicons' as const, iconName: 'game-controller' };
  }
  if (n.includes('t-shirt') || n.includes('tee') || n.includes('shirt') || n.includes('polo')) {
    return { iconType: 'ionicons' as const, iconName: 'shirt' };
  }
  if (n.includes('dress') || n.includes('women') || n.includes('skirt') || n.includes('frock')) {
    return { iconType: 'material' as const, iconName: 'human-female' };
  }
  if (n.includes('jean') || n.includes('pant') || n.includes('trouser') || n.includes('denim')) {
    return { iconType: 'material' as const, iconName: 'tshirt-crew' };
  }
  if (n.includes('furnit') || n.includes('home') || n.includes('living')) {
    return { iconType: 'material' as const, iconName: 'sofa' };
  }
  if (n.includes('groc') || n.includes('food') || n.includes('fruit')) {
    return { iconType: 'material' as const, iconName: 'food-apple' };
  }
  if (n.includes('bag') || n.includes('wallet')) {
    return { iconType: 'material' as const, iconName: 'bag-personal' };
  }

  const fallback = [
    { iconType: 'ionicons' as const, iconName: 'shirt' },
    { iconType: 'material' as const, iconName: 'tshirt-crew' },
    { iconType: 'material' as const, iconName: 'tag-outline' },
    { iconType: 'ionicons' as const, iconName: 'pricetag' },
  ];
  return fallback[index % fallback.length];
};

export const DealsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const [dealsRes, catsRes, wishlistRes] = await Promise.allSettled([
        dealsApi.getDeals({ limit: 100 }),
        categoriesApi.getCategories(),
        wishlistApi.getWishlist(),
      ]);

      if (dealsRes.status === 'fulfilled' && dealsRes.value) {
        const list = Array.isArray(dealsRes.value)
          ? dealsRes.value
          : (dealsRes.value as any)?.data || [];
        setDeals(list);
      }

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value) && catsRes.value.length > 0) {
        setCategories(catsRes.value);
      }

      if (wishlistRes.status === 'fulfilled' && wishlistRes.value) {
        setWishlistIds(new Set(wishlistRes.value.map((w: any) => w.product_id)));
      }
    } catch (err) {
      console.error('Error loading deals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const syncWishlist = useCallback(async () => {
    try {
      const wishlistRes = await wishlistApi.getWishlist();
      if (Array.isArray(wishlistRes)) {
        setWishlistIds(new Set(wishlistRes.map((w: any) => w.product_id)));
      }
    } catch {
      // Ignore background sync errors
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      syncWishlist();
    }, [syncWishlist])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleWishlistToggle = async (product: Product | DealProduct) => {
    const isSaved = wishlistIds.has(product.id);
    const updated = new Set(wishlistIds);
    if (isSaved) {
      updated.delete(product.id);
      setWishlistIds(updated);
      try {
        await wishlistApi.removeFromWishlist(product.id);
      } catch (err) {
        // Revert on error
        const revert = new Set(wishlistIds);
        revert.add(product.id);
        setWishlistIds(revert);
      }
    } else {
      updated.add(product.id);
      setWishlistIds(updated);
      try {
        await wishlistApi.addToWishlist(product.id);
      } catch (err) {
        // Revert on error
        const revert = new Set(wishlistIds);
        revert.delete(product.id);
        setWishlistIds(revert);
      }
    }
  };

  const handleShare = async (item: DealProduct) => {
    try {
      await Share.share({
        message: `Check out ${item.title} on discount!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Build Dynamic Instagram Story Filter List from DB Categories + Special Offers
  const storyFilters: StoryCategory[] = [
    { id: 'all', name: 'All Deals', iconType: 'ionicons', iconName: 'flash' },
    { id: '50plus', name: '50%+ OFF', iconType: 'ionicons', iconName: 'pricetag' },
    ...categories.map((c, idx) => {
      const details = getCategoryIconDetails(c.name, idx);
      return {
        id: `cat_${c.id}`,
        name: c.name,
        iconType: details.iconType,
        iconName: details.iconName,
        categoryId: c.id,
      };
    }),
  ];

  const filteredDeals = deals.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === '50plus') {
      return (Number(item.discount_percentage) || 0) >= 50;
    }
    if (selectedFilter.startsWith('cat_')) {
      const catId = parseInt(selectedFilter.replace('cat_', ''), 10);
      const catObj = categories.find((c) => c.id === catId);
      const itemCatId = (item as any).category_id || (item as any).category;
      if (itemCatId && itemCatId === catId) return true;
      if (catObj) {
        const catName = catObj.name.toLowerCase();
        const t = (item.title || '').toLowerCase();
        const words = catName.split(/[\s&,-]+/).filter((w) => w.length > 2);
        return words.some((w) => t.includes(w));
      }
    }
    return true;
  });

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '';
    const num = typeof price === 'number' ? price : parseFloat(String(price));
    if (isNaN(num)) return '';
    return `Rs. ${num.toLocaleString()}`;
  };

  const renderInstagramPost = ({ item }: { item: DealProduct }) => {
    const isSaved = wishlistIds.has(item.id);
    const discount = Math.round(Number(item.discount_percentage) || 44);
    const storeName =
      (item as any).store_name || (item as any).seller_name || 'Thilakawardhana Store';
    const storeAvatar =
      (item as any).store_image ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80';

    return (
      <View style={styles.instaCard}>
        {/* 1. Post Header: Store Icon, Name, Verified Badge, Share Action */}
        <View style={styles.instaPostHeader}>
          <TouchableOpacity
            style={styles.instaStoreInfo}
            activeOpacity={0.8}
            onPress={() =>
              navigation?.navigate('ProductDetail', {
                product: item,
                productId: item.id,
              })
            }
          >
            <View style={styles.instaStoreAvatarWrap}>
              {(item as any).store_image ? (
                <Image
                  source={{ uri: (item as any).store_image }}
                  style={styles.instaStoreAvatar}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="storefront" size={18} color="#1D68ED" />
              )}
            </View>
            <View style={styles.instaStoreTextWrap}>
              <View style={styles.instaNameRow}>
                <Text style={styles.instaStoreName}>{storeName}</Text>
                <Ionicons name="checkmark-circle" size={13} color="#1D68ED" />
              </View>
              <Text style={styles.instaPostLocation}>Verified Retailer • Colombo</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Large High-Res Product Image (Instagram Media) */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() =>
            navigation?.navigate('ProductDetail', {
              product: item,
              productId: item.id,
            })
          }
          style={styles.instaMediaWrap}
        >
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.instaMediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.instaMediaPlaceholder}>
              <Ionicons name="shirt-outline" size={48} color="#CBD5E1" />
            </View>
          )}

          {/* Floating Top-Left Red Discount Tag */}
          <View style={styles.instaSaleTag}>
            <Text style={styles.instaSaleText}>Sale -{discount}%</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Instagram Action Bar: Heart, View Deal */}
        <View style={styles.instaActionBar}>
          <View style={styles.instaActionsLeft}>
            <TouchableOpacity
              style={styles.instaActionBtn}
              activeOpacity={0.7}
              onPress={() => handleWishlistToggle(item as any)}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={24}
                color={isSaved ? '#EF4444' : '#0F172A'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.viewDealPillBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation?.navigate('ProductDetail', {
                product: item,
                productId: item.id,
              })
            }
          >
            <Text style={styles.viewDealPillText}>View Deal</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Pricing & Caption (No Rating, No Emoji) */}
        <View style={styles.instaCaptionWrap}>
          {/* Price Highlight */}
          <View style={styles.instaPriceRow}>
            <Text style={styles.instaCurrentPrice}>{formatPrice(item.price)}</Text>
            {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) ? (
              <Text style={styles.instaOriginalPrice}>
                {formatPrice(item.compare_at_price)}
              </Text>
            ) : null}
            <View style={styles.saveTag}>
              <Text style={styles.saveTagText}>SAVE {discount}%</Text>
            </View>
          </View>

          {/* Product Title Caption */}
          <Text style={styles.instaCaptionText} numberOfLines={2}>
            <Text style={styles.instaCaptionStore}>{storeName} </Text>
            {item.title}
          </Text>

          {/* Timestamp */}
          <Text style={styles.instaTimeText}>Limited time flash discount</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Clean Header (No arrows, No emoji) */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Hot Deals</Text>

        <View style={styles.rightActionCluster}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Explore')}
          >
            <Ionicons name="search-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Wishlist')}
          >
            <Ionicons
              name={wishlistIds.size > 0 ? 'heart' : 'heart-outline'}
              size={20}
              color={wishlistIds.size > 0 ? '#EF4444' : '#0F172A'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Instagram Stories Bar (Real Dynamic DB Categories + 50%+ OFF) */}
      <View style={styles.storiesBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={storyFilters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.storiesList}
          renderItem={({ item }) => {
            const isActive = selectedFilter === item.id;
            return (
              <TouchableOpacity
                style={styles.storyItem}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(item.id)}
              >
                <View
                  style={[
                    styles.storyRing,
                    isActive && styles.storyRingActive,
                  ]}
                >
                  <View style={styles.storyInnerCircle}>
                    {item.iconType === 'material' ? (
                      <MaterialCommunityIcons
                        name={item.iconName as any}
                        size={20}
                        color={isActive ? '#1D68ED' : '#0F172A'}
                      />
                    ) : (
                      <Ionicons
                        name={item.iconName as any}
                        size={18}
                        color={isActive ? '#1D68ED' : '#0F172A'}
                      />
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.storyLabel,
                    isActive && styles.storyLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 3. Instagram Scroll Feed */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1D68ED" />
          <Text style={styles.loadingText}>Loading deals feed...</Text>
        </View>
      ) : filteredDeals.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="flash-off-outline" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No deals found in this category</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={styles.resetBtnText}>View All Deals</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDeals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInstagramPost}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1D68ED"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circleHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  rightActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Instagram Stories Bar
  storiesBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  storiesList: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  storyRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  storyRingActive: {
    backgroundColor: '#1D68ED',
  },
  storyInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  storyLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  // Feed Content
  feedContent: {
    paddingBottom: 24,
  },

  // Instagram Post Card
  instaCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  instaPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  instaStoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  instaStoreAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instaStoreAvatar: {
    width: '100%',
    height: '100%',
  },
  instaStoreTextWrap: {
    flex: 1,
  },
  instaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instaStoreName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  instaPostLocation: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  instaOptionsBtn: {
    padding: 6,
  },

  // Post Media
  instaMediaWrap: {
    width: width,
    height: width * 1.05,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    overflow: 'hidden',
  },
  instaMediaImage: {
    width: '100%',
    height: '100%',
  },
  instaMediaPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instaSaleTag: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  instaSaleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Action Bar
  instaActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  instaActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instaActionBtn: {
    paddingVertical: 2,
  },
  viewDealPillBtn: {
    backgroundColor: '#1D68ED',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDealPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Captions & Pricing
  instaCaptionWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  instaPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  instaCurrentPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  instaOriginalPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  saveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveTagText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  instaCaptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  instaCaptionStore: {
    fontWeight: '800',
    color: '#0F172A',
  },
  instaTimeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },

  // Loading & Empty States
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#1D68ED',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
