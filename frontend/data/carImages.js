export const CAR_IMAGES = {
    blue: {
      image: require('../assets/car-blue.png'),
      parkedImage: require('../assets/parked-blue-car.png'),
    },
  
    silver: {
      image: require('../assets/car-silver.png'),
      parkedImage: require('../assets/parked-silver-car.png'),
    },
  
    white: {
      image: require('../assets/car-white.png'),
      parkedImage: require('../assets/parked-white-car.png'),
    },
  
    yellow: {
      image: require('../assets/car-yellow.png'),
      parkedImage: require('../assets/parked-yellow-car.png'),
    },
  
    black: {
      image: require('../assets/car-black.png'),
      parkedImage: require('../assets/parked-black-car.png'),
    },
  
    red: {
      image: require('../assets/car-red.png'),
      parkedImage: require('../assets/parked-red-car.png'),
    },
  };
  
  export const getCarImages = (colorId) => {
    const normalizedColor = String(colorId || '')
      .trim()
      .toLowerCase();
  
    return CAR_IMAGES[normalizedColor] || CAR_IMAGES.silver;
  };