import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { CompareModal } from '../components/CompareModal';
import { Product, Category, Banner } from '../types/api';
import { homeApi, productsApi, categoriesApi, wishlistApi } from '../api/endpoints';

interface HomeScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width * 0.82;

// Visual Category Item Definition
interface QuickCategory {
  id: string;
  name: string;
  iconType: 'ionicons' | 'material' | 'feather';
  iconName: string;
  bgColor: string;
  iconColor: string;
  slug: string;
  categoryId?: number;
}

// Helper to assign vibrant stylish icons & pastel colors based on database category names
const getCategoryIconDetails = (name: string, index: number) => {
  const n = (name || '').toLowerCase();
  if (n.includes('shoe') || n.includes('footwear') || n.includes('sneaker')) {
    return { iconType: 'material' as const, iconName: 'shoe-sneaker', bgColor: '#E0F2FE', iconColor: '#0284C7' };
  }
  if (n.includes('watch') || n.includes('jewel') || n.includes('access')) {
    return { iconType: 'material' as const, iconName: 'watch', bgColor: '#E0F7FA', iconColor: '#0891B2' };
  }
  if (n.includes('electr') || n.includes('gadget') || n.includes('phone') || n.includes('headphone')) {
    return { iconType: 'ionicons' as const, iconName: 'game-controller', bgColor: '#38BDF8', iconColor: '#FFFFFF' };
  }
  if (n.includes('t-shirt') || n.includes('tee') || n.includes('shirt') || n.includes('polo')) {
    return { iconType: 'ionicons' as const, iconName: 'shirt', bgColor: '#EEF2FF', iconColor: '#4F46E5' };
  }
  if (n.includes('dress') || n.includes('women') || n.includes('skirt') || n.includes('frock')) {
    return { iconType: 'material' as const, iconName: 'human-female', bgColor: '#FCE7F3', iconColor: '#DB2777' };
  }
  if (n.includes('jean') || n.includes('pant') || n.includes('trouser') || n.includes('denim')) {
    return { iconType: 'material' as const, iconName: 'tshirt-crew', bgColor: '#EDE9FE', iconColor: '#7C3AED' };
  }
  if (n.includes('furnit') || n.includes('home') || n.includes('living') || n.includes('cushion')) {
    return { iconType: 'material' as const, iconName: 'sofa', bgColor: '#ECFEFF', iconColor: '#0D9488' };
  }
  if (n.includes('groc') || n.includes('food') || n.includes('fruit')) {
    return { iconType: 'material' as const, iconName: 'food-apple', bgColor: '#FEF3C7', iconColor: '#D97706' };
  }
  if (n.includes('applian') || n.includes('kitchen')) {
    return { iconType: 'material' as const, iconName: 'washing-machine', bgColor: '#E6FFFA', iconColor: '#059669' };
  }
  if (n.includes('jacket') || n.includes('hoodie') || n.includes('coat')) {
    return { iconType: 'material' as const, iconName: 'hanger', bgColor: '#FEE2E2', iconColor: '#DC2626' };
  }
  if (n.includes('bag') || n.includes('wallet')) {
    return { iconType: 'material' as const, iconName: 'bag-personal', bgColor: '#FFF7ED', iconColor: '#EA580C' };
  }

  // Fallback pleasant pastel palette cycling
  const palettes = [
    { iconType: 'ionicons' as const, iconName: 'shirt', bgColor: '#EEF2FF', iconColor: '#4F46E5' },
    { iconType: 'material' as const, iconName: 'tshirt-crew', bgColor: '#E0F2FE', iconColor: '#0284C7' },
    { iconType: 'material' as const, iconName: 'star-outline', bgColor: '#FEF3C7', iconColor: '#D97706' },
    { iconType: 'ionicons' as const, iconName: 'sparkles', bgColor: '#FCE7F3', iconColor: '#DB2777' },
  ];
  return palettes[index % palettes.length];
};

