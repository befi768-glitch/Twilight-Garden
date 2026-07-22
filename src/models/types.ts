/**
 * TypeScript types & interfaces cho toàn bộ hệ thống Twilight Garden
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'magical' | 'snowy' | 'foggy';
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type PlantStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'flowering' | 'withered';
export type AreaType = 'village' | 'forest' | 'lake' | 'mountain' | 'cave' | 'ruins' | 'meadow' | 'swamp';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';
export type NpcRelation = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'rival' | 'beloved';
export type PetStatus = 'healthy' | 'hungry' | 'sick' | 'happy' | 'sad' | 'neglected';
export type ItemCategory = 'seed' | 'crop' | 'material' | 'tool' | 'food' | 'potion' | 'gem' | 'decoration' | 'key' | 'misc';

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  discordId: string;
  guildId: string;
  username: string;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  currentArea: AreaType;
  reputation: number;
  energyMax: number;
  energyCurrent: number;
  energyRegenAt: Date | null;
  lastSeen: Date;
  createdAt: Date;
}

export interface PlayerStats {
  plantsGrown: number;
  cropsHarvested: number;
  coinsEarned: number;
  coinsSpent: number;
  questsCompleted: number;
  areasDiscovered: number;
  petsOwned: number;
  wildlifeFound: number;
  achievementsUnlocked: number;
  explorationCount: number;
  npcMet: number;
  daysPlayed: number;
}

// ─── Garden ───────────────────────────────────────────────────────────────────

export interface Plant {
  id: string;
  playerId: string;
  slotIndex: number;
  plantType: string;
  stage: PlantStage;
  growthPercent: number;
  waterLevel: number;
  fertilizerLevel: number;
  health: number;
  isMutant: boolean;
  mutationType: string | null;
  plantedAt: Date;
  lastWatered: Date | null;
  readyAt: Date | null;
}

export interface PlantDefinition {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  growTimeMinutes: number;
  baseYield: number;
  sellPrice: number;
  seedPrice: number;
  description: string;
  mutationChance: number;
  seasonBonus: Season[];
  weatherBonus: Weather[];
}

export interface GardenPlot {
  slots: (Plant | null)[];
  maxSlots: number;
  level: number;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  playerId: string;
  itemId: string;
  quantity: number;
  acquiredAt: Date;
  metadata: Record<string, unknown> | null;
}

export interface ItemDefinition {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
  rarity: Rarity;
  description: string;
  sellPrice: number;
  buyPrice: number | null;
  usable: boolean;
  stackable: boolean;
  maxStack: number;
}

// ─── Economy ──────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  fromPlayerId: string | null;
  toPlayerId: string | null;
  type: 'earn' | 'spend' | 'transfer' | 'auction' | 'gift';
  amount: number;
  itemId: string | null;
  itemQuantity: number | null;
  description: string;
  createdAt: Date;
}

export interface ShopItem {
  itemId: string;
  price: number;
  stock: number | null;
  restockAt: Date | null;
}

export interface AuctionListing {
  id: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  startPrice: number;
  currentBid: number;
  highestBidderId: string | null;
  endsAt: Date;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}

// ─── Pets ─────────────────────────────────────────────────────────────────────

export interface Pet {
  id: string;
  playerId: string;
  petType: string;
  name: string;
  level: number;
  xp: number;
  hunger: number;       // 0–100
  happiness: number;    // 0–100
  bond: number;         // 0–100
  health: number;       // 0–100
  status: PetStatus;
  skills: string[];
  lastFed: Date | null;
  lastPlayed: Date | null;
  adoptedAt: Date;
}

export interface PetDefinition {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  description: string;
  maxLevel: number;
  abilities: string[];
  passiveBonus: string;
  adoptCost: number;
}

// ─── Exploration ──────────────────────────────────────────────────────────────

export interface Area {
  id: AreaType;
  name: string;
  emoji: string;
  description: string;
  minLevel: number;
  energyCost: number;
  events: ExplorationEvent[];
  monsters: string[];
  items: string[];
}

export interface ExplorationEvent {
  id: string;
  name: string;
  description: string;
  probability: number;
  reward: ExplorationReward;
  type: 'combat' | 'find' | 'npc' | 'mystery' | 'treasure';
  /** Optional: gọi mỗi lần explore để tạo phần thưởng ngẫu nhiên — ghi đè reward */
  rewardFn?: () => ExplorationReward;
}

export interface ExplorationReward {
  coins?: number;
  xp?: number;
  items?: { itemId: string; quantity: number }[];
  wildlifeId?: string;
}

export interface ExplorationLog {
  id: string;
  playerId: string;
  area: AreaType;
  event: string;
  result: string;
  reward: ExplorationReward | null;
  exploredAt: Date;
}

