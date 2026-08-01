import { useEffect, useState } from 'react';

export default function useStatusRefreshTick(active = false, intervalMs = 30000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTick((value) => value + 1);
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [active, intervalMs]);

  return tick;
}
