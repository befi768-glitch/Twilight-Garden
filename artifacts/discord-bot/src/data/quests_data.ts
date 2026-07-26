export interface QuestData {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: "harvest" | "sell" | "water" | "raid" | "explore" | "buy";
  target: number;         // how many needed
  itemFilter?: string;    // specific item/seed (optional)
  rewardCoins: number;
  rewardExp: number;
  rewardItem?: string;
}

export const DAILY_QUESTS: QuestData[] = [
  {
    id: "harvest_5",
    name: "Nông dân chăm chỉ",
    description: "Thu hoạch 5 lần",
    emoji: "🌾",
    type: "harvest",
    target: 5,
    rewardCoins: 50,
    rewardExp: 20,
  },
  {
    id: "harvest_10",
    name: "Nông dân xuất sắc",
    description: "Thu hoạch 10 lần",
    emoji: "🏆",
    type: "harvest",
    target: 10,
    rewardCoins: 100,
    rewardExp: 40,
  },
  {
    id: "water_5",
    name: "Người giữ nước",
    description: "Tưới 5 ô cây",
    emoji: "💧",
    type: "water",
    target: 5,
    rewardCoins: 30,
    rewardExp: 15,
  },
  {
    id: "sell_100",
    name: "Thương nhân nhỏ",
    description: "Kiếm 100 đồng từ bán hàng",
    emoji: "💰",
    type: "sell",
    target: 100,
    rewardCoins: 50,
    rewardExp: 25,
  },
  {
    id: "sell_500",
    name: "Thương nhân lớn",
    description: "Kiếm 500 đồng từ bán hàng",
    emoji: "💎",
    type: "sell",
    target: 500,
    rewardCoins: 150,
    rewardExp: 60,
    rewardItem: "fertilizer",
  },
  {
    id: "explore_1",
    name: "Nhà thám hiểm",
    description: "Thám hiểm 1 lần",
    emoji: "🗺️",
    type: "explore",
    target: 1,
    rewardCoins: 40,
    rewardExp: 20,
  },
  {
    id: "raid_1",
    name: "Tên trộm nhỏ",
    description: "Thực hiện 1 vụ raid",
    emoji: "⚔️",
    type: "raid",
    target: 1,
    rewardCoins: 30,
    rewardExp: 15,
  },
  {
    id: "harvest_carrot",
    name: "Vườn cà rốt",
    description: "Thu hoạch 10 cà rốt",
    emoji: "🥕",
    type: "harvest",
    target: 10,
    itemFilter: "carrot",
    rewardCoins: 60,
    rewardExp: 30,
  },
];

export function getRandomDailyQuests(count = 3): QuestData[] {
  const shuffled = [...DAILY_QUESTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
