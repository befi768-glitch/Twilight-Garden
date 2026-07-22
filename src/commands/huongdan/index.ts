import { Message } from 'discord.js';
import { Command } from '../../client';
import { createEmbed } from '../../utils/embed';

// ─── Nội dung từng trang hướng dẫn ───────────────────────────────────────────

const TRANG_CHU = [
  '> *Chào mừng đến với **Twilight Garden** 🌙 — thế giới làm vườn, phiêu lưu và khám phá dưới ánh hoàng hôn!*',
  '',
  '📖 **Dùng `.huongdan <mục>` để xem chi tiết:**',
  '',
  '`batdau` — 🌱 Hướng dẫn bắt đầu cho người mới',
  '`vuon` — 🌿 Làm vườn & trồng trọt',
  '`kinhte` — 🌙 Kinh tế & cửa hàng',
  '`khampha` — 🗺️ Khám phá & sinh vật',
  '`nhanvat` — 👤 Nhân vật & nhà ở',
  '`xa_hoi` — 👥 Xã hội & thú cưng',
  '`tatca` — 📋 Tất cả lệnh tổng hợp',
].join('\n');

const BATDAU = [
  '## 🌱 Bắt Đầu Chơi',
  '',
  '**1. Kiểm tra nhân vật của bạn**',
  '> `.nguoichoi` — Xem thông tin, cấp độ, xu và thống kê của bạn',
  '',
  '**2. Xem nhà và vườn**',
  '> `.nha xem` — Xem nhà của bạn (bắt đầu ở cấp 1)',
  '> `.vuon xem` — Xem các ô trồng cây trong vườn',
  '',
  '**3. Mua hạt giống đầu tiên**',
  '> `.kinhte shop` — Xem cửa hàng',
  '> `.kinhte mua <mãVật>` — Mua hạt giống (ví dụ: `.kinhte mua rose_seed`)',
  '',
  '**4. Trồng và chăm sóc cây**',
  '> `.vuon trồng <ô> <loạiCây>` — Trồng hạt vào ô trống',
  '> `.vuon tưới <ô>` — Tưới nước mỗi ngày',
  '> `.vuon thu <ô>` — Thu hoạch khi cây chín',
  '',
  '**5. Khám phá thế giới**',
  '> `.khampha khuvuc` — Xem các khu vực có thể đi',
  '> `.khampha di <mãKV>` — Khám phá để nhặt vật phẩm & gặp sinh vật',
  '',
  '**6. Nhận nhiệm vụ để kiếm phần thưởng**',
  '> `.nhiem_vu sansan` — Xem nhiệm vụ hiện có',
  '> `.nhiem_vu nhan <mãNV>` — Nhận nhiệm vụ',
  '',
  '💡 **Mẹo:** Luôn giữ năng lượng ⚡ — dùng `.tuido dung healing_herb` để hồi phục!',
].join('\n');

const VUON = [
  '## 🌿 Làm Vườn & Trồng Trọt',
  '',
  '**Lệnh Vườn** — `.vuon <lệnh>`',
  '> `xem` — Xem toàn bộ vườn của bạn',
  '> `danh_sach` — Danh sách các loài cây có thể trồng',
  '> `trồng <ô> <loạiCây>` — Trồng hạt giống vào ô (cần có hạt trong túi)',
  '> `tưới <ô>` — Tưới nước cho cây',
  '> `bón <ô>` — Bón phân (cần **Phân bón** trong túi đồ)',
  '> `thu <ô>` — Thu hoạch cây đã trưởng thành',
  '> `nhổ <ô>` — Nhổ bỏ cây khỏi ô',
  '',
  '**Lệnh Túi Đồ** — `.tuido <lệnh>`',
  '> `xem` — Xem toàn bộ vật phẩm đang có',
  '> `dung <mãVật>` — Dùng vật phẩm có thể sử dụng',
  '',
  '✨ Cây có thể **đột biến** khi thu hoạch — giá trị cực cao!',
  '🏡 Nâng cấp nhà (`.nha nangcap`) để mở thêm ô trồng cây.',
].join('\n');

const KINHTE = [
  '## 🌙 Kinh Tế & Cửa Hàng',
  '',
  '**Lệnh Kinh Tế** — `.kinhte <lệnh>`',
  '> `sodu` — Xem số xu 🌙 và đá quý 💎 hiện có',
  '> `shop` — Xem toàn bộ hàng trong cửa hàng',
  '> `mua <mãVật> [số]` — Mua vật phẩm',
  '> `ban <mãVật> [số]` — Bán vật phẩm lấy xu',
  '> `cho @người <sốXu>` — Chuyển xu cho người khác',
  '> `daugia` — Xem sàn đấu giá đang diễn ra',
  '> `tao_dg <mãVật> <slg> <giáKĐ> [giờ]` — Đăng vật phẩm lên đấu giá',
  '> `dat_gia <mãDG> <sốXu>` — Đặt giá trong phiên đấu giá',
  '',
  '**Kiếm xu bằng cách:**',
  '• Thu hoạch và bán cây trồng',
  '• Khám phá khu vực để nhặt vật phẩm',
  '• Hoàn thành nhiệm vụ',
  '• Tham gia sự kiện thế giới',
].join('\n');

