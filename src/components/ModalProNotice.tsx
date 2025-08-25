import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';

interface ModalProNoticeProps {
  visible: boolean;
  onClose: () => void;
  onViewPlans: () => void;
}

export function ModalProNotice({ visible, onClose, onViewPlans }: ModalProNoticeProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Feature available in Warrilo Pro</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.neutral[600]} />
            </Pressable>
          </View>
          
          <Text style={styles.message}>
            This feature will be available after upgrade. Try free for 7 days.
          </Text>
          
          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={onViewPlans}>
              <Text style={styles.primaryButtonText}>View Plans</Text>
            </Pressable>
            
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing['2xl'],
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    flex: 1,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  message: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    lineHeight: 24,
    marginBottom: theme.spacing['2xl'],
  },
  actions: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  secondaryButton: {
    borderColor: theme.colors.neutral[300],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[600],
  },
});