export interface WalkPlace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceM: number;
}

export interface WalkAiRecommendation {
  answer: string;
  places: WalkPlace[];
  temperature?: string;
  precipitationType?: string;
  humidity?: string;
}
