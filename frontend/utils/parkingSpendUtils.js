export function parseRatePerHour(rateStr) {
  if (!rateStr) {
    return 0;
  }

  const normalized = String(rateStr).toLowerCase();

  if (
    normalized.includes('free') ||
    normalized === '$0' ||
    normalized === '$0/hr'
  ) {
    return 0;
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function getDurationMinutes(startIso, endIso = new Date().toISOString()) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(0, Math.ceil((end - start) / 60000));
}

export function calculateParkingSpend(rateStr, parkedAt, endedAt) {
  const hourlyRate = parseRatePerHour(rateStr);

  if (!hourlyRate || !parkedAt) {
    return 0;
  }

  const minutes = getDurationMinutes(parkedAt, endedAt);
  const billedHours = Math.max(1, Math.ceil(minutes / 60));

  return billedHours * hourlyRate;
}

export function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function formatSpendLabel(rateStr, parkedAt, endedAt) {
  const total = calculateParkingSpend(rateStr, parkedAt, endedAt);
  return formatCurrency(total);
}

export function computeParkingStats(history = [], now = Date.now()) {
  const completed = history.filter(
    (item) => !item.isActive && item.parkedAt && item.endedAt
  );

  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let weeklyMinutes = 0;
  let monthlyMinutes = 0;
  let weeklySpend = 0;
  let monthlySpend = 0;
  const garageCounts = new Map();

  completed.forEach((item) => {
    const endedAt = new Date(item.endedAt).getTime();
    const minutes = getDurationMinutes(item.parkedAt, item.endedAt);
    const spend = calculateParkingSpend(item.rate, item.parkedAt, item.endedAt);
    const garageLabel = item.lotName || item.locationLabel || 'Unknown';

    garageCounts.set(garageLabel, (garageCounts.get(garageLabel) || 0) + 1);

    if (endedAt >= weekAgo) {
      weeklyMinutes += minutes;
      weeklySpend += spend;
    }

    if (endedAt >= monthAgo) {
      monthlyMinutes += minutes;
      monthlySpend += spend;
    }
  });

  const mostUsedGarage =
    [...garageCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'None yet';

  return {
    weeklyMinutes,
    monthlyMinutes,
    weeklySpend,
    monthlySpend,
    mostUsedGarage,
    sessionCount: completed.length,
  };
}

export function formatMinutesLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function enrichHistoryItemWithSpend(item) {
  const endedAt = item.isActive ? new Date().toISOString() : item.endedAt;
  const total = formatSpendLabel(item.rate, item.parkedAt, endedAt);

  return {
    ...item,
    total,
    duration:
      item.duration ||
      formatMinutesLabel(getDurationMinutes(item.parkedAt, endedAt)),
  };
}