const DEFAULT_CATEGORIES: QuickCategory[] = [
  { id: 'shoes', name: 'Shoes', iconType: 'material', iconName: 'shoe-sneaker', bgColor: '#E0F2FE', iconColor: '#0284C7', slug: 'shoes' },
  { id: 'watches', name: 'Watches', iconType: 'material', iconName: 'watch', bgColor: '#E0F7FA', iconColor: '#0891B2', slug: 'watches' },
  { id: 'electronics', name: 'Electronics', iconType: 'ionicons', iconName: 'game-controller', bgColor: '#38BDF8', iconColor: '#FFFFFF', slug: 'electronics' },
  { id: 'fashion', name: 'Fashion', iconType: 'ionicons', iconName: 'shirt', bgColor: '#EEF2FF', iconColor: '#4F46E5', slug: 't-shirt' },
  { id: 'furniture', name: 'Furniture', iconType: 'material', iconName: 'sofa', bgColor: '#ECFEFF', iconColor: '#0D9488', slug: 'furniture' },
  { id: 'grocery', name: 'Grocery', iconType: 'material', iconName: 'food-apple', bgColor: '#FEF3C7', iconColor: '#D97706', slug: 'grocery' },
  { id: 'appliances', name: 'Appliances', iconType: 'material', iconName: 'washing-machine', bgColor: '#E6FFFA', iconColor: '#059669', slug: 'appliances' },
  { id: 'more', name: 'More', iconType: 'feather', iconName: 'more-horizontal', bgColor: '#ECFDF5', iconColor: '#10B981', slug: 'all' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [topOffers, setTopOffers] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [womenProducts, setWomenProducts] = useState<Product[]>([]);
  const [menProducts, setMenProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Search Bar Modal / State
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active banner index for pagination dots
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Modals & Wishlist
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareVisible, setCompareVisible] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        categoriesApi.getCategories(),
        homeApi.getFeed(),
        productsApi.getProducts({ limit: 40 }),
        wishlistApi.getWishlist(),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value?.length > 0) {
        setCategories(results[0].value);
      }

      let feedOffers: Product[] = [];
      let feedWomen: Product[] = [];
      let feedMen: Product[] = [];

      if (results[1].status === 'fulfilled' && results[1].value) {
        const feed = results[1].value;
        if (feed.top_offers && feed.top_offers.length > 0) {
          feedOffers = feed.top_offers;
        }
        if (feed.new_in_women && feed.new_in_women.length > 0) {
          feedWomen = feed.new_in_women;
        }
        if (feed.new_in_men && feed.new_in_men.length > 0) {
          feedMen = feed.new_in_men;
        }
      }

      if (results[2].status === 'fulfilled' && results[2].value?.products?.length > 0) {
        const prods = results[2].value.products;
        if (feedOffers.length === 0) {
          feedOffers = prods.filter(
            (p) => (p.discount_percentage && p.discount_percentage > 15) || p.is_offer
          );
        }
        if (feedWomen.length === 0) {
          feedWomen = prods.filter((p) => {
            const t = p.title.toLowerCase();
            return t.includes('akasi') || t.includes('dress') || t.includes('top');
          });
        }
        if (feedMen.length === 0) {
          feedMen = prods.filter((p) => {
            const t = p.title.toLowerCase();
            return (t.includes('men') || t.includes('shirt') || t.includes('jean')) && !t.includes('bra');
          });
        }
        setFlashSaleProducts(prods.slice(0, 10));
      } else {
        setFlashSaleProducts(feedOffers.slice(0, 10));
      }

      setTopOffers(feedOffers);
      setWomenProducts(feedWomen);
      setMenProducts(feedMen);

      if (results[3].status === 'fulfilled' && results[3].value?.length > 0) {
        setWishlistIds(new Set(results[3].value.map((item) => item.product_id)));
      }
    } catch {
      // Background network issues handled silently
    } finally {
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

  const handleWishlistToggle = async (product: Product) => {
    const isSaved = wishlistIds.has(product.id);
    const updated = new Set(wishlistIds);
    if (isSaved) {
      updated.delete(product.id);
      setWishlistIds(updated);
      try {
        await wishlistApi.removeFromWishlist(product.id);
      } catch (err) {
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
        const revert = new Set(wishlistIds);
        revert.delete(product.id);
        setWishlistIds(revert);
      }
    }
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '';
    const num = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(num)) return '';
    return `Rs. ${num.toLocaleString()}`;
  };

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (BANNER_WIDTH + 14));
    setActiveBannerIndex(index);
  };

  // Build dynamic categories list directly from the database
  const mappedCategories: QuickCategory[] = (categories || []).slice(0, 7).map((cat, idx) => {
    const iconInfo = getCategoryIconDetails(cat.name, idx);
    return {
      id: String(cat.id),
      name: cat.name,
      slug: cat.slug || String(cat.id),
      categoryId: cat.id,
      iconType: iconInfo.iconType,
      iconName: iconInfo.iconName,
      bgColor: iconInfo.bgColor,
      iconColor: iconInfo.iconColor,
    };
  });

  const moreCategory: QuickCategory = {
    id: 'more',
    name: 'More',
    iconType: 'feather',
    iconName: 'more-horizontal',
    bgColor: '#ECFDF5',
    iconColor: '#10B981',
    slug: 'all',
  };

  const displayCategories: QuickCategory[] =
    mappedCategories.length > 0 ? [...mappedCategories, moreCategory] : DEFAULT_CATEGORIES;

  // Render Category Icon Component
  const renderCategoryIcon = (cat: QuickCategory) => {
    if (cat.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={cat.iconName as any}
          size={26}
          color={cat.iconColor}
        />
      );
    }
    if (cat.iconType === 'feather') {
      return <Feather name={cat.iconName as any} size={24} color={cat.iconColor} />;
    }
    return <Ionicons name={cat.iconName as any} size={24} color={cat.iconColor} />;
  };

  // Render Flash Sale Card (Matches Reference UI Exactly)
  const renderFlashSaleCard = (item: Product) => {
    const isSaved = wishlistIds.has(item.id);
    const discount = Math.round(Number(item.discount_percentage) || 45);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.flashCard}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('ProductDetail', { product: item, productId: item.id })
        }
      >
        {/* Product Image & Floating Elements */}
        <View style={styles.flashImageWrapper}>
          <Image
            source={{
              uri:
                item.image_url ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
            }}
            style={styles.flashImage}
            resizeMode="cover"
          />

          {/* Red Pill Discount Tag: e.g. Sale -70% */}
          <View style={styles.flashSaleTag}>
            <Text style={styles.flashSaleTagText}>Sale -{discount}%</Text>
          </View>

          {/* Bottom-Right Floating Heart Button */}
          <TouchableOpacity
            style={styles.flashHeartBtn}
            activeOpacity={0.8}
            onPress={() => handleWishlistToggle(item)}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={18}
              color={isSaved ? '#EF4444' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.flashInfo}>
          <Text style={styles.flashTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>

          {/* Price Row */}
          <View style={styles.flashPriceRow}>
            <Text style={styles.flashPriceText}>{formatPrice(item.price)}</Text>
            {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) ? (
              <Text style={styles.flashComparePrice}>
                {formatPrice(item.compare_at_price)}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP MINIMAL ACTION HEADER */}
      <View style={styles.topActionHeader}>
        {/* Left: Personalized Greeting */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingSub}>Good morning,</Text>
          <Text style={styles.greetingName}>Dayasthan</Text>
        </View>

        {/* Right: Search and Wishlist Icons */}
        <View style={styles.rightActionCluster}>
          {/* Search Icon */}
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            activeOpacity={0.7}
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="search-outline" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* Heart / Wishlist Icon */}
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <Ionicons
              name={wishlistIds.size > 0 ? 'heart' : 'heart-outline'}
              size={20}
              color={wishlistIds.size > 0 ? '#EF4444' : '#0F172A'}
            />
            {wishlistIds.size > 0 ? <View style={styles.activeDot} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 2. HERO SLIDING BANNER CAROUSEL */}
        <View style={styles.bannerContainer}>
          <ScrollView
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleBannerScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.bannerScrollContent}
          >
            {/* Banner 1: Special Sale up to 50% */}
            <View style={[styles.bannerCard, { backgroundColor: '#FDF2E9' }]}>
              <View style={styles.bannerTextSide}>
                <Text style={styles.bannerSubheading}>Get your special</Text>
                <Text style={styles.bannerHeading}>sale up to 50%</Text>
                <Text style={styles.bannerDesc}>Enjoy, before it runs out</Text>
                <TouchableOpacity
                  style={styles.bannerShopBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Deals')}
                >
                  <Text style={styles.bannerShopBtnText}>Shop now</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80',
                }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>

            {/* Banner 2: Casual Shirt 40% OFF */}
            <View style={[styles.bannerCard, { backgroundColor: '#FCE7F3' }]}>
              <View style={styles.bannerTextSide}>
                <Text style={styles.bannerSubheading}>CASUAL SHIRT</Text>
                <Text style={styles.bannerHeading}>40% OFF</Text>
                <Text style={styles.bannerDesc}>Premium collections</Text>
                <TouchableOpacity
                  style={styles.bannerShopBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Deals')}
                >
                  <Text style={styles.bannerShopBtnText}>Shop now</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80',
                }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </ScrollView>

          {/* Carousel Pagination Dots */}
          <View style={styles.paginationRow}>
            <View
              style={[
                styles.dot,
                activeBannerIndex === 0 ? styles.dotActive : styles.dotInactive,
              ]}
            />
            <View
              style={[
                styles.dot,
                activeBannerIndex === 1 ? styles.dotActive : styles.dotInactive,
              ]}
            />
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </View>

        {/* 3. CLOTHING CATEGORIES HORIZONTAL SCROLL (SINGLE LINE) */}
        <View style={styles.categoryGridSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Category</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryHorizontalScroll}
          >
            {displayCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catHorizontalItem}
                activeOpacity={0.75}
                onPress={() => {
                  if (cat.id === 'more' || cat.slug === 'all') {
                    navigation.navigate('Explore');
                  } else {
                    navigation.navigate('Explore', {
                      categoryId: cat.categoryId,
                      categorySlug: cat.slug,
                    });
                  }
                }}
              >
                <View style={[styles.catCircle, { backgroundColor: cat.bgColor }]}>
                  {renderCategoryIcon(cat)}
                </View>
                <Text style={styles.catLabel} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. FLASH SALE SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Flash Sale</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Deals')}
          >
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Flash Sale Product Grid */}
        <View style={styles.flashGrid}>
          {flashSaleProducts.map((p) => renderFlashSaleCard(p))}
        </View>

        {/* 5. TOP OFFERS / NEW IN WOMEN SECTION */}
        {womenProducts.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>New In • Fashion</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Explore')}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.flashGrid}>
              {womenProducts.slice(0, 4).map((p) => renderFlashSaleCard(p))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Quick Search Overlay Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalBox}>
            <View style={styles.searchModalInputRow}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search clothing, brands, stores..."
                placeholderTextColor="#94A3B8"
                autoFocus={true}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  setSearchModalVisible(false);
                  navigation.navigate('Explore', { search: searchQuery });
                }}
              />
              <TouchableOpacity
                onPress={() => setSearchModalVisible(false)}
                style={styles.closeSearchBtn}
              >
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Side Menu Drawer */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <TouchableOpacity
            style={styles.menuDismissArea}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuDrawer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuBrandTitle}>InsightZ Menu</Text>
              <TouchableOpacity
                style={styles.menuCloseBtn}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Home');
                }}
              >
                <Ionicons name="home-outline" size={22} color="#0F172A" />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Nearby');
                }}
              >
                <Ionicons name="navigate-outline" size={22} color="#1D68ED" />
                <Text style={[styles.menuItemText, { color: '#1D68ED', fontWeight: '800' }]}>
                  Near Me (500m Offers)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Deals');
                }}
              >
                <Ionicons name="flash-outline" size={22} color="#0F172A" />
                <Text style={styles.menuItemText}>Deals & Offers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Wishlist');
                }}
              >
                <Ionicons name="heart-outline" size={22} color="#0F172A" />
                <Text style={styles.menuItemText}>Saved Wishlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Profile');
                }}
              >
                <Ionicons name="person-outline" size={22} color="#0F172A" />
                <Text style={styles.menuItemText}>My Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Compare Modal */}
      <CompareModal
        visible={compareVisible}
        product={selectedProduct}
        onClose={() => setCompareVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },

  // 1. Top Minimal Action Header
  topActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  greetingWrap: {
    justifyContent: 'center',
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 1,
  },
  greetingName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  circleHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rightActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },

  // 2. Banner Sliding Cards & Pagination
  bannerContainer: {
    marginTop: 6,
    marginBottom: 16,
  },
  bannerScrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: 140,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 6,
    overflow: 'hidden',
  },
  bannerTextSide: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bannerSubheading: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  bannerHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 1,
  },
  bannerDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  bannerShopBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  bannerShopBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bannerImage: {
    width: 100,
    height: 130,
    borderRadius: 14,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#10B981',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#E2E8F0',
  },

  // 3. Category Horizontal Scroll (Single Line)
  categoryGridSection: {
    marginBottom: 20,
  },
  categoryHorizontalScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  catHorizontalItem: {
    alignItems: 'center',
    width: 62,
  },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  // 4. Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D68ED',
  },

  // 5. Flash Sale 2-Column Grid & Cards
  flashGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    rowGap: 16,
  },
  flashCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
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
    color: '#059669',
  },
  flashComparePrice: {
    fontSize: 11.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  // Search Modal
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  searchModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  searchModalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 4,
  },
  closeSearchBtn: {
    padding: 4,
  },

  // Side Menu Drawer
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  menuDismissArea: {
    flex: 1,
  },
  menuDrawer: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuCloseBtn: {
    padding: 6,
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
});
