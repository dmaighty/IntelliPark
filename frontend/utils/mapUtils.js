export const DEFAULT_COORDS = {
    latitude: 37.3352,
    longitude: -121.8811,
  };
  
  export const DEFAULT_LAT_DELTA = 0.006;
  export const DEFAULT_LNG_DELTA = 0.006;
  
  export const FOCUSED_LAT_DELTA = 0.0035;
  export const FOCUSED_LNG_DELTA = 0.0035;
  
  export const USER_VIEW_LAT_DELTA = 0.012;
  export const USER_VIEW_LNG_DELTA = 0.012;
  
  export const USER_VIEW_ZOOM = 17;
  export const CAR_VIEW_ZOOM = 17;
  export const CAR_CENTER_OFFSET = -0.0012;
  export const USER_CENTER_OFFSET = -0.0012;
  
  export const buildRegion = (
    coordinate,
    latitudeDelta = DEFAULT_LAT_DELTA,
    longitudeDelta = DEFAULT_LNG_DELTA
  ) => ({
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta,
    longitudeDelta,
  });