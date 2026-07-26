import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

// Bảng người chơi
export const nguoiChoi = pgTable("nguoi_choi", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  xu: integer("xu").notNull().default(100),
  kinhNghiem: integer("kinh_nghiem").notNull().default(0),
  capDo: integer("cap_do").notNull().default(1),
  soODat: integer("so_o_dat").notNull().default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bảng ô đất trong vườn
export const oDat = pgTable("o_dat", {
  id: serial("id").primaryKey(),
  nguoiChoiId: integer("nguoi_choi_id").references(() => nguoiChoi.id),
  viTri: integer("vi_tri").notNull(),
  tenCay: text("ten_cay"),           // null = ô trống
  trongLuc: timestamp("trong_luc"),
  truongThanhLuc: timestamp("truong_thanh_luc"),
  daTuoi: boolean("da_tuoi").default(false),
  soLuongThuHoach: integer("so_luong_thu_hoach").default(1),
});

// Bảng túi đồ
export const tuiDo = pgTable("tui_do", {
  id: serial("id").primaryKey(),
  nguoiChoiId: integer("nguoi_choi_id").references(() => nguoiChoi.id),
  tenCay: text("ten_cay").notNull(),
  soLuong: integer("so_luong").notNull().default(0),
});

export type NguoiChoi = typeof nguoiChoi.$inferSelect;
export type ODat = typeof oDat.$inferSelect;
export type TuiDo = typeof tuiDo.$inferSelect;
