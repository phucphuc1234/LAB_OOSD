using System;
using System.Data;
using System.Data.SqlClient;
using QuanLyHoSoBenhAn.Models;

namespace QuanLyHoSoBenhAn.Data
{
    public class HospitalRepository
    {
        public DangKyResult DangKyLanDau(BenhNhan bn, decimal lePhi)
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand("dbo.sp_DangKyLanDau", cn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@HoTen", bn.HoTen);
                cmd.Parameters.AddWithValue("@DiaChi", (object)bn.DiaChi ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@NgaySinh", bn.NgaySinh.Date);
                cmd.Parameters.AddWithValue("@DienThoai", bn.DienThoai);
                cmd.Parameters.AddWithValue("@Anh3x4", (object)bn.Anh3x4 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SoTienLePhi", lePhi);
                using (var rd = cmd.ExecuteReader())
                {
                    if (!rd.Read()) throw new Exception("Không nhận được kết quả đăng ký.");
                    return new DangKyResult
                    {
                        MaBenhNhan = Convert.ToInt32(rd["MaBenhNhan"]),
                        MaHoSo = Convert.ToInt32(rd["MaHoSo"]),
                        MaHoSoCode = Convert.ToString(rd["MaHoSoCode"])
                    };
                }
            }
        }

        public DataTable TraCuuHoSo(string keyword)
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand(@"
SELECT hs.MaHoSo,hs.MaHoSoCode,bn.MaBenhNhan,bn.HoTen,bn.NgaySinh,bn.DienThoai,bn.DiaChi,hs.NgayLap,hs.TrangThai
FROM HOSOBENHAN hs
JOIN BENHNHAN bn ON bn.MaBenhNhan=hs.MaBenhNhan
WHERE hs.MaHoSoCode LIKE @kw OR bn.HoTen LIKE @kw OR bn.DienThoai LIKE @kw
ORDER BY bn.HoTen;", cn))
            {
                cmd.Parameters.AddWithValue("@kw", "%" + keyword + "%");
                var dt = new DataTable();
                new SqlDataAdapter(cmd).Fill(dt);
                return dt;
            }
        }

        public DataTable LayLichSuKham(int maHoSo)
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand(@"
SELECT pk.MaPhieuKham,pk.NgayGioKham,pk.LoaiKham,bs.HoTen AS BacSi,k.TenKhoa,
       pk.TrieuChung,pk.ChanDoan,pk.TrangThai
FROM PHIEUKHAM pk
JOIN BACSI bs ON bs.MaBacSi=pk.MaBacSi
JOIN KHOADIEUTRI k ON k.MaKhoa=pk.MaKhoa
WHERE pk.MaHoSo=@MaHoSo
ORDER BY pk.NgayGioKham DESC;", cn))
            {
                cmd.Parameters.AddWithValue("@MaHoSo", maHoSo);
                var dt = new DataTable();
                new SqlDataAdapter(cmd).Fill(dt);
                return dt;
            }
        }

        public DataTable LayBacSi()
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand("SELECT MaBacSi,HoTen FROM BACSI ORDER BY HoTen", cn))
            {
                var dt = new DataTable(); new SqlDataAdapter(cmd).Fill(dt); return dt;
            }
        }

