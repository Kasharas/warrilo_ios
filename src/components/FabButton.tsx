import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

interface FabButtonProps {
  onPress: () => void;
}

export function FabButton({ onPress }: FabButtonProps) {
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <Ionicons name="add" size={28} color={theme.colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 15, // Just 15px above bottom navigation icons
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
});