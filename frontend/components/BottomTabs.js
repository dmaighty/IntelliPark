import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    {
      key: 'find',
      label: 'Find',
      onPress: onFindPress,
      icon: 'location-outline',
      activeIcon: 'location',
    },
    {
      key: 'chat',
      label: 'Chat',
      onPress: onChatPress,
      icon: 'chatbubble-ellipses-outline',
      activeIcon: 'chatbubble-ellipses',
    },
    {
      key: 'home',
      label: 'Home',
      onPress: onHomePress,
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      key: 'past',
      label: 'History',
      onPress: onPastPress,
      icon: 'arrow-undo-outline',
      activeIcon: 'arrow-undo',
    },
    {
      key: 'profile',
      label: 'Profile',
      onPress: onProfilePress,
      isProfile: true,
    },
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
                    styles.iconWrap,
                    isActive && styles.activeIconWrap,
                  ]}
                >
                  {tab.isProfile ? (
                    <Image
                      source={require('../assets/profile.png')}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={22}
                      color={isActive ? '#000' : '#666'}
                    />
                  )}
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

  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  activeIconWrap: {
    backgroundColor: '#f3f4f6',
  },

  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
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