        public DataTable LayKhoa()
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand("SELECT MaKhoa,TenKhoa FROM KHOADIEUTRI ORDER BY TenKhoa", cn))
            {
                var dt = new DataTable(); new SqlDataAdapter(cmd).Fill(dt); return dt;
            }
        }

        public int TaoPhieuKham(PhieuKham p)
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand(@"
INSERT PHIEUKHAM(MaHoSo,MaBacSi,MaKhoa,LoaiKham,TrieuChung,ThanNhiet,HuyetAp,ChanDoan,TrangThai)
VALUES(@MaHoSo,@MaBacSi,@MaKhoa,@LoaiKham,@TrieuChung,@ThanNhiet,@HuyetAp,@ChanDoan,N'Đang khám');
SELECT CAST(SCOPE_IDENTITY() AS INT);", cn))
            {
                cmd.Parameters.AddWithValue("@MaHoSo", p.MaHoSo);
                cmd.Parameters.AddWithValue("@MaBacSi", p.MaBacSi);
                cmd.Parameters.AddWithValue("@MaKhoa", p.MaKhoa);
                cmd.Parameters.AddWithValue("@LoaiKham", p.LoaiKham);
                cmd.Parameters.AddWithValue("@TrieuChung", (object)p.TrieuChung ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ThanNhiet", (object)p.ThanNhiet ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@HuyetAp", (object)p.HuyetAp ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ChanDoan", (object)p.ChanDoan ?? DBNull.Value);
                return (int)cmd.ExecuteScalar();
            }
        }

        public void ThemXetNghiem(int maPhieuKham, string ten, string ketQua)
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand(@"
INSERT XETNGHIEM(MaPhieuKham,TenXetNghiem,KetQua,NgayThucHien)
VALUES(@MaPhieuKham,@Ten,@KetQua,SYSDATETIME());", cn))
            {
                cmd.Parameters.AddWithValue("@MaPhieuKham", maPhieuKham);
                cmd.Parameters.AddWithValue("@Ten", ten);
                cmd.Parameters.AddWithValue("@KetQua", (object)ketQua ?? DBNull.Value);
                cmd.ExecuteNonQuery();
            }
        }

        public void DatLich(int maBenhNhan, DateTime ngayGio, string loaiKham, string ghiChu)
        {
            int quy = ((ngayGio.Month - 1) / 3) + 1;
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand(@"
INSERT LICHHEN(MaBenhNhan,NgayGioHen,LoaiKham,Nam,Quy,GhiChu)
VALUES(@MaBenhNhan,@NgayGio,@LoaiKham,@Nam,@Quy,@GhiChu);", cn))
            {
                cmd.Parameters.AddWithValue("@MaBenhNhan", maBenhNhan);
                cmd.Parameters.AddWithValue("@NgayGio", ngayGio);
                cmd.Parameters.AddWithValue("@LoaiKham", loaiKham);
                cmd.Parameters.AddWithValue("@Nam", ngayGio.Year);
                cmd.Parameters.AddWithValue("@Quy", quy);
                cmd.Parameters.AddWithValue("@GhiChu", (object)ghiChu ?? DBNull.Value);
                cmd.ExecuteNonQuery();
            }
        }

        public int LapToaThuoc(int maPhieuKham, string huongDan, ChiTietToaThuoc ct)
        {
            using (var cn = Db.Open())
            using (var tx = cn.BeginTransaction())
            {
                try
                {
                    int maToa;
                    using (var cmd = new SqlCommand(@"
INSERT TOATHUOC(MaPhieuKham,HuongDanSuDung) VALUES(@MaPhieuKham,@HuongDan);
SELECT CAST(SCOPE_IDENTITY() AS INT);", cn, tx))
                    {
                        cmd.Parameters.AddWithValue("@MaPhieuKham", maPhieuKham);
                        cmd.Parameters.AddWithValue("@HuongDan", (object)huongDan ?? DBNull.Value);
                        maToa = (int)cmd.ExecuteScalar();
                    }
                    using (var cmd = new SqlCommand(@"
INSERT CHITIETTOATHUOC(MaToa,TenThuoc,LieuDung,SoLuong,CachDung)
VALUES(@MaToa,@TenThuoc,@LieuDung,@SoLuong,@CachDung);", cn, tx))
                    {
                        cmd.Parameters.AddWithValue("@MaToa", maToa);
                        cmd.Parameters.AddWithValue("@TenThuoc", ct.TenThuoc);
                        cmd.Parameters.AddWithValue("@LieuDung", ct.LieuDung);
                        cmd.Parameters.AddWithValue("@SoLuong", ct.SoLuong);
                        cmd.Parameters.AddWithValue("@CachDung", ct.CachDung);
                        cmd.ExecuteNonQuery();
                    }
                    using (var cmd = new SqlCommand("UPDATE PHIEUKHAM SET TrangThai=N'Chờ thanh toán' WHERE MaPhieuKham=@Id", cn, tx))
                    {
                        cmd.Parameters.AddWithValue("@Id", maPhieuKham);
                        cmd.ExecuteNonQuery();
                    }
                    tx.Commit(); return maToa;
                }
                catch { tx.Rollback(); throw; }
            }
        }

        public void ThanhToanVaHoanTat(int maPhieuKham, decimal soTien, string ghiChu)
        {
            using (var cn = Db.Open())
            using (var cmd = new SqlCommand("dbo.sp_ThanhToanVaHoanTatPhieuKham", cn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@MaPhieuKham", maPhieuKham);
                cmd.Parameters.AddWithValue("@SoTien", soTien);
                cmd.Parameters.AddWithValue("@GhiChu", (object)ghiChu ?? DBNull.Value);
                cmd.ExecuteNonQuery();
            }
        }
    }
}
