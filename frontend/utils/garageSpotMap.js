const DEFAULT_COLS = 6;

export function buildTheaterLayout(spots, cols = DEFAULT_COLS) {
  if (!Array.isArray(spots) || spots.length === 0) {
    return { cols, rows: [] };
  }

  const columnCount = Math.max(1, Math.min(cols, spots.length));
  const rowCount = Math.ceil(spots.length / columnCount);
  const rows = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const rowLabel = String.fromCharCode(65 + rowIndex);
    const seats = [];

    for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
      const spotIndex = rowIndex * columnCount + colIndex;
      const spot = spots[spotIndex];

      if (!spot) {
        seats.push(null);
        continue;
      }

      seats.push({
        ...spot,
        rowIndex,
        colIndex,
        rowLabel,
        seatLabel:
          spot.seatLabel ||
          spot.label ||
          `${rowLabel}${colIndex + 1}`,
      });
    }

    rows.push({
      id: rowLabel,
      label: rowLabel,
      seats,
    });
  }

  return {
    cols: columnCount,
    rows,
  };
}

export function mapLivePredictionSpots(payload) {
  if (!Array.isArray(payload?.spots) || payload.spots.length === 0) {
    return [];
  }

  return payload.spots.map((spot, index) => ({
    id: spot.spot_id ?? index,
    occupied: Boolean(spot.occupied),
    label: `Spot ${(spot.spot_id ?? index) + 1}`,
    source: 'live',
  }));
}

export function mapStaticLevelLayout(layout) {
  if (!Array.isArray(layout) || layout.length === 0) {
    return [];
  }

  return layout.map((cell, index) => {
    const rowLabel = String.fromCharCode(65 + Math.floor(index / DEFAULT_COLS));
    const colNumber = (index % DEFAULT_COLS) + 1;

    return {
      id: index,
      occupied: cell !== 'open',
      label: `${rowLabel}${colNumber}`,
      seatLabel: `${rowLabel}${colNumber}`,
      source: 'static',
    };
  });
}

export function countOpenSpots(spots) {
  if (!Array.isArray(spots)) {
    return 0;
  }

  return spots.filter((spot) => !spot.occupied).length;
}
