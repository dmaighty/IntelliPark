import { getCarImages } from './carImages';

export const CAR_STATUS = {
  PARKED: 'parked',
  DRIVING: 'driving',
};

const blackImages = getCarImages('black');
const whiteImages = getCarImages('white');
const redImages = getCarImages('red');

export const defaultCars = [
  {
    id: 1,
    year: '2024',
    title: 'Toyota Camry',
    make: 'Toyota Camry',
    licensePlate: '8ABC123',
    color: 'Black',
    colorId: 'black',

    // Carousel and details image
    image: blackImages.image,

    // Map marker image
    parkedImage: blackImages.parkedImage,

    status: CAR_STATUS.PARKED,

    bluetoothDeviceId: null,
    bluetoothDeviceName: null,

    tripStartedAt: null,
    tripDistanceMeters: 0,

    parkedAt: null,
    parkedLocation: {
      latitude: 37.3356,
      longitude: -121.881,
    },
  },

  {
    id: 2,
    year: '2023',
    title: 'Honda Civic',
    make: 'Honda Civic',
    licensePlate: '8XYZ456',
    color: 'White',
    colorId: 'white',

    image: whiteImages.image,
    parkedImage: whiteImages.parkedImage,

    status: CAR_STATUS.PARKED,

    bluetoothDeviceId: null,
    bluetoothDeviceName: null,

    tripStartedAt: null,
    tripDistanceMeters: 0,

    parkedAt: null,
    parkedLocation: {
      latitude: 37.3364,
      longitude: -121.8789,
    },
  },

  {
    id: 3,
    year: '2022',
    title: 'Tesla Model 3',
    make: 'Tesla Model 3',
    licensePlate: '9TES789',
    color: 'Red',
    colorId: 'red',

    image: redImages.image,
    parkedImage: redImages.parkedImage,

    status: CAR_STATUS.PARKED,

    bluetoothDeviceId: null,
    bluetoothDeviceName: null,

    tripStartedAt: null,
    tripDistanceMeters: 0,

    parkedAt: null,
    parkedLocation: {
      latitude: 37.3348,
      longitude: -121.8832,
    },
  },
];