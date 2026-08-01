export const DEFAULT_PROFILE_IMAGE = require('../assets/profile.png');

export function getProfileImageSource(profileImageUrl) {
  if (profileImageUrl) {
    return { uri: profileImageUrl };
  }

  return DEFAULT_PROFILE_IMAGE;
}

export function buildProfileImageDataUrl(base64, mimeType = 'image/jpeg') {
  if (!base64) {
    return null;
  }

  return `data:${mimeType};base64,${base64}`;
}
