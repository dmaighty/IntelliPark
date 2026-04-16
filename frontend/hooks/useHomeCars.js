import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getCarDisplayName } from '../utils/carUtils';

export default function useHomeCars({
  cars,
  onEditCarPress,
  onRemoveCarPress,
}) {
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [menuCar, setMenuCar] = useState(null);

  const visibleCars = useMemo(() => cars.slice(0, 7), [cars]);

  const carData = useMemo(
    () => [...visibleCars, { id: 'add', isAddCard: true }],
    [visibleCars]
  );

  const selectedCar = useMemo(() => {
    if (!visibleCars.length) return null;
    return visibleCars[Math.min(currentCarIndex, visibleCars.length - 1)];
  }, [visibleCars, currentCarIndex]);

  useEffect(() => {
    if (!visibleCars.length) {
      setCurrentCarIndex(0);
      return;
    }

    if (currentCarIndex > visibleCars.length - 1) {
      setCurrentCarIndex(visibleCars.length - 1);
    }
  }, [visibleCars.length, currentCarIndex]);

  const openMenu = useCallback((car) => {
    setMenuCar(car);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuCar(null);
  }, []);

  const handleEditCar = useCallback(() => {
    if (!menuCar) return;
    const carToEdit = menuCar;
    setMenuCar(null);
    onEditCarPress?.(carToEdit);
  }, [menuCar, onEditCarPress]);

  const handleRemoveCar = useCallback(() => {
    if (!menuCar) return;

    const carToRemove = menuCar;
    setMenuCar(null);

    Alert.alert(
      'Remove car',
      `Remove ${getCarDisplayName(carToRemove)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveCarPress?.(carToRemove.id),
        },
      ]
    );
  }, [menuCar, onRemoveCarPress]);

  return {
    visibleCars,
    carData,
    selectedCar,
    currentCarIndex,
    setCurrentCarIndex,
    menuCar,
    openMenu,
    closeMenu,
    handleEditCar,
    handleRemoveCar,
  };
}