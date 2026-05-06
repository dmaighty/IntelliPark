import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Keyboard,
  Platform,
  FlatList,
} from 'react-native';
import { globalStyles, spacing, radius, shadow } from '../styles/global';
import { sendParkingChat } from '../api/chat';

export default function ChatScreen({ onClose }) {
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(28);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: 'Hi! How can I help you today?',
    },
  ]);

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

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;

      Animated.parallel([
        Animated.timing(sheetAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: false,
        }),
        Animated.timing(keyboardOffset, {
          toValue: keyboardHeight - 50,
          duration: 220,
          useNativeDriver: false,
        }),
      ]).start();
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      Animated.parallel([
        Animated.timing(sheetAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    });

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
      clearTimeout(timer);
    };
  }, [sheetAnim, keyboardOffset]);

  const composerBoxMinHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 98],
  });

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setMessage('');
    setInputHeight(28);
    setIsSending(true);

    try {
      const history = nextMessages.slice(0, -1).map((item) => ({
        role: item.role,
        text: item.text,
      }));
      const data = await sendParkingChat({
        message: trimmed,
        history,
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
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.screenContent}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.role === 'user' && styles.userMessageText,
                ]}
              >
                {renderMarkdownText(item.text, item.role === 'user')}
              </Text>
            </View>
          )}
        />

        <Animated.View
          style={[
            styles.chatSheet,
            {
              transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }],
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
              <TextInput
                ref={inputRef}
                autoFocus
                style={[
                  styles.chatInput,
                  {
                    height: Math.max(28, Math.min(110, inputHeight)),
                  },
                ]}
                placeholder="Ask anything..."
                placeholderTextColor="#777"
                value={message}
                onChangeText={setMessage}
                onContentSizeChange={(event) => {
                  setInputHeight(event.nativeEvent.contentSize.height);
                }}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                multiline
                editable={!isSending}
                scrollEnabled={inputHeight >= 110}
                returnKeyType="send"
              />

              <View style={styles.inputFooterRow}>
                <TouchableOpacity style={styles.footerAction} activeOpacity={0.8}>
                  <Text style={styles.footerActionText}>＋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.footerAction, styles.sendAction, isSending && styles.sendActionDisabled]}
                  activeOpacity={0.8}
                  onPress={handleSend}
                  disabled={isSending}
                >
                  <Text style={styles.sendActionText}>
                    {isSending ? '...' : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },

  topBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 30,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '700',
    lineHeight: 18,
  },

  messagesContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 60,
    paddingBottom: 140,
  },

  messageBubble: {
    maxWidth: '80%',
    borderRadius: radius.medium,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...shadow.soft,
  },

  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f8f8',
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#000',
  },

  messageText: {
    fontSize: 15,
    color: '#000',
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

  chatSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
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

  chatInput: {
    fontSize: 16,
    color: '#000',
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
    width: 'auto',
    paddingHorizontal: 12,
    backgroundColor: '#111',
  },

  sendActionDisabled: {
    opacity: 0.6,
  },

  sendActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});