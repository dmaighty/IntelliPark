import { getCarImages } from './carImages';

export const CAR_STATUS = {
  PARKED: 'parked',
  DRIVING: 'driving',
};

const blackImages = getCarImages('black');
const whiteImages = getCarImages('white');
const redImages = getCarImages('red');

const parkedRecently = () =>
  new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

export const defaultCars = [
  {
    id: 1,
    year: '2024',
    title: 'Toyota Camry',
    make: 'Toyota Camry',
    licensePlate: '8ABC123',
    color: 'Black',
    colorId: 'black',
    image: blackImages.image,
    parkedImage: blackImages.parkedImage,
    status: CAR_STATUS.PARKED,
    bluetoothDeviceId: null,
    bluetoothDeviceName: null,
    tripStartedAt: null,
    tripDistanceMeters: 0,
    parkedAt: parkedRecently(),
    parkedLocation: {
      latitude: 37.3329,
      longitude: -121.8808,
    },
    parkedLotName: 'South Garage',
    parkedLotAddress: '330 S 7th St, San Jose, CA',
    parkedLotRate: '$4/hr',
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
    parkedAt: parkedRecently(),
    parkedLocation: {
      latitude: 37.3342,
      longitude: -121.8851,
    },
    parkedLotName: 'West Garage',
    parkedLotAddress: '355 S 4th St, San Jose, CA',
    parkedLotRate: '$5/hr',
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
    status: CAR_STATUS.DRIVING,
    bluetoothDeviceId: null,
    bluetoothDeviceName: null,
    tripStartedAt: new Date().toISOString(),
    tripDistanceMeters: 0,
    parkedAt: null,
    parkedLocation: {
      latitude: 37.3376,
      longitude: -121.8831,
    },
    parkedLotName: null,
    parkedLotAddress: null,
    parkedLotRate: null,
  },
];
