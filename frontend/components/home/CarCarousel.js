import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';

import {
  spacing,
  radius,
  shadow,
  globalStyles,
  colors,
} from '../../styles/global';

import { getCarDisplayName } from '../../utils/carUtils';
import CarStatusRow from './CarStatusRow';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = width - 64;
const SNAP_INTERVAL = CARD_WIDTH + spacing.cardGap;

export default function CarCarousel({
  carData,
  scrollX,
  scrollViewRef,
  onAddCarPress,
  onOpenMenu,
  onCarPress,
  onScrollToCard,
  onCardSnap,
}) {
  return (
    <View style={styles.carsSection}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.carsScroll}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  x: scrollX,
                },
              },
            },
          ],
          {
            useNativeDriver: false,
          }
        )}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const snappedIndex = Math.round(
            offsetX / SNAP_INTERVAL
          );

          onCardSnap?.(
            snappedIndex,
            snappedIndex * SNAP_INTERVAL
          );
        }}
        scrollEventThrottle={16}
      >
        {carData.map((car, index) => {
          const inputRange = [
            (index - 1) * SNAP_INTERVAL,
            index * SNAP_INTERVAL,
            (index + 1) * SNAP_INTERVAL,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.96, 1, 0.96],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.82, 1, 0.82],
            extrapolate: 'clamp',
          });

          if (car.isAddCard) {
            return (
              <Animated.View
                key={car.id}
                style={[
                  styles.carCard,
                  styles.addCarCard,
                  {
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.addCarContent}
                  activeOpacity={0.9}
                  onPress={onAddCarPress}
                >
                  <Text style={styles.addCarPlus}>＋</Text>

                  <Text style={styles.addCarText}>
                    Add Car
                  </Text>

                  <Text style={styles.addCarSubtext}>
                    Up to 7 vehicles
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          }

          const carName = getCarDisplayName(car);

          return (
            <Animated.View
              key={car.id}
              style={[
                styles.carCard,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.cardPressable,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => onCarPress?.(car)}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${carName}`}
              >
                <Pressable
                  style={styles.cardMenuButton}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    onOpenMenu?.(car);
                  }}
                >
                  <Text style={styles.cardMenuText}>
                    ⋯
                  </Text>
                </Pressable>

                {car.isCurrentVehicle && (
                  <View style={styles.currentVehicleBadge}>
                    <Text
                      style={styles.currentVehicleBadgeText}
                    >
                      Driving
                    </Text>
                  </View>
                )}

                <Image
                  source={car.image}
                  style={styles.carImage}
                  resizeMode="contain"
                />

                <Text
                  style={styles.carTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {carName}
                </Text>

                <CarStatusRow
                  status={car.status}
                  parkedAt={car.parkedAt}
                  speedMph={car.lastKnownSpeedMph}
                  parkedLotName={car.parkedLotName}
                />
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {carData.length > 1 && (
        <View style={globalStyles.centeredRow}>
          {carData.map((car, index) => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 20, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.28, 1, 0.28],
              extrapolate: 'clamp',
            });

            return (
              <TouchableOpacity
                key={car.id ?? index}
                activeOpacity={0.8}
                onPress={() => onScrollToCard?.(index)}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carsSection: {
    marginBottom: spacing.large,
  },

  carsScroll: {
    paddingLeft: spacing.screen,
    paddingRight:
      spacing.screen - spacing.cardGap,
  },

  carCard: {
    position: 'relative',
    width: CARD_WIDTH,
    minHeight: height * 0.22,
    borderRadius: radius.large,
    marginRight: spacing.cardGap,
    backgroundColor: colors.surface,
    ...shadow.card,
  },

  cardPressable: {
    flex: 1,
    width: '100%',
    minHeight: height * 0.22,
    borderRadius: radius.large,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  cardPressed: {
    opacity: 0.72,
  },

  cardMenuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ededed',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  cardMenuText: {
    fontSize: 22,
    lineHeight: 22,
    color: '#111',
    fontWeight: '700',
    marginTop: -6,
  },

  currentVehicleBadge: {
    position: 'absolute',
    top: 13,
    left: 14,
    minHeight: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#e8f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  currentVehicleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007aff',
  },

  carImage: {
    width: '100%',
    height: 95,
    marginBottom: 10,
  },

  carTitle: {
    width: '100%',
    paddingHorizontal: 8,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  addCarCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#c7c7c7',
    backgroundColor: '#fafafa',
  },

  addCarContent: {
    flex: 1,
    width: '100%',
    minHeight: height * 0.22,
    borderRadius: radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addCarPlus: {
    fontSize: 34,
    color: '#222',
    marginBottom: 8,
  },

  addCarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  addCarSubtext: {
    fontSize: 13,
    color: '#666',
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginHorizontal: 4,
    marginTop: 12,
  },
});