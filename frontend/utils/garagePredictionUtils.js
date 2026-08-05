import { getDistanceMiles } from './findUtils';

const AVERAGE_CITY_MPH = 24;

function getGarageTotalSpaces(garage) {
  if (garage?.totalSpaces) {
    return Number(garage.totalSpaces);
  }

  if (Array.isArray(garage?.levels) && garage.levels.length > 0) {
    return garage.levels.reduce(
      (sum, level) => sum + (level.layout?.length || level.openSpots || 0),
      0
    );
  }

  return 40;
}

export function estimateDriveMinutes(distanceMiles) {
  if (!distanceMiles || distanceMiles <= 0) {
    return 1;
  }

  return Math.max(1, Math.round((distanceMiles / AVERAGE_CITY_MPH) * 60));
}

export function formatDriveEta(distanceMiles) {
  const minutes = estimateDriveMinutes(distanceMiles);
  return `${minutes} min drive`;
}

export function formatUpdatedAgo(timestamp) {
  if (!timestamp) {
    return 'Updated recently';
  }

  const minutes = Math.floor((Date.now() - timestamp) / 60000);

  if (minutes < 1) {
    return 'Updated just now';
  }

  if (minutes === 1) {
    return 'Updated 1 min ago';
  }

  return `Updated ${minutes} min ago`;
}

export function rankGaragesForUser(referencePoint, garages = []) {
  if (!referencePoint || !garages.length) {
    return [];
  }

  const withDistance = garages.map((garage) => {
    const distanceMiles = getDistanceMiles(referencePoint, garage);
    const totalSpaces = getGarageTotalSpaces(garage);
    const openNow = garage.spotsOpen ?? 0;
    const distanceScore = 1 / (1 + distanceMiles);
    const availabilityScore = totalSpaces ? openNow / totalSpaces : 0;
    const ratingScore = (Number(garage.rating) || 4) / 5;
    const score =
      availabilityScore * 0.5 +
      distanceScore * 0.3 +
      ratingScore * 0.2;

    return {
      ...garage,
      distanceMiles,
      driveMinutes: estimateDriveMinutes(distanceMiles),
      driveEtaLabel: formatDriveEta(distanceMiles),
      rankingScore: score,
    };
  });

  return withDistance.sort((a, b) => b.rankingScore - a.rankingScore);
}
