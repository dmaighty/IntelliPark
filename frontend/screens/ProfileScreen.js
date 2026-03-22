import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ onBack, onSignOut }) {
  const [profileImage, setProfileImage] = useState(
    require('../assets/profile.png')
  );

  const handleEditPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to change your profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const handleMenuPress = (item) => {
    console.log(`${item} pressed`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.profileImageWrapper}>
            <Image source={profileImage} style={styles.profileImage} />

            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={handleEditPhoto}
            >
              <Text style={styles.editPhotoText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>Sarah Liang</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('Personal Info')}
          >
            <Text style={styles.menuTitle}>Personal Info</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('My Vehicles')}
          >
            <Text style={styles.menuTitle}>My Vehicles</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('My History')}
          >
            <Text style={styles.menuTitle}>My History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('Notification Settings')}
          >
            <Text style={styles.menuTitle}>Notification Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('Payment Method')}
          >
            <Text style={styles.menuTitle}>Payment Method</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('Saved Garages')}
          >
            <Text style={styles.menuTitle}>Saved Garages</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('Help and Support')}
          >
            <Text style={styles.menuTitle}>Help and Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('Privacy & Security')}
          >
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => handleMenuPress('App Settings')}
          >
            <Text style={styles.menuTitle}>App Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },

  topBar: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
  },
  backArrow: {
    fontSize: 30,
    color: '#000',
  },
  signOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 18,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editPhotoButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  editPhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },

  menuSection: {
    width: '100%',
  },
  menuCard: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuArrow: {
    fontSize: 22,
    color: '#888',
  },
});