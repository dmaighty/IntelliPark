import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  FlatList,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, spacing, radius, shadow, colors } from '../styles/global';
import { sendParkingChat } from '../api/chat';
import ChatComposer from '../components/chat/ChatComposer';
import { pickChatImage } from '../utils/chatAttachments';

export default function ChatScreen({
  onClose,
  initialDraft = { message: '', images: [] },
  sendOnMount = false,
  focusKeyboard = false,
  onDraftChange,
  onDraftConsumed,
}) {
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sendOnMountRef = useRef(sendOnMount);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const shouldFocusOnMountRef = useRef(focusKeyboard);

  const [message, setMessage] = useState(initialDraft.message || '');
  const [images, setImages] = useState(initialDraft.images || []);
  const [inputHeight, setInputHeight] = useState(28);
  const [isSending, setIsSending] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help with parking rules, garage options, street parking, and finding a spot near you.',
    },
  ]);

  useEffect(() => {
    onDraftChange?.({ message, images });
  }, [message, images, onDraftChange]);

  useLayoutEffect(() => {
    if (!focusKeyboard) {
      return;
    }

    onDraftConsumed?.();
  }, [focusKeyboard, onDraftConsumed]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, () => {
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();
      scrollToBottom();
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    if (shouldFocusOnMountRef.current) {
      shouldFocusOnMountRef.current = false;
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, [sheetAnim, scrollToBottom]);

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        setLocationGranted(status === 'granted');
      } catch {
        if (mounted) setLocationGranted(false);
      }
    };

    loadLocation();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function coordsToUserPlace(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const r = results?.[0];
      if (!r) return null;
      const city = r.city || r.district || r.subregion || null;
      const region = r.region || null;
      const country = r.country || null;
      if (!city && !region && !country) return null;
      return {
        ...(city ? { city } : {}),
        ...(region ? { region } : {}),
        ...(country ? { country } : {}),
      };
    } catch {
      return null;
    }
  }

  const handleAddImage = useCallback(async () => {
    const picked = await pickChatImage();

    if (picked) {
      setImages((prev) => [...prev, picked]);
    }
  }, []);

  const handleRemoveImage = useCallback((imageId) => {
    setImages((prev) => prev.filter((image) => image.id !== imageId));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    const outgoingImages = images;

    if ((!trimmed && outgoingImages.length === 0) || isSending) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed || 'What can you tell me about this parking photo?',
      images: outgoingImages,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setMessage('');
    setImages([]);
    setInputHeight(28);
    setIsSending(true);

    try {
      let userPlace = null;
      let locationFallback = null;

      if (locationGranted) {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = loc.coords;
          userPlace = await coordsToUserPlace(latitude, longitude);
          if (!userPlace) {
            locationFallback = {
              latitude,
              longitude,
              accuracy: loc.coords.accuracy ?? undefined,
            };
          }
        } catch {
          /* no location context */
        }
      }

      const history = nextMessages.slice(0, -1).map((item) => ({
        role: item.role,
        text: item.text,
      }));

      const data = await sendParkingChat({
        message: userMessage.text,
        history,
        userPlace,
        userLocation: locationFallback,
        images: outgoingImages,
      });

      const botReply = {
        id: `${Date.now()}-bot`,
        role: 'assistant',
        text: data.reply || 'Sorry, I could not generate a response.',
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      const errorReply = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        text: `Sorry, chat failed: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsSending(false);
    }
  }, [
    message,
    images,
    isSending,
    messages,
    locationGranted,
  ]);

  useEffect(() => {
    if (!sendOnMountRef.current) {
      return;
    }

    sendOnMountRef.current = false;

    const trimmed = (initialDraft.message || '').trim();
    const draftImages = initialDraft.images || [];
    const hasDraft = trimmed.length > 0 || draftImages.length > 0;

    onDraftConsumed?.();

    if (!hasDraft) {
      return;
    }

    const timer = setTimeout(() => {
      handleSend();
    }, 180);

    return () => clearTimeout(timer);
    // Mount-only auto-send when opened from the home composer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderInlineMarkdown = (text, isUser) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text
            key={`md-bold-${idx}`}
            style={[styles.messageText, isUser && styles.userMessageText, styles.boldText]}
          >
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <Text
            key={`md-code-${idx}`}
            style={[styles.messageText, isUser && styles.userMessageText, styles.codeText]}
          >
            {part.slice(1, -1)}
          </Text>
        );
      }
      return (
        <Text key={`md-plain-${idx}`} style={[styles.messageText, isUser && styles.userMessageText]}>
          {part}
        </Text>
      );
    });
  };

  const renderMarkdownText = (text, isUser) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isBullet = line.startsWith('- ') || line.startsWith('* ');
      const content = isBullet ? line.slice(2) : line;
      return (
        <Text key={`line-${idx}`} style={[styles.messageText, isUser && styles.userMessageText]}>
          {isBullet ? '\u2022 ' : ''}
          {renderInlineMarkdown(content, isUser)}
          {idx < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  };

  const composerBoxMinHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [88, 112],
  });

  const renderTypingIndicator = () => {
    if (!isSending) {
      return null;
    }

    return (
      <View style={styles.typingRow}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#111" />
        </View>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>Thinking…</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <KeyboardAvoidingView
        style={styles.screenContent}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Parking Assistant</Text>
            <Text style={styles.headerSubtitle}>Ask about lots, rules, and spots</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          style={styles.messageList}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          ListFooterComponent={renderTypingIndicator}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';

            return (
              <View
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowAssistant,
                ]}
              >
                {!isUser ? (
                  <View style={styles.avatar}>
                    <Ionicons name="sparkles" size={14} color="#111" />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {item.images?.length ? (
                    <View style={styles.messageImagesRow}>
                      {item.images.map((image) => (
                        <Image
                          key={image.id}
                          source={{ uri: image.uri }}
                          style={styles.messageImage}
                        />
                      ))}
                    </View>
                  ) : null}

                  <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                    {renderMarkdownText(item.text, isUser)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.chatSheet}>
          <View style={styles.chatInputRow}>
            <ChatComposer
              variant="home"
              inputRef={inputRef}
              autoFocus={focusKeyboard}
              message={message}
              setMessage={setMessage}
              images={images}
              onAddImage={handleAddImage}
              onRemoveImage={handleRemoveImage}
              onSend={handleSend}
              isSending={isSending}
              composerBoxMinHeight={composerBoxMinHeight}
              inputHeight={inputHeight}
              onInputHeightChange={setInputHeight}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  messageList: {
    flex: 1,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    paddingBottom: 24,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },

  messageRowUser: {
    justifyContent: 'flex-end',
  },

  messageRowAssistant: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef0f4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...shadow.soft,
  },

  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 6,
  },

  userBubble: {
    backgroundColor: '#111',
    borderBottomRightRadius: 6,
  },

  messageImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },

  messageImage: {
    width: 120,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },

  messageText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 21,
  },

  userMessageText: {
    color: '#fff',
  },

  boldText: {
    fontWeight: '700',
  },

  codeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },

  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  typingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  chatSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    ...shadow.card,
  },

  chatInputRow: {
    width: '100%',
  },
});
