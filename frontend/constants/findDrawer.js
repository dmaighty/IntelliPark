import { Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const DRAWER_HEIGHT = height * 0.88;
export const COLLAPSED_VISIBLE_HEIGHT = 52;
export const MID_VISIBLE_HEIGHT = height * 0.45;
export const FULL_VISIBLE_HEIGHT = height * 0.82;

export const FULL_OFFSET = DRAWER_HEIGHT - FULL_VISIBLE_HEIGHT;
export const MID_OFFSET = DRAWER_HEIGHT - MID_VISIBLE_HEIGHT;
export const COLLAPSED_OFFSET = DRAWER_HEIGHT - COLLAPSED_VISIBLE_HEIGHT;