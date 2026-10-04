import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Product } from '../types/api';
import { alertsApi } from '../api/endpoints';

interface SetAlertModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SetAlertModal: React.FC<SetAlertModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
}) => {
  const [targetPrice, setTargetPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const handleSave = async () => {
    const val = parseFloat(targetPrice);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid price threshold');
      return;
    }
    if (val >= product.price) {
      setError(`Target price should be lower than current price (${product.currency} ${product.price})`);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await alertsApi.setAlert(product.id, val);
      setTargetPrice('');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setError('Could not set alert. Please check your backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications" size={20} color={colors.warning} />
            </View>
            <Text style={styles.title}>Set Price Drop Alert</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <View style={styles.currentPriceRow}>
            <Text style={styles.currentLabel}>Current Lowest Price:</Text>
            <Text style={styles.currentValue}>
              {product.currency} {product.price.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.inputLabel}>Alert me when price drops below:</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>{product.currency}</Text>
            <TextInput
              style={styles.input}
              placeholder={(product.price * 0.9).toFixed(2)}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={targetPrice}
              onChangeText={(text) => {
                setTargetPrice(text);
                setError('');
              }}
            />
          </View>

          {/* Quick % chips */}
          <View style={styles.quickChips}>
            {[5, 10, 15, 20].map((pct) => {
              const calc = (product.price * (1 - pct / 100)).toFixed(2);
              return (
                <TouchableOpacity
                  key={pct}
                  style={styles.chip}
                  onPress={() => setTargetPrice(calc)}
                >
                  <Text style={styles.chipText}>-{pct}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Track This Price</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginLeft: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2EFFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '500',
  },
  currentPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0,
  },
  currentLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 14,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D68ED',
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  quickChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E2EFFC',
    alignItems: 'center',
    borderWidth: 0,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D68ED',
  },
  errorText: {
    color: '#E11D48',
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D68ED',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 0,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
