import React from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { shadow } from '../../styles/global';

export default function CarMenuModal({
  visible,
  menuCar,
  carName,
  isTracked = false,
  canNavigateToCar = false,
  onClose,
  onEdit,
  onTrack,
  onMarkParked,
  onNavigateToCar,
  onRemove,
}) {
  const title = carName || menuCar?.title || 'Vehicle';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable style={styles.menuSheet} onPress={() => {}}>
          <Text style={styles.menuTitle}>{title}</Text>

          <TouchableOpacity
            style={styles.menuAction}
            activeOpacity={0.85}
            onPress={onTrack}
          >
            <Text style={styles.menuActionText}>
              {isTracked
                ? 'Driving with this car'
                : 'Drive with this car'}
            </Text>
          </TouchableOpacity>

          {onMarkParked ? (
            <TouchableOpacity
              style={styles.menuAction}
              activeOpacity={0.85}
              onPress={onMarkParked}
            >
              <Text style={styles.menuActionText}>Mark parked here</Text>
            </TouchableOpacity>
          ) : null}

          {canNavigateToCar && onNavigateToCar ? (
            <TouchableOpacity
              style={styles.menuAction}
              activeOpacity={0.85}
              onPress={onNavigateToCar}
            >
              <Text style={styles.menuActionText}>Navigate to car</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.menuAction}
            activeOpacity={0.85}
            onPress={onEdit}
          >
            <Text style={styles.menuActionText}>Edit details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuAction, styles.menuActionDanger]}
            activeOpacity={0.85}
            onPress={onRemove}
          >
            <Text style={styles.menuActionDangerText}>Remove car</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCancel}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text style={styles.menuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },

  menuSheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    ...shadow.card,
  },

  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },

  menuAction: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  menuActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  menuActionDanger: {
    backgroundColor: '#fff1f1',
  },

  menuActionDangerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c62828',
  },

  menuCancel: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  menuCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});