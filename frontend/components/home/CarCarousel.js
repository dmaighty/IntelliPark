import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { spacing, radius, shadow, globalStyles } from '../../styles/global';
import { getCarDisplayName, getCarSubtitle } from '../../utils/carUtils';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = width - 64;
const SNAP_INTERVAL = CARD_WIDTH + spacing.cardGap;

export default function CarCarousel({
  carData,
  visibleCars,
  scrollX,
  scrollViewRef,
  onAddCarPress,
  onOpenMenu,
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
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const snappedIndex = Math.round(offsetX / SNAP_INTERVAL);
          onCardSnap?.(snappedIndex, snappedIndex * SNAP_INTERVAL);
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
                  { transform: [{ scale }], opacity },
                ]}
              >
                <TouchableOpacity
                  style={styles.addCarContent}
                  activeOpacity={0.9}
                  onPress={onAddCarPress}
                >
                  <Text style={styles.addCarPlus}>＋</Text>
                  <Text style={styles.addCarText}>Add Car</Text>
                  <Text style={styles.addCarSubtext}>Up to 7 vehicles</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          }

          return (
            <Animated.View
              key={car.id}
              style={[
                styles.carCard,
                { transform: [{ scale }], opacity },
              ]}
            >
              <TouchableOpacity
                style={styles.cardMenuButton}
                activeOpacity={0.8}
                onPress={() => onOpenMenu?.(car)}
              >
                <Text style={styles.cardMenuText}>⋯</Text>
              </TouchableOpacity>

              <Image
                source={car.image}
                style={styles.carImage}
                resizeMode="contain"
              />

              <Text style={styles.carTitle}>{getCarDisplayName(car)}</Text>

              <View style={styles.carMetaRow}>
                {!!car.year && <Text style={styles.carMetaText}>{car.year}</Text>}
                {!!car.year && !!car.licensePlate && (
                  <Text style={styles.carMetaDot}>•</Text>
                )}
                {!!car.licensePlate && (
                  <Text style={styles.carMetaText}>{car.licensePlate}</Text>
                )}
              </View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.currentCarNameRow}>
        {carData.map((car, index) => {
          const inputRange = [
            (index - 1) * SNAP_INTERVAL,
            index * SNAP_INTERVAL,
            (index + 1) * SNAP_INTERVAL,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            <Animated.Text
              key={car.id}
              style={[styles.currentCarName, { opacity }]}
            >
              {car.isAddCard ? 'Add a new vehicle' : getCarSubtitle(car)}
            </Animated.Text>
          );
        })}
      </View>

      {carData.length > 1 && (
        <View style={globalStyles.centeredRow}>
          {carData.map((_, index) => {
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
                key={index}
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
    paddingRight: spacing.screen - spacing.cardGap,
  },

  carCard: {
    position: 'relative',
    width: CARD_WIDTH,
    minHeight: height * 0.22,
    borderRadius: radius.large,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.cardGap,
    backgroundColor: '#f8f8f8',
    ...shadow.card,
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
    zIndex: 5,
  },

  cardMenuText: {
    fontSize: 22,
    lineHeight: 22,
    color: '#111',
    fontWeight: '700',
    marginTop: -6,
  },

  carImage: {
    width: '100%',
    height: 95,
    marginBottom: 12,
  },

  carTitle: {
    width: '100%',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
  },

  carMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 18,
  },

  carMetaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  carMetaDot: {
    marginHorizontal: 6,
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
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
    minHeight: 140,
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

  currentCarNameRow: {
    height: 28,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  currentCarName: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginHorizontal: 4,
    marginTop: 6,
  },
});