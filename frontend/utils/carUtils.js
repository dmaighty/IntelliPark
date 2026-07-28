export const getCarDisplayName = (car) => {
  if (!car) {
    return 'Untitled Car';
  }

  const userCarName = String(
    car.title || car.name || ''
  ).trim();

  if (userCarName) {
    return userCarName;
  }

  const makeAndModel = String(car.make || '').trim();

  if (makeAndModel) {
    return makeAndModel;
  }

  return 'Untitled Car';
};

export const getCarSubtitle = (car) => {
  if (!car) {
    return '';
  }

  const details = [
    car.year,
    car.make,
  ].filter(Boolean);

  return details.join(' ');
};