export interface PetData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  ability: string;
  buyPrice: number;
  passive: string; // effect key
}

export const PETS: Record<string, PetData> = {
  bee: {
    id: "bee",
    name: "Ong mật",
    emoji: "🐝",
    description: "Tự thụ phấn, tăng sản lượng thu hoạch",
    ability: "+15% sản lượng thu hoạch",
    buyPrice: 200,
    passive: "yield_boost",
  },
  worm: {
    id: "worm",
    name: "Giun đất",
    emoji: "🪱",
    description: "Tạo phân hữu cơ miễn phí mỗi ngày",
    ability: "Tạo 2x phân bón mỗi 12h",
    buyPrice: 150,
    passive: "fertilizer_gen",
  },
  cat: {
    id: "cat",
    name: "Mèo vườn",
    emoji: "🐱",
    description: "Đuổi chuột và giảm thiệt hại raid",
    ability: "-40% tỉ lệ thành công raid",
    buyPrice: 300,
    passive: "anti_raid",
  },
  dog: {
    id: "dog",
    name: "Chó canh",
    emoji: "🐕",
    description: "Cảnh báo khi bị tấn công và đánh trả",
    ability: "-25% raid + thông báo tấn công",
    buyPrice: 350,
    passive: "guard",
  },
  rabbit: {
    id: "rabbit",
    name: "Thỏ may mắn",
    emoji: "🐇",
    description: "Tìm hạt giống hiếm khi thu hoạch",
    ability: "10% cơ hội tìm hạt rare khi harvest",
    buyPrice: 400,
    passive: "seed_finder",
  },
  owl: {
    id: "owl",
    name: "Cú đêm",
    emoji: "🦉",
    description: "Tăng tốc độ phát triển cây ban đêm",
    ability: "+25% tốc độ phát triển từ 20h-6h",
    buyPrice: 450,
    passive: "night_boost",
  },
  parrot: {
    id: "parrot",
    name: "Vẹt thám hiểm",
    emoji: "🦜",
    description: "Tăng phần thưởng thám hiểm",
    ability: "+20% phần thưởng khi .explore",
    buyPrice: 380,
    passive: "explore_boost",
  },
};
