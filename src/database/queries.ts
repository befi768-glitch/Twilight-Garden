import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { nguoiChoi, oDat, tuiDo, type NguoiChoi, type ODat } from "./schema";
import { mucCapDo } from "../data/plants";

// Lấy hoặc tạo người chơi mới
export async function layHoacTaoNguoiChoi(userId: string, guildId: string): Promise<NguoiChoi> {
  const existing = await db
    .select()
    .from(nguoiChoi)
    .where(and(eq(nguoiChoi.userId, userId), eq(nguoiChoi.guildId, guildId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // Tạo người chơi mới
  const newPlayer = await db
    .insert(nguoiChoi)
    .values({ userId, guildId, xu: 100, kinhNghiem: 0, capDo: 1, soODat: 3 })
    .returning();

  const player = newPlayer[0];

  // Tạo 3 ô đất ban đầu
  await db.insert(oDat).values([
    { nguoiChoiId: player.id, viTri: 1 },
    { nguoiChoiId: player.id, viTri: 2 },
    { nguoiChoiId: player.id, viTri: 3 },
  ]);

  return player;
}

// Lấy vườn của người chơi
export async function layVuon(nguoiChoiId: number): Promise<ODat[]> {
  return db
    .select()
    .from(oDat)
    .where(eq(oDat.nguoiChoiId, nguoiChoiId))
    .orderBy(oDat.viTri);
}

// Trồng cây vào ô đất
export async function trong(nguoiChoiId: number, viTri: number, tenCay: string, thoiGianMocPhut: number) {
  const bay_gio = new Date();
  const chin = new Date(bay_gio.getTime() + thoiGianMocPhut * 60 * 1000);

  await db
    .update(oDat)
    .set({
      tenCay,
      trongLuc: bay_gio,
      truongThanhLuc: chin,
      daTuoi: false,
      soLuongThuHoach: 1,
    })
    .where(and(eq(oDat.nguoiChoiId, nguoiChoiId), eq(oDat.viTri, viTri)));
}

// Tưới nước ô đất
export async function tuoi(nguoiChoiId: number, viTri: number): Promise<boolean> {
  const o = await db
    .select()
    .from(oDat)
    .where(and(eq(oDat.nguoiChoiId, nguoiChoiId), eq(oDat.viTri, viTri)))
    .limit(1);

  if (!o[0] || !o[0].tenCay || o[0].daTuoi) return false;

  // Tưới nước giảm 20% thời gian còn lại
  const chinLuc = o[0].truongThanhLuc!;
  const bayGio = new Date();
  const conLai = chinLuc.getTime() - bayGio.getTime();
  const moiChin = new Date(chinLuc.getTime() - conLai * 0.2);

  await db
    .update(oDat)
    .set({ daTuoi: true, truongThanhLuc: moiChin })
    .where(and(eq(oDat.nguoiChoiId, nguoiChoiId), eq(oDat.viTri, viTri)));

  return true;
}

// Thu hoạch ô đất
export async function thuHoach(nguoiChoiId: number, viTri: number): Promise<{ tenCay: string; soLuong: number } | null> {
  const o = await db
    .select()
    .from(oDat)
    .where(and(eq(oDat.nguoiChoiId, nguoiChoiId), eq(oDat.viTri, viTri)))
    .limit(1);

  if (!o[0] || !o[0].tenCay || !o[0].truongThanhLuc) return null;
  if (new Date() < o[0].truongThanhLuc) return null;

  const { tenCay, soLuongThuHoach } = o[0];

  // Xóa cây, trả ô đất về trống
  await db
    .update(oDat)
    .set({ tenCay: null, trongLuc: null, truongThanhLuc: null, daTuoi: false, soLuongThuHoach: 1 })
    .where(and(eq(oDat.nguoiChoiId, nguoiChoiId), eq(oDat.viTri, viTri)));

  // Thêm vào túi đồ
  await themVaoTuiDo(nguoiChoiId, tenCay!, soLuongThuHoach ?? 1);

  return { tenCay: tenCay!, soLuong: soLuongThuHoach ?? 1 };
}

// Thêm vật phẩm vào túi đồ
export async function themVaoTuiDo(nguoiChoiId: number, tenCay: string, soLuong: number) {
  const existing = await db
    .select()
    .from(tuiDo)
    .where(and(eq(tuiDo.nguoiChoiId, nguoiChoiId), eq(tuiDo.tenCay, tenCay)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(tuiDo)
      .set({ soLuong: existing[0].soLuong + soLuong })
      .where(eq(tuiDo.id, existing[0].id));
  } else {
    await db.insert(tuiDo).values({ nguoiChoiId, tenCay, soLuong });
  }
}

// Bán vật phẩm
export async function ban(nguoiChoiId: number, tenCay: string, soLuong: number): Promise<boolean> {
  const existing = await db
    .select()
    .from(tuiDo)
    .where(and(eq(tuiDo.nguoiChoiId, nguoiChoiId), eq(tuiDo.tenCay, tenCay)))
    .limit(1);

  if (!existing[0] || existing[0].soLuong < soLuong) return false;

  const soLuongMoi = existing[0].soLuong - soLuong;
  if (soLuongMoi === 0) {
    await db.delete(tuiDo).where(eq(tuiDo.id, existing[0].id));
  } else {
    await db.update(tuiDo).set({ soLuong: soLuongMoi }).where(eq(tuiDo.id, existing[0].id));
  }
  return true;
}

// Tặng vật phẩm
export async function tang(
  nguoiChoiIdNguoiTang: number,
  nguoiChoiIdNguoiNhan: number,
  tenCay: string,
  soLuong: number
): Promise<boolean> {
  const ok = await ban(nguoiChoiIdNguoiTang, tenCay, soLuong);
  if (!ok) return false;
  await themVaoTuiDo(nguoiChoiIdNguoiNhan, tenCay, soLuong);
  return true;
}

// Lấy túi đồ
export async function layTuiDo(nguoiChoiId: number) {
  return db.select().from(tuiDo).where(eq(tuiDo.nguoiChoiId, nguoiChoiId));
}

// Cộng xu và kinh nghiệm
export async function congXuVaKinhNghiem(nguoiChoiId: number, xu: number, kinhNghiem: number) {
  const player = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, nguoiChoiId)).limit(1);
  if (!player[0]) return;

  const xuMoi = player[0].xu + xu;
  const keMoi = player[0].kinhNghiem + kinhNghiem;
  const capDoMoi = tinhCapDo(keMoi);

  const soODatMoi = mucCapDo.find((m) => m.cap === capDoMoi)?.soODat ?? player[0].soODat;

  // Mở thêm ô đất nếu lên cấp
  if (soODatMoi > player[0].soODat) {
    for (let i = player[0].soODat + 1; i <= soODatMoi; i++) {
      await db.insert(oDat).values({ nguoiChoiId, viTri: i });
    }
  }

  await db
    .update(nguoiChoi)
    .set({ xu: xuMoi, kinhNghiem: keMoi, capDo: capDoMoi, soODat: soODatMoi })
    .where(eq(nguoiChoi.id, nguoiChoiId));

  return { capDoCu: player[0].capDo, capDoMoi };
}

// Trừ xu
export async function truXu(nguoiChoiId: number, soXu: number): Promise<boolean> {
  const player = await db.select().from(nguoiChoi).where(eq(nguoiChoi.id, nguoiChoiId)).limit(1);
  if (!player[0] || player[0].xu < soXu) return false;
  await db.update(nguoiChoi).set({ xu: player[0].xu - soXu }).where(eq(nguoiChoi.id, nguoiChoiId));
  return true;
}

// Bảng xếp hạng
export async function bangXepHang(guildId: string) {
  return db
    .select()
    .from(nguoiChoi)
    .where(eq(nguoiChoi.guildId, guildId))
    .orderBy(desc(nguoiChoi.kinhNghiem))
    .limit(10);
}

// Tính cấp độ từ kinh nghiệm
export function tinhCapDo(kinhNghiem: number): number {
  for (let i = mucCapDo.length - 1; i >= 0; i--) {
    if (kinhNghiem >= mucCapDo[i].kinhNghiemCanThiet) return mucCapDo[i].cap;
  }
  return 1;
}