const KHAMPHA = [
  '## 🗺️ Khám Phá & Sinh Vật',
  '',
  '**Lệnh Khám Phá** — `.khampha <lệnh>`',
  '> `khuvuc` — Danh sách khu vực có thể đi (cần đủ cấp độ)',
  '> `di <mãKV>` — Khám phá khu vực (tốn ⚡ năng lượng)',
  '> `lichsu` — Xem lịch sử 8 lần khám phá gần nhất',
  '',
  '**Lệnh Sinh Vật** — `.dong_vat <lệnh>`',
  '> `bestiarium` — Danh sách toàn bộ sinh vật trong thế giới',
  '> `dakhamppha` — Sinh vật mà bạn đã từng gặp',
  '> `gap` — Thử gặp sinh vật ở khu vực hiện tại',
  '> `than <mãSinhVật>` — Thử thuần hóa sinh vật đã gặp',
  '',
  '**Thế Giới & Sự Kiện**',
  '> `.the_gioi` — Xem mùa, thời tiết, thời điểm hiện tại',
  '> `.su_kien hientai` — Xem sự kiện thế giới đang diễn ra',
  '> `.su_kien thamgia` — Tham gia sự kiện để nhận thưởng',
  '> `.su_kien danhsach` — Xem tất cả các loại sự kiện',
  '',
  '> `.tin_tuc moinhat` — Tin tức mới nhất trong thế giới',
  '> `.tin_tuc vangmat` — Tóm tắt những gì xảy ra lúc bạn offline',
].join('\n');

const NHANVAT = [
  '## 👤 Nhân Vật & Nhà Ở',
  '',
  '**Lệnh Người Chơi** — `.nguoichoi <lệnh>`',
  '> *(không có lệnh con)* — Xem thông tin nhân vật của mình',
  '> `xem @người` — Xem thông tin nhân vật của người khác',
  '',
  '**Lệnh Nhà** — `.nha <lệnh>`',
  '> `xem` — Xem nhà, cấp độ và thông tin nâng cấp',
  '> `nangcap` — Nâng cấp nhà (tốn xu, mở thêm ô vườn & kho)',
  '> `doi_ten <tên>` — Đổi tên nhà',
  '> `mo_ta <mô tả>` — Đặt mô tả cho nhà',
  '',
  '**Lệnh Thành Tích** — `.thanhtich <lệnh>`',
  '> `cuatoi` — Xem thành tích bạn đã mở khóa',
  '> `tatca` — Xem toàn bộ thành tích (kể cả chưa mở)',
  '',
  '**Lệnh Nhật Ký** — `.nhat_ky <lệnh>`',
  '> *(không có lệnh con)* — Xem tất cả ghi chép khám phá',
  '> `loai <loại>` — Lọc theo loại: `plant` `wildlife` `npc` `area` `event` `achievement`',
  '',
  '**Bảng Xếp Hạng** — `.bang_xh <lệnh>`',
  '> `giau` — Xếp hạng người giàu nhất',
  '> `capdo` — Xếp hạng cấp độ cao nhất',
  '> `danhtieng` — Xếp hạng danh tiếng cao nhất',
].join('\n');

const XA_HOI = [
  '## 👥 Xã Hội & Thú Cưng',
  '',
  '**Lệnh Xã Hội** — `.xa_hoi <lệnh>`',
  '> `cho_xu @người <số>` — Tặng xu cho người chơi khác',
  '> `cho_do @người <mãVật> [slg]` — Tặng vật phẩm',
  '> `thamquan @người` — Thăm nhà của người chơi khác',
  '',
  '**Lệnh NPC** — `.npc <lệnh>`',
  '> `danhsach` — Xem tất cả nhân vật NPC trong thế giới',
  '> `noi <mãNPC>` — Nói chuyện với NPC để tăng quan hệ',
  '> `tang <mãNPC> <mãVật>` — Tặng quà để cải thiện quan hệ',
  '> `quanhe` — Xem điểm quan hệ của bạn với từng NPC',
  '',
  '**Lệnh Thú Cưng** — `.thuocung <lệnh>`',
  '> `catalog` — Xem danh sách thú có thể nhận nuôi',
  '> `danhsach` — Xem thú cưng hiện tại của bạn',
  '> `nuoi <loại> <tên>` — Nhận nuôi thú cưng mới',
  '> `cho_an <mãThú>` — Cho thú ăn',
  '> `choi <mãThú>` — Chơi với thú để tăng kinh nghiệm',
  '> `chua <mãThú>` — Chữa bệnh cho thú',
  '> `doi_ten <mãThú> <tên>` — Đổi tên thú',
  '> `thả <mãThú>` — Thả thú về tự nhiên',
  '',
  '**Lệnh Nhiệm Vụ** — `.nhiem_vu <lệnh>`',
  '> `sansan` — Xem nhiệm vụ có thể nhận',
  '> `danglam` — Xem tiến độ nhiệm vụ đang làm',
  '> `nhan <mãNV>` — Nhận nhiệm vụ',
  '> `lichsu` — Lịch sử nhiệm vụ đã hoàn thành',
].join('\n');

