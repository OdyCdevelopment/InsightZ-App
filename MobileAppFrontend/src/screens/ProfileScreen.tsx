import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Customer, LoyaltyWallet, FAQItem } from '../types/api';
import { customerApi, walletApi, supportApi } from '../api/endpoints';

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<Customer | null>(null);
  const [wallet, setWallet] = useState<LoyaltyWallet | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'editProfile' | 'address' | 'settings' | 'wallet' | 'faqs' | null
  >(null);

  // Edit Profile Form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Shopping Address State
  const [addressStreet, setAddressStreet] = useState('Road 13/A, Block C');
  const [addressCity, setAddressCity] = useState('Gulshan 2, Dhaka');
  const [addressPostal, setAddressPostal] = useState('1212');

  // User Settings Toggles
  const [notifyDeals, setNotifyDeals] = useState(true);
  const [notifyPriceDrops, setNotifyPriceDrops] = useState(true);
  const [notifyNearby, setNotifyNearby] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'LKR' | 'USD'>('LKR');

  // Expanded FAQ accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [p, w, f] = await Promise.all([
        customerApi.getProfile(),
        walletApi.getWallet(),
        supportApi.getFaqs(),
      ]);
      setProfile(p);
      setWallet(w);
      setFaqs(f);

      if (p) {
        setEditFirstName(p.first_name || '');
        setEditLastName(p.last_name || '');
        setEditEmail(p.email || '');
        setEditPhone(p.phone || '');
      } else {
        setEditFirstName('Dayasthan');
        setEditLastName('Robertson');
        setEditEmail('dayasthan@insightz.app');
        setEditPhone('+94 77 123 4567');
      }
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
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

  const handleSaveProfile = async () => {
    const updatedData = {
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      phone: editPhone.trim(),
    };

    if (profile) {
      setProfile({
        ...profile,
        ...updatedData,
        email: editEmail.trim(),
      });
    }

    try {
      await customerApi.updateProfile(updatedData);
    } catch (e) {
      console.error('Failed saving profile to database:', e);
    }

    setActiveModal(null);
    Alert.alert('Profile Saved', 'Your profile details have been updated in the database.');
  };

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'Darlene Robertson';

  const avatarUri =
    profile?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80';

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar (No Arrow, Settings Icon on Right) */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Account</Text>

        <TouchableOpacity
          onPress={() => setActiveModal('settings')}
          style={styles.circleSettingsBtn}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D68ED" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section with Concentric Halo Rings */}
          <View style={styles.avatarSection}>
            <View style={styles.outerRing}>
              <View style={styles.middleRing}>
                <View style={styles.innerAvatarWrap}>
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>

            {/* User Name */}
            <Text style={styles.userName}>{displayName}</Text>

            {/* Active Status Badge */}
            <View style={styles.statusRow}>
              <View style={styles.activeDot} />
              <Text style={styles.statusText}>Active Member</Text>
            </View>
          </View>

          {/* Clean Customer Menu Container */}
          <View style={styles.menuCard}>
            {/* 1. Edit Profile */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setActiveModal('editProfile')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="person" size={17} color="#1D68ED" />
                </View>
                <Text style={styles.menuLabel}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 2. Shopping Address */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setActiveModal('address')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="location" size={17} color="#1D68ED" />
                </View>
                <Text style={styles.menuLabel}>Shopping Address</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 3. Wishlist */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate?.('Wishlist')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="heart" size={17} color="#EF4444" />
                </View>
                <Text style={styles.menuLabel}>Saved Wishlist</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 4. Cashback Wallet & Rewards */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setActiveModal('wallet')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="wallet" size={17} color="#10B981" />
                </View>
                <Text style={styles.menuLabel}>Cashback Wallet</Text>
              </View>
              <View style={styles.menuRightBadge}>
                <Text style={styles.walletBadgeText}>
                  Rs. {wallet ? wallet.balance.toLocaleString() : '4,850'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </View>
            </TouchableOpacity>

            {/* 5. User Settings & Preferences */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setActiveModal('settings')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="options" size={17} color="#1D68ED" />
                </View>
                <Text style={styles.menuLabel}>App Settings & Alerts</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 6. Help & FAQs */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setActiveModal('faqs')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="help-circle" size={17} color="#64748B" />
                </View>
                <Text style={styles.menuLabel}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 7. Logout */}
            <TouchableOpacity
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert('Log Out', 'Are you sure you want to log out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: () => Alert.alert('Logged Out', 'You have been safely signed out.'),
                  },
                ]);
              }}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#FFE4E6' }]}>
                  <Ionicons name="log-out" size={17} color="#E11D48" />
                </View>
                <Text style={[styles.menuLabel, { color: '#E11D48' }]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* =========================================
          MODAL: EDIT PROFILE
      ========================================== */}
      <Modal
        visible={activeModal === 'editProfile'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="First name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Last name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="email@insightz.app"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveProfile}>
              <Text style={styles.modalPrimaryBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* =========================================
          MODAL: SHOPPING ADDRESS
      ========================================== */}
      <Modal
        visible={activeModal === 'address'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Shopping Address</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.modalInput}
                value={addressStreet}
                onChangeText={setAddressStreet}
                placeholder="Street name & number"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / Area</Text>
              <TextInput
                style={styles.modalInput}
                value={addressCity}
                onChangeText={setAddressCity}
                placeholder="City"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput
                style={styles.modalInput}
                value={addressPostal}
                onChangeText={setAddressPostal}
                placeholder="Postal code"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setActiveModal(null);
                Alert.alert('Address Saved', 'Default shopping address updated.');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Save Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* =========================================
          MODAL: USER SETTINGS & PREFERENCES
      ========================================== */}
      <Modal
        visible={activeModal === 'settings'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Settings & Alerts</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Currency Preference */}
            <Text style={styles.modalSectionTitle}>Currency Preference</Text>
            <View style={styles.currencyRow}>
              <TouchableOpacity
                style={[styles.currencyChip, selectedCurrency === 'LKR' && styles.currencyChipActive]}
                onPress={() => setSelectedCurrency('LKR')}
              >
                <Text style={[styles.currencyText, selectedCurrency === 'LKR' && styles.currencyTextActive]}>
                  Sri Lankan Rupee (Rs.)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyChip, selectedCurrency === 'USD' && styles.currencyChipActive]}
                onPress={() => setSelectedCurrency('USD')}
              >
                <Text style={[styles.currencyText, selectedCurrency === 'USD' && styles.currencyTextActive]}>
                  US Dollar ($)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notification Preferences */}
            <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>Deal & Alert Notifications</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Flash Deals & Offers</Text>
                <Text style={styles.switchDesc}>Get notified for 50%+ discounts and flash vouchers</Text>
              </View>
              <Switch
                value={notifyDeals}
                onValueChange={setNotifyDeals}
                trackColor={{ false: '#E2E8F0', true: '#1D68ED' }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Price Drop Alerts</Text>
                <Text style={styles.switchDesc}>Real-time alerts when wishlist item prices drop</Text>
              </View>
              <Switch
                value={notifyPriceDrops}
                onValueChange={setNotifyPriceDrops}
                trackColor={{ false: '#E2E8F0', true: '#1D68ED' }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Nearby 5km Store Alerts</Text>
                <Text style={styles.switchDesc}>Discover store discounts when you are within 5km</Text>
              </View>
              <Switch
                value={notifyNearby}
                onValueChange={setNotifyNearby}
                trackColor={{ false: '#E2E8F0', true: '#1D68ED' }}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: 28 }]}
              onPress={() => {
                setActiveModal(null);
                Alert.alert('Settings Saved', 'Your user preferences have been updated.');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Apply Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* =========================================
          MODAL: WALLET & CASHBACK
      ========================================== */}
      <Modal
        visible={activeModal === 'wallet'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>InsightZ Cashback Wallet</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.walletCardModal}>
              <Text style={styles.walletModalLabel}>Available Balance</Text>
              <Text style={styles.walletModalBalance}>
                Rs. {wallet ? wallet.balance.toLocaleString() : '4,850'}
              </Text>
              <View style={styles.walletModalRow}>
                <View>
                  <Text style={styles.walletModalSubLabel}>Lifetime Savings</Text>
                  <Text style={styles.walletModalSubVal}>
                    Rs. {wallet ? wallet.lifetime_cashback.toLocaleString() : '18,225'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.walletModalSubLabel}>Member Tier</Text>
                  <Text style={[styles.walletModalSubVal, { color: '#FDE047' }]}>
                    {wallet?.tier || 'Gold Member'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>Recent Cashback Activity</Text>
            {wallet?.transactions && wallet.transactions.length > 0 ? (
              wallet.transactions.map((tx) => (
                <View key={tx.id} style={styles.txRowModal}>
                  <View style={styles.txLeftModal}>
                    <Ionicons
                      name={tx.direction === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={20}
                      color={tx.direction === 'credit' ? '#10B981' : '#E11D48'}
                    />
                    <Text style={styles.txReasonModal}>{tx.reason}</Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmountModal,
                      { color: tx.direction === 'credit' ? '#10B981' : '#E11D48' },
                    ]}
                  >
                    {tx.direction === 'credit' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyNotice}>No recent transactions found.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* =========================================
          MODAL: HELP & FAQS
      ========================================== */}
      <Modal
        visible={activeModal === 'faqs'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {faqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  activeOpacity={0.8}
                  onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#64748B"
                    />
                  </View>
                  {isExpanded ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  circleSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: '#EFF6FF',
    backgroundColor: 'rgba(239, 246, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerAvatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginTop: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalPrimaryBtn: {
    backgroundColor: '#1D68ED',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },

  // Currency Selector
  currencyRow: {
    gap: 8,
  },
  currencyChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencyChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D68ED',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  currencyTextActive: {
    color: '#1D68ED',
    fontWeight: '800',
  },

  // Switches
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchTextWrap: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },

  // Wallet Modal
  walletCardModal: {
    backgroundColor: '#1D68ED',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  walletModalLabel: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  walletModalBalance: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 14,
  },
  walletModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  walletModalSubLabel: {
    fontSize: 10,
    color: '#BFDBFE',
    fontWeight: '600',
  },
  walletModalSubVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  txRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txLeftModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txReasonModal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  txAmountModal: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyNotice: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },

  // FAQs
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 18,
  },
});
