# 🌸 Twilight Garden Bot

Bot Discord trồng cây bằng tiếng Việt — xây dựng vườn, thu hoạch, mua bán và leo bảng xếp hạng!

## 📋 Danh sách lệnh (prefix: `.`)

### 🌿 Vườn tược
| Lệnh | Mô tả |
|---|---|
| `.vuon` | Xem vườn và thông tin nhân vật |
| `.trong <tên cây>` | Trồng cây vào ô đất trống |
| `.tuoi [số ô]` | Tưới nước (giảm 20% thời gian, thu hoạch x2) |
| `.thuhoach [số ô]` | Thu hoạch cây đã chín |

### 🏪 Mua bán
| Lệnh | Mô tả |
|---|---|
| `.cuahang` | Xem danh sách cây và giá cả |
| `.mua <tên cây> [số]` | Mua hạt giống |
| `.ban <tên cây> [số]` | Bán nông sản lấy xu |
| `.ban tất` | Bán toàn bộ túi đồ |

### 🎒 Quản lý
| Lệnh | Mô tả |
|---|---|
| `.tuidо` | Xem túi đồ |
| `.bangxephang` | Bảng xếp hạng top 10 server |
| `.tang @người <tên> [số]` | Tặng đồ cho người khác |
| `.trogiup` | Xem hướng dẫn đầy đủ |

## 🪴 Danh sách cây

| Cây | Mua | Bán | Thời gian | Độ hiếm |
|---|---|---|---|---|
| 🥕 Cà Rốt | 10 xu | 25 xu | 5 phút | Thường |
| 🍅 Cà Chua | 20 xu | 50 xu | 10 phút | Thường |
| 🌽 Bắp Ngô | 30 xu | 75 xu | 15 phút | Thường |
| 🍓 Dâu Tây | 50 xu | 130 xu | 30 phút | Hiếm |
| 🍄 Nấm Hương | 80 xu | 220 xu | 45 phút | Hiếm |
| 🌻 Hướng Dương | 100 xu | 280 xu | 1 giờ | Hiếm |
| 🍄‍🟫 Nấm Ma Thuật | 200 xu | 600 xu | 2 giờ | Cực Hiếm |
| 🌸 Hoa Twilight | 500 xu | 1500 xu | 6 giờ | Huyền Thoại |

## 🚀 Deploy lên Railway

### 1. Tạo project Railway
- Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub
- Kết nối repo này

### 2. Thêm PostgreSQL
- Trong project → Add Service → PostgreSQL
- Railway tự động thêm `DATABASE_URL` vào environment

### 3. Cài đặt biến môi trường
Vào project → Variables → thêm:
```
DISCORD_TOKEN=token_bot_discord_của_bạn
PREFIX=.
```

### 4. Lấy Discord Bot Token
1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo application mới → Bot → Reset Token → Copy
3. Bật **Message Content Intent** trong phần Privileged Gateway Intents
4. Mời bot vào server với quyền: `Send Messages`, `Read Message History`, `Embed Links`, `Mention Everyone`

### 5. Cấu hình Start Command
Railway tự detect `npm start` → chạy `node dist/index.js`

Hoặc thêm vào Railway Settings → Start Command:
```
npm run build && npm start
```

## 🛠️ Chạy local (dev)

```bash
# Cài dependencies
npm install

# Tạo file .env từ template
cp .env.example .env
# Điền DISCORD_TOKEN và DATABASE_URL vào .env

# Chạy development (hot reload)
npm run dev

# Build production
npm run build
npm start
```

## 📊 Hệ thống cấp độ

| Cấp | Kinh nghiệm | Số ô đất | Danh hiệu |
|---|---|---|---|
| 1 | 0 | 3 | Người Mới |
| 2 | 100 | 4 | Nông Dân |
| 3 | 300 | 5 | Nông Dân Lành Nghề |
| 4 | 700 | 6 | Thợ Làm Vườn |
| 5 | 1.500 | 7 | Chuyên Gia Làm Vườn |
| 6 | 3.000 | 8 | Bậc Thầy Vườn Tược |
| 7 | 6.000 | 9 | Người Giữ Vườn Huyền Bí |
| 8 | 12.000 | 10 | Chủ Nhân Twilight Garden |

> Thu hoạch cây để nhận kinh nghiệm. Tưới nước trước khi thu hoạch để nhận x2 sản phẩm! 💧