const TATCA = [
  '## 📋 Tổng Hợp Tất Cả Lệnh',
  '',
  '🌿 **Vườn:** `.vuon` `xem` `trồng` `tưới` `bón` `thu` `nhổ` `danh_sach`',
  '🌙 **Kinh tế:** `.kinhte` `sodu` `shop` `mua` `ban` `cho` `daugia` `tao_dg` `dat_gia`',
  '🎒 **Túi đồ:** `.tuido` `xem` `dung`',
  '👤 **Người chơi:** `.nguoichoi` · `xem @người`',
  '🏡 **Nhà:** `.nha` `xem` `nangcap` `doi_ten` `mo_ta`',
  '🗺️ **Khám phá:** `.khampha` `khuvuc` `di` `lichsu`',
  '🐾 **Thú cưng:** `.thuocung` `catalog` `danhsach` `nuoi` `cho_an` `choi` `chua` `doi_ten` `thả`',
  '📜 **Nhiệm vụ:** `.nhiem_vu` `sansan` `danglam` `nhan` `lichsu`',
  '👥 **NPC:** `.npc` `danhsach` `noi` `tang` `quanhe`',
  '🦋 **Sinh vật:** `.dong_vat` `bestiarium` `dakhamppha` `gap` `than`',
  '🏆 **Thành tích:** `.thanhtich` `cuatoi` `tatca`',
  '📓 **Nhật ký:** `.nhat_ky` · `loai`',
  '📰 **Tin tức:** `.tin_tuc` `moinhat` `vangmat`',
  '⚡ **Sự kiện:** `.su_kien` `hientai` `thamgia` `danhsach`',
  '🤝 **Xã hội:** `.xa_hoi` `cho_xu` `cho_do` `thamquan`',
  '🏅 **BXH:** `.bang_xh` `giau` `capdo` `danhtieng`',
  '🌍 **Thế giới:** `.the_gioi`',
  '',
  '⚙️ **Admin** *(cần quyền Quản Lý Server)*: `.admin` `kenh_tin_tuc` `kenh_thongbao` `bat_sukien` `dang_tin` `trangthai`',
].join('\n');

// ─── Hàm tiện ích ─────────────────────────────────────────────────────────────

const COLOR = 0x9b59b6;

const PAGES: Record<string, { title: string; content: string; color: number }> = {
  batdau:  { title: '🌱 Hướng Dẫn Bắt Đầu',         content: BATDAU,  color: 0x2ecc71 },
  vuon:    { title: '🌿 Làm Vườn & Trồng Trọt',      content: VUON,    color: 0x27ae60 },
  kinhte:  { title: '🌙 Kinh Tế & Cửa Hàng',         content: KINHTE,  color: 0xf1c40f },
  khampha: { title: '🗺️ Khám Phá & Sinh Vật',        content: KHAMPHA, color: 0x1abc9c },
  nhanvat: { title: '👤 Nhân Vật & Nhà Ở',           content: NHANVAT, color: 0x9b59b6 },
  xa_hoi:  { title: '👥 Xã Hội, Thú Cưng & Nhiệm Vụ', content: XA_HOI,  color: 0xe67e22 },
  tatca:   { title: '📋 Tất Cả Lệnh Twilight Garden', content: TATCA,   color: 0x3498db },
};

// ─── Command ──────────────────────────────────────────────────────────────────

export const command: Command = {
  name: 'huongdan',

  async execute(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();

    if (sub && PAGES[sub]) {
      const page = PAGES[sub];
      return void message.reply({
        embeds: [
          createEmbed({
            title: page.title,
            description: page.content,
            color: page.color,
            footer: 'Twilight Garden • dùng .huongdan để xem mục khác',
          }),
        ],
      });
    }

    // Trang chủ
    return void message.reply({
      embeds: [
        createEmbed({
          title: '🌙 Twilight Garden — Hướng Dẫn',
          description: TRANG_CHU,
          color: COLOR,
          footer: 'Dùng .huongdan <mục> để xem chi tiết từng phần',
          timestamp: true,
        }),
      ],
    });
  },
};
