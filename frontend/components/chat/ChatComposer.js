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

export default function ChatComposer({
  message,
  setMessage,
  images = [],
  onAddImage,
  onRemoveImage,
  onSend,
  onFocus,
  onPressContainer,
  isSending = false,
  inputRef,
  composerBoxMinHeight,
  inputHeight = 28,
  onInputHeightChange,
  editable = true,
  variant = 'chat',
  autoFocus = false,
}) {
  const canSend =
    !isSending &&
    (message.trim().length > 0 || images.length > 0);

  const isHome = variant === 'home';

  const inputField = (
    <TextInput
      ref={inputRef}
      autoFocus={autoFocus}
      style={[
        styles.input,
        {
          height: Math.max(28, Math.min(110, inputHeight)),
        },
      ]}
      placeholder="Ask anything..."
      placeholderTextColor="#777"
      value={message}
      onChangeText={setMessage}
      onFocus={onFocus}
      onContentSizeChange={(event) => {
        onInputHeightChange?.(event.nativeEvent.contentSize.height);
      }}
      multiline
      editable={editable && !isSending}
      scrollEnabled={inputHeight >= 110}
      blurOnSubmit={false}
    />
  );

  return (
    <Animated.View
      style={[
        isHome ? styles.homeShell : styles.chatShell,
        composerBoxMinHeight
          ? { minHeight: composerBoxMinHeight }
          : isHome
            ? styles.homeDefaultMinHeight
            : null,
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
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
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

      {onPressContainer ? (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPressContainer}
          style={styles.inputArea}
        >
          {inputField}
        </TouchableOpacity>
      ) : (
        <View style={styles.inputArea}>{inputField}</View>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={isHome ? styles.homeFooterAction : styles.iconButton}
          activeOpacity={0.85}
          onPress={onAddImage}
          disabled={isSending}
        >
          {isHome ? (
            <Text style={styles.homeFooterActionText}>＋</Text>
          ) : (
            <Ionicons name="add" size={22} color="#111" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            isHome ? styles.homeSendAction : styles.sendButton,
            !canSend &&
              (isHome ? styles.homeSendActionDisabled : styles.sendButtonDisabled),
          ]}
          activeOpacity={0.85}
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
  );
}

const styles = StyleSheet.create({
  homeShell: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#fff',
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  homeDefaultMinHeight: {
    minHeight: 88,
  },

  chatShell: {
    borderRadius: 22,
    backgroundColor: '#f4f5f7',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
    minHeight: 72,
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

  inputArea: {
    minHeight: 28,
  },

  input: {
    fontSize: 16,
    color: '#111',
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e9eaee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeFooterAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e9eaee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeFooterActionText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '600',
    lineHeight: 18,
  },

  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  sendButtonDisabled: {
    backgroundColor: '#e9eaee',
  },

  homeSendAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeSendActionDisabled: {
    backgroundColor: '#e9eaee',
  },
});
