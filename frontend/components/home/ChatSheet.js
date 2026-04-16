import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { radius, shadow } from '../../styles/global';

export default function ChatSheet({
  composerSheetHeight,
  composerBoxMinHeight,
  tabBarHeight,
  message,
  setMessage,
  onInputFocus,
  onChatPress,
}) {
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
          <TextInput
            style={styles.chatInput}
            placeholder="Ask anything..."
            placeholderTextColor="#777"
            value={message}
            onChangeText={setMessage}
            onFocus={onInputFocus}
            multiline
          />

          <View style={styles.inputFooterRow}>
            <TouchableOpacity
              style={styles.footerAction}
              activeOpacity={0.8}
              onPress={onChatPress}
            >
              <Text style={styles.footerActionText}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerAction}
              activeOpacity={0.8}
              onPress={onChatPress}
            >
              <Image
                source={require('../../assets/microphone.png')}
                style={styles.footerIcon}
                resizeMode="contain"
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

  footerIcon: {
    width: 18,
    height: 18,
  },
});