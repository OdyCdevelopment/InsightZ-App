import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { CompareModal } from '../components/CompareModal';
import { SetAlertModal } from '../components/SetAlertModal';
import { WishlistItem, PriceAlertItem, Product } from '../types/api';
import { wishlistApi, alertsApi, clicksApi } from '../api/endpoints';

export const WishlistScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'alerts'>('wishlist');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareVisible, setCompareVisible] = useState(false);
  const [alertProduct, setAlertProduct] = useState<Product | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [w, a] = await Promise.all([
        wishlistApi.getWishlist(),
        alertsApi.getAlerts(),
      ]);
      setWishlist(Array.isArray(w) ? w : []);
      setAlerts(Array.isArray(a) ? a : []);
    } catch (err) {
      console.error('Wishlist load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatPrice = (price: any, currency = 'Rs.') => {
    if (price === null || price === undefined) return `${currency} 0`;
    const num = typeof price === 'number' ? price : parseFloat(String(price));
    if (isNaN(num)) return `${currency} 0`;
    return `${currency} ${num.toLocaleString()}`;
  };

  const handleRemoveWishlist = async (productId: number) => {
    await wishlistApi.removeFromWishlist(productId).catch(() => {});
    setWishlist((prev) => (prev || []).filter((item) => item.product_id !== productId));
  };

  const handleDeleteAlert = async (productId: number) => {
    await alertsApi.deleteAlert(productId).catch(() => {});
    setAlerts((prev) => (prev || []).filter((item) => item.product_id !== productId));
  };

  const handleOpenStore = (item: any) => {
    const url = item?.product_url || 'https://google.com';
    clicksApi.trackClick(item?.id || item?.product_id, item?.store || 'Store', url);
    Linking.openURL(url).catch(() => {});
  };

  const triggeredCount = (alerts || []).filter((a) => a.is_target_met).length;

  return (
    <View style={styles.container}>
      <Header
        title="Saved & Alerts"
        subtitle="Monitor price drops and receive instant target notifications"
        showBack={true}
        onBack={() => {
          if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation?.navigate('Home');
          }
        }}
      />

      {/* Segment Selector */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'wishlist' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={activeTab === 'wishlist' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'wishlist' && styles.segmentTextActive]}>
            Wishlist ({wishlist?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'alerts' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('alerts')}
        >
          <Ionicons
            name="notifications"
            size={16}
            color={activeTab === 'alerts' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'alerts' && styles.segmentTextActive]}>
            Price Alerts ({alerts?.length || 0})
          </Text>
          {triggeredCount > 0 ? (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{triggeredCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking saved products & price alerts...</Text>
        </View>
      ) : activeTab === 'wishlist' ? (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => String(item.id || item.product_id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="heart-dislike-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
              <Text style={styles.emptySubtitle}>Tap the heart icon on any product to track it here</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (!item.product) return null;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.88}
                onPress={() =>
                  navigation?.navigate('ProductDetail', {
                    product: item.product,
                    productId: item.product.id,
                  })
                }
              >
                <Image
                  source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80' }}
                  style={styles.thumbnail}
                />
                <View style={styles.infoCol}>
                  <View style={styles.storeBadge}>
                    <Text style={styles.storeBadgeText}>{item.product.store || 'Verified Store'}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.product.title}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>
                      {formatPrice(item.product.price, item.product.currency)}
                    </Text>
                    {item.is_target_reached ? (
                      <View style={styles.targetMetTag}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                        <Text style={styles.targetMetText}>Target Met!</Text>
                      </View>
                    ) : item.price_alert_threshold ? (
                      <Text style={styles.thresholdText}>
                        Goal: {formatPrice(item.price_alert_threshold, item.product.currency)}
                      </Text>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() =>
                        navigation?.navigate('ProductDetail', {
                          product: item.product,
                          productId: item.product.id,
                        })
                      }
                    >
                      <Ionicons name="eye-outline" size={13} color={colors.primary} />
                      <Text style={styles.actionPillText}>Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => {
                        setAlertProduct(item.product);
                        setAlertModalVisible(true);
                      }}
                    >
                      <Ionicons name="notifications-outline" size={13} color={colors.warning} />
                      <Text style={[styles.actionPillText, { color: colors.warning }]}>Set Alert</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveWishlist(item.product_id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No active price alerts</Text>
              <Text style={styles.emptySubtitle}>Set price thresholds on items to receive drop alerts</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.alertCard,
                item.is_target_met && styles.alertCardTriggered,
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertStatusRow}>
                  <Ionicons
                    name={item.is_target_met ? 'checkmark-circle' : 'time-outline'}
                    size={16}
                    color={item.is_target_met ? colors.success : colors.warning}
                  />
                  <Text
                    style={[
                      styles.alertStatusText,
                      { color: item.is_target_met ? colors.success : colors.warning },
                    ]}
                  >
                    {item.is_target_met ? 'Price Target Met!' : 'Monitoring Price'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteAlert(item.product_id)}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.alertTitle} numberOfLines={2}>
                {item.product?.title || 'Product Alert'}
              </Text>

              {/* Price Target Comparison Box */}
              <View style={styles.alertMetricBox}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Target Goal</Text>
                  <Text style={styles.metricTarget}>
                    {formatPrice(item.target_price, item.product?.currency)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Current Price</Text>
                  <Text
                    style={[
                      styles.metricCurrent,
                      item.is_target_met && { color: colors.success },
                    ]}
                  >
                    {formatPrice(item.current_price, item.product?.currency)}
                  </Text>
                </View>
              </View>

              {/* Difference Message */}
              <View style={styles.alertFooter}>
                <Text style={styles.diffMessage}>
                  {item.is_target_met
                    ? `Great deal! Currently below your target.`
                    : `Monitoring price drops to reach your target.`}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.buyStoreBtn,
                    item.is_target_met && styles.buyStoreBtnActive,
                  ]}
                  onPress={() => handleOpenStore(item.product)}
                >
                  <Text
                    style={[
                      styles.buyStoreBtnText,
                      item.is_target_met && { color: '#fff' },
                    ]}
                  >
                    View at {item.product.store}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={13}
                    color={item.is_target_met ? '#fff' : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modals */}
      <CompareModal
        visible={compareVisible}
        product={selectedProduct}
        onClose={() => setCompareVisible(false)}
      />

      <SetAlertModal
        visible={alertModalVisible}
        product={alertProduct}
        onClose={() => setAlertModalVisible(false)}
        onSuccess={loadData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 4,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#1D68ED',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badgeCount: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
    gap: 12,
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F3F8FE',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  storeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2EFFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0,
  },
  storeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D68ED',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  targetMetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  targetMetText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  thresholdText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D68ED',
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  alertCardTriggered: {
    backgroundColor: '#F0FDF4',
    borderWidth: 0,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertStatusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertMetricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricTarget: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 2,
  },
  metricCurrent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  alertFooter: {
    gap: 10,
  },
  diffMessage: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  buyStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2EFFC',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 0,
  },
  buyStoreBtnActive: {
    backgroundColor: '#16A34A',
  },
  buyStoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D68ED',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 30,
  },
});
