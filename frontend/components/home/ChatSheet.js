import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadow } from '../../styles/global';

export default function ChatSheet({
  composerSheetHeight,
  composerBoxMinHeight,
  tabBarHeight,
  message,
  setMessage,
  images = [],
  onAddImage,
  onRemoveImage,
  onSend,
  onOpenChat,
}) {
  const canSend = message.trim().length > 0 || images.length > 0;

  return (
    <Animated.View
      style={[
        styles.chatSheet,
        {
          height: composerSheetHeight,
          paddingBottom: tabBarHeight + 10,
        },
      ]}
    >
      <View style={styles.chatInputRow}>
        <Animated.View
          style={[
            styles.chatInputWrap,
            {
              minHeight: composerBoxMinHeight,
            },
          ]}
        >
          {images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagePreviewRow}
            >
              {images.map((image) => (
                <View key={image.id} style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => onRemoveImage?.(image.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => onOpenChat?.({ focusKeyboard: true })}
            style={styles.inputTapArea}
          >
            <TextInput
              style={styles.chatInput}
              placeholder="Ask anything..."
              placeholderTextColor="#777"
              value={message}
              onChangeText={setMessage}
              multiline
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>

          <View style={styles.inputFooterRow}>
            <TouchableOpacity
              style={styles.footerAction}
              activeOpacity={0.8}
              onPress={onAddImage}
            >
              <Text style={styles.footerActionText}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendAction,
                !canSend && styles.sendActionDisabled,
              ]}
              activeOpacity={0.8}
              onPress={onSend}
              disabled={!canSend}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={canSend ? '#fff' : '#999'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chatSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 12,
    zIndex: 10,
    ...shadow.card,
  },

  chatInputRow: {
    flexDirection: 'row',
  },

  chatInputWrap: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#fff',
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  imagePreviewRow: {
    gap: 8,
    paddingBottom: 8,
  },

  imagePreviewWrap: {
    position: 'relative',
  },

  imagePreview: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },

  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputTapArea: {
    flex: 1,
    minHeight: 28,
  },

  chatInput: {
    flex: 1,
    minHeight: 28,
    maxHeight: 110,
    fontSize: 16,
    color: '#111',
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
  },

  inputFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  footerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e9eaee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerActionText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '600',
    lineHeight: 18,
  },

  sendAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendActionDisabled: {
    backgroundColor: '#e9eaee',
  },
});
