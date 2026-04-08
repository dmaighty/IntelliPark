import { StyleSheet } from 'react-native';
import colors from './colors';

/* ---------- SPACING SYSTEM ---------- */
export const spacing = {
  screen: 24,
  xs: 4,
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  section: 28,

  // for carousel / section spacing
  cardGap: 16,
  sectionGap: 28,
};

/* ---------- RADIUS SYSTEM ---------- */
export const radius = {
  small: 12,
  medium: 18,
  large: 24,
  pill: 999,
};

/* ---------- SHADOW SYSTEM ---------- */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};

/* ---------- GLOBAL STYLES ---------- */
export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  sectionPadding: {
    paddingHorizontal: spacing.screen,
  },

  headerRow: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: spacing.screen,
    alignItems: 'flex-start',
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },

  backButtonText: {
    fontSize: 40,
    color: '#000',
  },

  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.large,
    color: '#000',
  },

  label: {
    fontSize: 12,
    color: '#888',
  },

  bodyText: {
    fontSize: 14,
    color: '#000',
  },

  buttonPrimary: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },

  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },

  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonTextSecondary: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: radius.small,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    position: 'relative',
  },

  inputWrapperFocused: {
    borderColor: '#000',
  },

  inputWrapperError: {
    borderColor: '#d32f2f',
  },

  input: {
    fontSize: 16,
    color: '#000',
    padding: 0,
    margin: 0,
  },

  floatingLabel: {
    position: 'absolute',
    top: 8,
    left: 14,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
  },

  errorText: {
    color: '#d32f2f',
    fontSize: 12,
  },

  roundedCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.large,
    padding: spacing.large,
    ...shadow.card,
  },

  softCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: radius.medium,
    padding: spacing.large,
    ...shadow.soft,
  },

  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  centeredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});