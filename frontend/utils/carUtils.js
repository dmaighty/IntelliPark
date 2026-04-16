export const getCarDisplayName = (car) => {
    if (!car) return '';
    return car.make?.trim() || car.title?.trim() || 'Untitled Car';
  };
  
  export const getCarSubtitle = (car) => {
    if (!car) return '';
    return [car.year, car.make || car.title].filter(Boolean).join(' ').trim();
  };