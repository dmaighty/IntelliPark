import React, { useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const SIDE_PADDING = 24;
const CARD_GAP = 16;
const CARD_WIDTH = width - 64;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const cars = [
  {
    id: 1,
    year: '2024',
    title: 'Toyota Camry',
    image: require('../assets/car.png'),
  },
  {
    id: 2,
    year: '2023',
    title: 'Honda Civic',
    image: require('../assets/car.png'),
  },
  {
    id: 3,
    year: '2022',
    title: 'Tesla Model 3',
    image: require('../assets/car.png'),
  },
];

const garages = [
  { id: 1, name: 'North Garage', spots: '24 spots open' },
  { id: 2, name: 'South Garage', spots: '12 spots open' },
  { id: 3, name: 'West Lot', spots: '7 spots open' },
];

export default function HomeScreen({ onProfilePress }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  const carData = [...cars.slice(0, 7), { id: 'add', isAddCard: true }];

  const scrollToCard = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SNAP_INTERVAL,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          <Image
            source={require('../assets/profile.png')}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

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
                  <TouchableOpacity style={styles.addCarContent}>
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
                <Image
                  source={car.image}
                  style={styles.carImage}
                  resizeMode="contain"
                />
                <Text style={styles.carYear}>{car.year}</Text>
                <Text style={styles.carTitle}>{car.title}</Text>
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

            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [6, 0, 6],
              extrapolate: 'clamp',
            });

            return (
              <Animated.Text
                key={car.id}
                style={[
                  styles.currentCarName,
                  {
                    opacity,
                    transform: [{ translateY }],
                  },
                ]}
              >
                {car.isAddCard ? 'Add a new vehicle' : `${car.year} ${car.title}`}
              </Animated.Text>
            );
          })}
        </View>

        {carData.length > 1 && (
          <View style={styles.pagination}>
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
                  onPress={() => scrollToCard(index)}
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

      <View style={styles.garagesSection}>
        <Text style={styles.sectionTitle}>Parking Garages</Text>

        {garages.map((garage) => (
          <TouchableOpacity key={garage.id} style={styles.garageCard}>
            <Text style={styles.garageName}>{garage.name}</Text>
            <Text style={styles.garageSpots}>{garage.spots}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: SIDE_PADDING,
    alignItems: 'flex-start',
  },
  profileButton: {
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

  carsSection: {
    marginBottom: 28,
  },
  carsScroll: {
    paddingLeft: SIDE_PADDING,
    paddingRight: SIDE_PADDING - CARD_GAP,
  },
  carCard: {
    width: CARD_WIDTH,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: CARD_GAP,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  carImage: {
    width: '100%',
    height: 180,
    marginBottom: 16,
  },
  carYear: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  carTitle: {
    fontSize: 22,
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
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCarPlus: {
    fontSize: 44,
    color: '#222',
    marginBottom: 10,
  },
  addCarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  addCarSubtext: {
    fontSize: 14,
    color: '#666',
  },

  currentCarNameRow: {
    height: 28,
    marginTop: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCarName: {
    position: 'absolute',
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginHorizontal: 4,
  },

  garagesSection: {
    flex: 1,
    paddingHorizontal: SIDE_PADDING,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  garageCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  garageName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  garageSpots: {
    fontSize: 14,
    color: '#555',
  },
});