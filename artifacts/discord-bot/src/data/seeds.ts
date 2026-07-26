export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SeedData {
  id: string;
  name: string;
  emoji: string;
  growTimeMs: number;   // milliseconds
  yieldMin: number;
  yieldMax: number;
  sellPrice: number;    // per unit
  buyPrice: number;
  seasons: Season[];
  rarity: "common" | "uncommon" | "rare" | "legendary";
}

export const SEEDS: Record<string, SeedData> = {
  carrot: {
    id: "carrot",
    name: "Cà rốt",
    emoji: "🥕",
    growTimeMs: 30 * 60 * 1000,
    yieldMin: 2, yieldMax: 5,
    sellPrice: 10, buyPrice: 5,
    seasons: ["spring", "summer", "autumn", "winter"],
    rarity: "common",
  },
  tomato: {
    id: "tomato",
    name: "Cà chua",
    emoji: "🍅",
    growTimeMs: 60 * 60 * 1000,
    yieldMin: 2, yieldMax: 4,
    sellPrice: 20, buyPrice: 10,
    seasons: ["spring", "summer"],
    rarity: "common",
  },
  pumpkin: {
    id: "pumpkin",
    name: "Bí ngô",
    emoji: "🎃",
    growTimeMs: 2 * 60 * 60 * 1000,
    yieldMin: 1, yieldMax: 3,
    sellPrice: 50, buyPrice: 25,
    seasons: ["autumn"],
    rarity: "uncommon",
  },
  strawberry: {
    id: "strawberry",
    name: "Dâu tây",
    emoji: "🍓",
    growTimeMs: 45 * 60 * 1000,
    yieldMin: 3, yieldMax: 6,
    sellPrice: 15, buyPrice: 8,
    seasons: ["spring", "summer"],
    rarity: "common",
  },
  mushroom: {
    id: "mushroom",
    name: "Nấm",
    emoji: "🍄",
    growTimeMs: 30 * 60 * 1000,
    yieldMin: 2, yieldMax: 5,
    sellPrice: 8, buyPrice: 4,
    seasons: ["autumn", "winter"],
    rarity: "common",
  },
  tulip: {
    id: "tulip",
    name: "Hoa tulip",
    emoji: "🌷",
    growTimeMs: 90 * 60 * 1000,
    yieldMin: 1, yieldMax: 3,
    sellPrice: 30, buyPrice: 15,
    seasons: ["spring"],
    rarity: "uncommon",
  },
  watermelon: {
    id: "watermelon",
    name: "Dưa hấu",
    emoji: "🍉",
    growTimeMs: 3 * 60 * 60 * 1000,
    yieldMin: 1, yieldMax: 2,
    sellPrice: 80, buyPrice: 40,
    seasons: ["summer"],
    rarity: "uncommon",
  },
  sweet_potato: {
    id: "sweet_potato",
    name: "Khoai lang",
    emoji: "🍠",
    growTimeMs: 2 * 60 * 60 * 1000,
    yieldMin: 2, yieldMax: 4,
    sellPrice: 40, buyPrice: 20,
    seasons: ["autumn", "winter"],
    rarity: "common",
  },
  snow_flower: {
    id: "snow_flower",
    name: "Hoa tuyết",
    emoji: "❄️",
    growTimeMs: 2 * 60 * 60 * 1000,
    yieldMin: 1, yieldMax: 2,
    sellPrice: 60, buyPrice: 30,
    seasons: ["winter"],
    rarity: "rare",
  },
  golden_flower: {
    id: "golden_flower",
    name: "Hoa vàng",
    emoji: "🌻",
    growTimeMs: 4 * 60 * 60 * 1000,
    yieldMin: 1, yieldMax: 1,
    sellPrice: 150, buyPrice: 75,
    seasons: ["spring"],
    rarity: "legendary",
  },
  corn: {
    id: "corn",
    name: "Bắp ngô",
    emoji: "🌽",
    growTimeMs: 90 * 60 * 1000,
    yieldMin: 2, yieldMax: 5,
    sellPrice: 25, buyPrice: 12,
    seasons: ["summer", "autumn"],
    rarity: "common",
  },
  cherry: {
    id: "cherry",
    name: "Anh đào",
    emoji: "🍒",
    growTimeMs: 3 * 60 * 60 * 1000,
    yieldMin: 2, yieldMax: 5,
    sellPrice: 45, buyPrice: 22,
    seasons: ["spring"],
    rarity: "uncommon",
  },
};

export function getSeedById(id: string): SeedData | undefined {
  return SEEDS[id];
}

export function getSeedsByShopTier(season: Season): SeedData[] {
  return Object.values(SEEDS).filter(s => s.seasons.includes(season));
}
