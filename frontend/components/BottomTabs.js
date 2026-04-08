import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = height * 0.105;

export default function BottomTabs({
  activeScreen,
  onFindPress,
  onChatPress,
  onHomePress,
  onPastPress,
  onProfilePress,
}) {
  const tabs = [
    { key: 'find', label: 'Find', onPress: onFindPress, icon: '⌕' },
    { key: 'chat', label: 'Chat', onPress: onChatPress, icon: '◦' },
    { key: 'home', label: 'Home', onPress: onHomePress, icon: '⌂' },
    { key: 'past', label: 'Past', onPress: onPastPress, icon: '↺' },
    { key: 'profile', label: 'Profile', onPress: onProfilePress, icon: '◎' },
  ];

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.bottomTabBar}>
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={tab.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.tempIconWrap,
                    isActive && styles.activeTempIconWrap,
                  ]}
                >
                  <Text
                    style={[
                      styles.tempIcon,
                      isActive && styles.activeTempIcon,
                    ]}
                  >
                    {tab.icon}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  bottomTabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
    paddingTop: 2,
    paddingBottom: 2,
  },

  tabItem: {
    flex: 1,
    height: '100%',
  },

  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },

  tempIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  activeTempIconWrap: {
    backgroundColor: '#f3f4f6',
  },

  tempIcon: {
    fontSize: 22,
    color: '#666',
    fontWeight: '600',
    lineHeight: 22,
  },

  activeTempIcon: {
    color: '#000',
  },

  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  activeTabLabel: {
    color: '#000',
    fontWeight: '700',
  },
});