import React from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { shadow } from '../../styles/global';

export default function ParkedPhotoPrompt({
  visible,
  carName = 'your car',
  onTakePhoto,
  onSkip,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <Pressable style={styles.overlay} onPress={onSkip}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Save parked spot photo?</Text>
          <Text style={styles.body}>
            Snap the level, row, or sign near {carName} so it is easier to find
            later in garages.
          </Text>

          <TouchableOpacity
            style={styles.primaryAction}
            activeOpacity={0.85}
            onPress={onTakePhoto}
          >
            <Text style={styles.primaryActionText}>Take photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            activeOpacity={0.85}
            onPress={onSkip}
          >
            <Text style={styles.secondaryActionText}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },

  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...shadow.card,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },

  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 18,
  },

  primaryAction: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  secondaryAction: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
  },
});
