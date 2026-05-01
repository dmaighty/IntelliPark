import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { globalStyles, spacing, radius, shadow } from '../styles/global';
import { getMyProfile } from '../api/users';

export default function ProfileScreen({ accessToken, onBack, onSignOut }) {
  const [profileImage, setProfileImage] = useState(
    require('../assets/profile.png')
  );
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) {
        setProfileError('Not signed in');
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      setProfileError('');
      try {
        const data = await getMyProfile(accessToken);
        if (data?.detail) {
          throw new Error(data.detail);
        }
        setProfile(data);
      } catch (e) {
        setProfileError(e.message || 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [accessToken]);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    <SafeAreaView style={globalStyles.screen}>
      <View style={styles.topSection}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={globalStyles.backButton}>
            <Text style={globalStyles.backButtonText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentInset}>
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

            {loadingProfile ? (
              <ActivityIndicator color="#111" />
            ) : (
              <>
                <Text style={styles.name}>
                  {profile?.full_name || 'Unknown User'}
                </Text>
                {profileError ? (
                  <Text style={styles.subText}>{profileError}</Text>
                ) : (
                  <Text style={styles.subText}>{profile?.email || ''}</Text>
                )}
              </>
            )}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: spacing.screen,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  contentInset: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },

  signOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.medium,
    backgroundColor: '#f3f4f6',
  },

  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  profileImageWrapper: {
    position: 'relative',
    marginBottom: spacing.large,
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
    borderRadius: radius.medium,
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

  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },

  menuSection: {
    width: '100%',
    paddingHorizontal: 2,
  },

  menuCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.medium,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.soft,
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