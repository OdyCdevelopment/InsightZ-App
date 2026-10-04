import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nearbyApi } from '../api/endpoints';
import { NearbyOffer } from '../types/api';

const { width } = Dimensions.get('window');

const SEARCH_RADIUS_KM = 5;

export const NearbyScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [offers, setOffers] = useState<NearbyOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<NearbyOffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Pulse animation for location beacon
  const radarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(radarAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [radarAnim]);

  const fetchNearbyOffers = useCallback(async (radius = SEARCH_RADIUS_KM) => {
    setLoading(true);
    try {
      const data = await nearbyApi.getNearbyOffers({ radiusKm: radius });
      setOffers(data);
      if (data.length > 0) {
        setSelectedOffer(data[0]);
      } else {
        setSelectedOffer(null);
      }
    } catch (err) {
      console.error('Failed to load nearby offers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearbyOffers(SEARCH_RADIUS_KM);
  }, [fetchNearbyOffers]);

  const handleRefreshLocation = () => {
    fetchNearbyOffers(SEARCH_RADIUS_KM);
  };

  const radarScale = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.4],
  });

  const radarOpacity = radarAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.4, 0.15, 0],
  });

  return (
    <View style={styles.container}>
      {/* 1. Full Screen Clean Map Canvas */}
      <View style={styles.mapCanvas}>
        {/* Flat Minimal Road Network & Buildings */}
        <View style={styles.mapBldg1} />
        <View style={styles.mapBldg2} />
        <View style={styles.mapBldg3} />
        <View style={styles.mapBldg4} />
        <View style={styles.mapRiver} />
        <View style={styles.mapRoadMain} />
        <View style={styles.mapRoadBranch} />
        <View style={styles.mapRoadCross} />

        {/* Minimal Street Label */}
        <View style={styles.streetLabelWrap}>
          <Text style={styles.streetLabelText}>Brown Road • 5km Shopping Radius</Text>
        </View>

        {/* Route Line to Selected Store */}
        {selectedOffer ? (
          <View
            style={[
              styles.routeLine,
              {
                left: '50%',
                top: '44%',
                width: Math.hypot(
                  (selectedOffer.coords.x - 50) * 3.4,
                  (selectedOffer.coords.y - 44) * 3.4
                ),
                transform: [
                  {
                    rotate: `${Math.atan2(
                      selectedOffer.coords.y - 44,
                      selectedOffer.coords.x - 50
                    )}rad`,
                  },
                ],
              },
            ]}
          />
        ) : null}

        {/* User Location Center Beacon */}
        <View style={styles.userLocationBeacon}>
          <Animated.View
            style={[
              styles.radarCircle,
              {
                transform: [{ scale: radarScale }],
                opacity: radarOpacity,
              },
            ]}
          />
          <View style={styles.userDotCenter}>
            <View style={styles.userDotInner} />
          </View>
          <View style={styles.userLocationBadge}>
            <Text style={styles.userLocationBadgeText}>Your Location</Text>
          </View>
        </View>

        {/* Shop/Store Location Markers on Map */}
        {offers.map((offer) => {
          const isSelected = selectedOffer?.id === offer.id;
          return (
            <TouchableOpacity
              key={offer.id}
              activeOpacity={0.85}
              style={[
                styles.storePinWrapper,
                { left: `${offer.coords.x}%`, top: `${offer.coords.y}%` },
              ]}
              onPress={() => setSelectedOffer(offer)}
            >
              <View style={[styles.storePinBadge, isSelected && styles.storePinBadgeSelected]}>
                <Text style={styles.pinDiscountText}>{offer.discount}</Text>
              </View>
              <View style={[styles.storePinIcon, isSelected && styles.storePinIconSelected]}>
                <Ionicons
                  name="storefront"
                  size={13}
                  color={isSelected ? '#FFFFFF' : '#0F172A'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Flat Top Location Bar */}
      <View style={styles.floatingTopBar}>
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.floatingAddressCard}
            activeOpacity={0.85}
            onPress={handleRefreshLocation}
          >
            <Ionicons name="storefront" size={17} color="#0F172A" />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressTitle}>Road 13/A, Gulshan 2</Text>
              <Text style={styles.addressSubTitle}>
                {offers.length} stores with offers within 5km
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingCircleBtn}
            activeOpacity={0.8}
            onPress={handleRefreshLocation}
          >
            <Ionicons name="refresh" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Floating GPS Re-Center Button */}
      <TouchableOpacity
        style={styles.floatingGpsBtn}
        activeOpacity={0.85}
        onPress={handleRefreshLocation}
      >
        <Ionicons name="locate" size={20} color="#0F172A" />
      </TouchableOpacity>

      {/* 4. Minimalist Flat Bottom Offer Sheet */}
      <View style={styles.compactBottomSheet}>
        {/* Clean Drag Handle */}
        <View style={styles.dragHandle} />

        {/* Compact Flat Offer Cards (No shadows, No ratings, No emojis) */}
        {loading ? (
          <View style={styles.compactLoading}>
            <ActivityIndicator size="small" color="#0F172A" />
            <Text style={styles.compactLoadingText}>Scanning stores within 5km...</Text>
          </View>
        ) : offers.length === 0 ? (
          <View style={styles.compactEmpty}>
            <Text style={styles.compactEmptyText}>No stores found within 5km.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compactCardList}
          >
            {offers.map((offer) => {
              return (
                <TouchableOpacity
                  key={offer.id}
                  activeOpacity={0.9}
                  style={styles.compactCard}
                  onPress={() => setSelectedOffer(offer)}
                >
                  {/* Thumbnail with Red Discount Tag */}
                  <View style={styles.compactThumbWrap}>
                    <Image
                      source={{ uri: offer.storeImage }}
                      style={styles.compactThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.compactSaleTag}>
                      <Text style={styles.compactSaleText}>{offer.discount}</Text>
                    </View>
                  </View>

                  {/* Store Details */}
                  <View style={styles.compactInfo}>
                    <Text style={styles.compactStoreName} numberOfLines={1}>
                      {offer.storeName}
                    </Text>

                    <View style={styles.compactMetaRow}>
                      <Ionicons name="storefront-outline" size={11} color="#64748B" />
                      <Text style={styles.compactDistText}>
                        {offer.distanceFormatted}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Map View
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  mapBldg1: {
    position: 'absolute',
    left: '8%',
    top: '18%',
    width: 110,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapBldg2: {
    position: 'absolute',
    right: '10%',
    top: '22%',
    width: 95,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapBldg3: {
    position: 'absolute',
    left: '12%',
    top: '55%',
    width: 90,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapBldg4: {
    position: 'absolute',
    right: '15%',
    top: '58%',
    width: 80,
    height: 85,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapRiver: {
    position: 'absolute',
    left: -40,
    top: '30%',
    width: 140,
    height: 260,
    borderRadius: 70,
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  mapRoadMain: {
    position: 'absolute',
    left: '42%',
    top: 0,
    bottom: 0,
    width: 44,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '12deg' }],
  },
  mapRoadBranch: {
    position: 'absolute',
    left: 0,
    top: '40%',
    right: 0,
    height: 36,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-8deg' }],
  },
  mapRoadCross: {
    position: 'absolute',
    left: '20%',
    top: '65%',
    right: '-10%',
    height: 32,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '6deg' }],
  },
  streetLabelWrap: {
    position: 'absolute',
    top: '36%',
    left: '30%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 4,
  },
  streetLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },

  // Route Line
  routeLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#0F172A',
    borderStyle: 'dashed',
    zIndex: 6,
  },

  // User Beacon
  userLocationBeacon: {
    position: 'absolute',
    left: '50%',
    top: '44%',
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  radarCircle: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  userDotCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  userDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  userLocationBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  userLocationBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  // Store Map Markers (Shop icon with red tag)
  storePinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 9,
  },
  storePinBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginBottom: 2,
  },
  storePinBadgeSelected: {
    backgroundColor: '#0F172A',
  },
  pinDiscountText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  storePinIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  storePinIconSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },

  // Floating Top Header (Flat, no shadow)
  floatingTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    left: 14,
    right: 14,
    zIndex: 25,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingAddressCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  addressSubTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },

  // Floating GPS Button (Flat, no shadow)
  floatingGpsBtn: {
    position: 'absolute',
    right: 16,
    bottom: 145,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 25,
  },

  // Compact Flat Bottom Sheet
  compactBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    zIndex: 20,
  },
  dragHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 8,
  },

  // Compact Offer Cards (Flat, no hover click, no shadow)
  compactCardList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  compactCard: {
    width: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactThumbWrap: {
    width: '100%',
    height: 68,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
  },
  compactThumb: {
    width: '100%',
    height: '100%',
  },
  compactSaleTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  compactSaleText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  compactInfo: {
    paddingHorizontal: 1,
  },
  compactStoreName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactDistText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },

  compactLoading: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  compactLoadingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  compactEmpty: {
    paddingVertical: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  compactEmptyText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
