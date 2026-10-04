import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ProductCard } from '../components/ProductCard';
import { CompareModal } from '../components/CompareModal';
import { Product, Category } from '../types/api';
import { productsApi, searchApi, categoriesApi, wishlistApi } from '../api/endpoints';

interface ExploreScreenProps {
  route?: { params?: { categoryId?: number; categorySlug?: string; search?: string } };
  navigation: any;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ route, navigation }) => {
  const [searchQuery, setSearchQuery] = useState(route?.params?.search || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>(
    route?.params?.categoryId || 'all'
  );
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('newest');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareVisible, setCompareVisible] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load initial categories & trending tags
  useEffect(() => {
    categoriesApi.getCategories().then((res) => {
      if (Array.isArray(res)) setCategories(res);
    });
    searchApi.trending().then((res) => {
      if (Array.isArray(res)) setTrendingTags(res);
    });
    wishlistApi.getWishlist().then((res) => {
      if (Array.isArray(res)) {
        setWishlistIds(new Set(res.map((item) => item.product_id)));
      }
    });
  }, []);

  // Sync params from navigation
  useEffect(() => {
    if (route?.params?.categoryId) {
      setSelectedCategory(route.params.categoryId);
    }
    if (route?.params?.search) {
      setSearchQuery(route.params.search);
    }
  }, [route?.params?.categoryId, route?.params?.search]);

  // Load Products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getProducts({
        search: searchQuery.trim() || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        store: selectedStore === 'all' ? undefined : selectedStore,
        sort: selectedSort,
        limit: 30,
      });
      setProducts(Array.isArray(res?.products) ? res.products : []);
    } catch (err) {
      console.error('Fetch products error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStore, selectedSort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Live autocomplete suggestion query
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if ((text || '').trim().length > 1) {
      searchTimeout.current = setTimeout(async () => {
        const list = await searchApi.suggest(text);
        setSuggestions(Array.isArray(list) ? list : []);
      }, 250);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (text: string) => {
    setSearchQuery(text);
    setSuggestions([]);
  };

  const handleWishlistToggle = async (p: Product) => {
    const isSaved = wishlistIds.has(p.id);
    const updated = new Set(wishlistIds);
    if (isSaved) {
      updated.delete(p.id);
      await wishlistApi.removeFromWishlist(p.id);
    } else {
      updated.add(p.id);
      await wishlistApi.addToWishlist(p.id);
    }
    setWishlistIds(updated);
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Minimal Action Header matching Home */}
      <View style={styles.topActionHeader}>
        <TouchableOpacity
          style={styles.circleHeaderBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation?.navigate('Home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Explore Products</Text>

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

      {/* 2. Search Input Box */}
      <View style={styles.searchSection}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clothing, brands, models..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => setSuggestions([])}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Live Autocomplete Dropdown */}
        {suggestions.length > 0 ? (
          <View style={styles.suggestionBox}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionRow}
                onPress={() => selectSuggestion(item)}
              >
                <Ionicons name="search-outline" size={14} color="#1D68ED" />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* 3. Category Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          <TouchableOpacity
            style={[styles.chip, selectedCategory === 'all' && styles.chipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[styles.chipText, selectedCategory === 'all' && styles.chipTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. 2-Column Product Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D68ED" />
          <Text style={styles.loadingText}>Fetching products...</Text>
        </View>
      ) : !products || products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No matching products</Text>
          <Text style={styles.emptySubtitle}>Try changing your search term or category</Text>
        </View>
      ) : (
        <FlatList
          data={products || []}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate('ProductDetail', { product: item, productId: item.id })
                }
                onComparePress={() =>
                  navigation.navigate('ProductDetail', { product: item, productId: item.id })
                }
                isWishlisted={wishlistIds.has(item.id)}
                onWishlistToggle={() => handleWishlistToggle(item)}
              />
            </View>
          )}
        />
      )}

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
  topActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  searchSection: {
    paddingHorizontal: 16,
    zIndex: 10,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 2,
  },
  suggestionBox: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    zIndex: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  suggestionText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  filterSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#1D68ED',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
