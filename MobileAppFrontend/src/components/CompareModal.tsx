import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PriceComparisonResult, Product } from '../types/api';
import { productsApi, clicksApi } from '../api/endpoints';

interface CompareModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PriceComparisonResult | null>(null);

  useEffect(() => {
    if (visible && product) {
      setLoading(true);
      productsApi
        .comparePrices(product.id)
        .then((res) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [visible, product]);

  const handleOpenStore = (item: any) => {
    if (!product) return;
    clicksApi.trackClick(product.id, item.store_name, item.product_url || 'https://google.com');
    if (item.product_url) {
      Linking.openURL(item.product_url).catch(() => {});
    }
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.compareBadge}>
                <Ionicons name="git-compare" size={14} color={colors.primary} />
                <Text style={styles.compareBadgeText}>Cross-Store Price Comparison</Text>
              </View>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {product.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Comparing live prices across stores...</Text>
            </View>
          ) : data ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
              {/* Savings Highlights Card */}
              <View style={styles.savingsCard}>
                <View style={styles.savingsHeader}>
                  <Ionicons name="sparkles" size={18} color={colors.success} />
                  <Text style={styles.savingsTitle}>
                    Save up to {product.currency} {data.max_savings.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.savingsSubtitle}>
                  Cheapest deal found at <Text style={styles.highlightText}>{data.cheapest_store}</Text> for {data.currency} {data.lowest_price.toFixed(2)}
                </Text>

                <View style={styles.statRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Lowest Price</Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                      {data.currency} {data.lowest_price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Highest Price</Text>
                    <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                      {data.currency} {data.highest_price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Stores</Text>
                    <Text style={styles.statValue}>{data.stores_count}</Text>
                  </View>
                </View>
              </View>

              {/* Competitors List */}
              <Text style={styles.sectionHeader}>Available Stores</Text>
              {(data.comparison || (data as any)?.stores || []).map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.storeCard,
                    item.is_lowest_price && styles.lowestStoreCard,
                  ]}
                >
                  <View style={styles.storeCardLeft}>
                    <View style={styles.storeNameRow}>
                      <Text style={styles.storeName}>{item.store_name}</Text>
                      {item.is_lowest_price ? (
                        <View style={styles.lowestBadge}>
                          <Ionicons name="trophy" size={12} color="#fff" />
                          <Text style={styles.lowestBadgeText}>Lowest Price</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.stockStatus}>
                      {item.in_stock ? '● In Stock' : '○ Out of stock'}
                    </Text>

                    {!item.is_lowest_price && item.price_diff_from_lowest > 0 ? (
                      <Text style={styles.priceDiff}>
                        +{item.currency} {item.price_diff_from_lowest.toFixed(2)} more than lowest
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.storeCardRight}>
                    <Text style={[styles.storePrice, item.is_lowest_price && { color: colors.success }]}>
                      {item.currency} {item.price.toFixed(2)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleOpenStore(item)}
                      style={[
                        styles.visitBtn,
                        item.is_lowest_price && styles.visitBtnPrimary,
                      ]}
                    >
                      <Text style={[styles.visitBtnText, item.is_lowest_price && { color: '#fff' }]}>
                        Buy Now
                      </Text>
                      <Ionicons
                        name="open-outline"
                        size={12}
                        color={item.is_lowest_price ? '#fff' : colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  compareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  compareBadgeText: {
    color: '#1D68ED',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2EFFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  body: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  savingsCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  savingsSubtitle: {
    fontSize: 13,
    color: '#166534',
    marginTop: 4,
  },
  highlightText: {
    color: '#0F172A',
    fontWeight: '800',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(21, 128, 61, 0.2)',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  lowestStoreCard: {
    backgroundColor: '#ECFDF5',
  },
  storeCardLeft: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  lowestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  lowestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  stockStatus: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 3,
    fontWeight: '600',
  },
  priceDiff: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
    fontWeight: '600',
  },
  storeCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  storePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  visitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2EFFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 0,
  },
  visitBtnPrimary: {
    backgroundColor: '#1D68ED',
  },
  visitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D68ED',
  },
});