// ─── Quests ───────────────────────────────────────────────────────────────────

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'npc' | 'event';
  rarity: Rarity;
  objectives: QuestObjective[];
  rewards: QuestReward;
  prerequisites: string[];
  timeLimit: number | null; // minutes
  minLevel: number;
  npcGiver: string | null;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'harvest' | 'explore' | 'kill' | 'collect' | 'talk' | 'craft' | 'buy' | 'sell' | 'use';
  target: string;
  required: number;
  current: number;
}

export interface QuestReward {
  coins: number;
  xp: number;
  items?: { itemId: string; quantity: number }[];
  reputationBonus?: number;
}

export interface PlayerQuest {
  id: string;
  playerId: string;
  questId: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  startedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
}

// ─── NPCs ─────────────────────────────────────────────────────────────────────

export interface Npc {
  id: string;
  name: string;
  emoji: string;
  title: string;
  description: string;
  location: AreaType;
  schedule: NpcSchedule[];
  personality: string[];
  dialogues: NpcDialogue[];
  trades: NpcTrade[];
  questIds: string[];
  maxRelation: number;
}

export interface NpcSchedule {
  timeOfDay: TimeOfDay;
  location: AreaType;
  activity: string;
}

export interface NpcDialogue {
  id: string;
  trigger: string;
  text: string;
  options?: { text: string; response: string }[];
  relationRequired?: number;
}

export interface NpcTrade {
  give: { itemId: string; quantity: number } | { coins: number };
  receive: { itemId: string; quantity: number } | { coins: number };
  stockPerDay: number;
  relationRequired: number;
}

export interface PlayerNpcRelation {
  id: string;
  playerId: string;
  npcId: string;
  relationScore: number;
  relation: NpcRelation;
  lastTalked: Date | null;
  giftsGiven: number;
}

// ─── Wildlife ─────────────────────────────────────────────────────────────────

export interface Wildlife {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  description: string;
  habitat: AreaType[];
  activeTime: TimeOfDay[];
  weather: Weather[];
  season: Season[];
  tameChance: number;
  tameCost: { itemId: string; quantity: number }[];
  drops: { itemId: string; quantity: number; chance: number }[];
}

export interface PlayerWildlife {
  id: string;
  playerId: string;
  wildlifeId: string;
  firstSeenAt: Date;
  timesSeen: number;
  tamed: boolean;
}

// ─── World / Time / Season / Weather ─────────────────────────────────────────

export interface WorldState {
  id: string;
  guildId: string;
  currentSeason: Season;
  currentWeather: Weather;
  timeOfDay: TimeOfDay;
  dayNumber: number;
  activeEvents: string[];
  worldTick: number;
  lastTickAt: Date;
}

export interface WorldEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'harvest' | 'market' | 'invasion' | 'festival' | 'mystery' | 'storm';
  durationHours: number;
  effects: WorldEventEffect[];
  participantRewards: QuestReward;
  rarity: Rarity;
}

export interface WorldEventEffect {
  type: 'price_change' | 'spawn_rate' | 'growth_rate' | 'drop_rate' | 'weather_lock';
  target: string;
  multiplier: number;
}

export interface ActiveWorldEvent {
  id: string;
  guildId: string;
  eventId: string;
  startedAt: Date;
  endsAt: Date;
  participants: string[];
  completed: boolean;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  secret: boolean;
  reward: { coins: number; xp: number; title?: string };
  condition: AchievementCondition;
  rarity: Rarity;
}

export interface AchievementCondition {
  type: string;
  target: string | number;
  value: number;
}

export interface PlayerAchievement {
  id: string;
  playerId: string;
  achievementId: string;
  unlockedAt: Date;
  notified: boolean;
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export interface Home {
  id: string;
  playerId: string;
  level: number;
  name: string;
  description: string;
  decorations: HomeDecoration[];
  storageSlots: number;
  gardenSlots: number;
  defenseRating: number;
  lastUpgradedAt: Date | null;
}

export interface HomeDecoration {
  itemId: string;
  position: number;
  placedAt: Date;
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  playerId: string;
  type: 'plant' | 'wildlife' | 'npc' | 'area' | 'event' | 'achievement';
  targetId: string;
  title: string;
  content: string;
  discoveredAt: Date;
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  guildId: string;
  title: string;
  content: string;
  type: 'world_event' | 'rare_spawn' | 'market' | 'player_achievement' | 'season_change';
  importance: 1 | 2 | 3;
  createdAt: Date;
  expiresAt: Date;
}

// ─── Social ───────────────────────────────────────────────────────────────────

export interface SocialActivity {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  type: 'gift' | 'visit' | 'cooperate' | 'trade';
  itemId: string | null;
  amount: number | null;
  message: string | null;
  createdAt: Date;
}

// ─── Command Types ────────────────────────────────────────────────────────────

export interface CommandContext {
  player: Player;
  world: WorldState;
}
