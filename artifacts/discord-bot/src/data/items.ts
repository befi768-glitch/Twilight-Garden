export interface ItemData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  type: "consumable" | "tool" | "defense" | "pet_food" | "special";
}

export const ITEMS: Record<string, ItemData> = {
  // Consumables
  water_can: {
    id: "water_can",
    name: "Bình tưới",
    emoji: "🪣",
    description: "Tưới 1 ô đất ngay lập tức",
    buyPrice: 5,
    sellPrice: 2,
    type: "consumable",
  },
  fertilizer: {
    id: "fertilizer",
    name: "Phân bón",
    emoji: "💩",
    description: "Tăng tốc độ phát triển 50% cho 1 ô",
    buyPrice: 15,
    sellPrice: 7,
    type: "consumable",
  },
  super_fertilizer: {
    id: "super_fertilizer",
    name: "Phân siêu cấp",
    emoji: "✨",
    description: "Tăng tốc độ phát triển 100% + tăng sản lượng",
    buyPrice: 50,
    sellPrice: 25,
    type: "consumable",
  },
  pesticide: {
    id: "pesticide",
    name: "Thuốc trừ sâu",
    emoji: "🧪",
    description: "Bảo vệ cây khỏi bị phá hoại 24h",
    buyPrice: 20,
    sellPrice: 10,
    type: "consumable",
  },
  // Defense items
  fence: {
    id: "fence",
    name: "Hàng rào",
    emoji: "🪜",
    description: "Giảm 20% tỉ lệ bị raid",
    buyPrice: 80,
    sellPrice: 40,
    type: "defense",
  },
  scarecrow: {
    id: "scarecrow",
    name: "Bù nhìn",
    emoji: "🎃",
    description: "Cảnh báo khi bị raid + -10% tỉ lệ bị raid",
    buyPrice: 60,
    sellPrice: 30,
    type: "defense",
  },
  trap: {
    id: "trap",
    name: "Bẫy",
    emoji: "🪤",
    description: "30% cơ hội làm thất bại raid và bắt kẻ tấn công",
    buyPrice: 100,
    sellPrice: 50,
    type: "defense",
  },
  // Pet food
  pet_food: {
    id: "pet_food",
    name: "Đồ ăn thú cưng",
    emoji: "🍖",
    description: "Tăng happiness của thú cưng",
    buyPrice: 10,
    sellPrice: 5,
    type: "pet_food",
  },
  // Special
  plot_deed: {
    id: "plot_deed",
    name: "Giấy mở đất",
    emoji: "📜",
    description: "Mở thêm 1 ô đất trồng",
    buyPrice: 500,
    sellPrice: 250,
    type: "special",
  },
  lucky_charm: {
    id: "lucky_charm",
    name: "Bùa may mắn",
    emoji: "🍀",
    description: "Tăng 20% tỉ lệ thành công raid lần tiếp theo",
    buyPrice: 120,
    sellPrice: 60,
    type: "consumable",
  },
  mysterious_seed: {
    id: "mysterious_seed",
    name: "Hạt bí ẩn",
    emoji: "🌟",
    description: "Hạt giống ngẫu nhiên siêu hiếm",
    buyPrice: 0,
    sellPrice: 200,
    type: "special",
  },
};

export function getItemById(id: string): ItemData | undefined {
  return ITEMS[id];
}
