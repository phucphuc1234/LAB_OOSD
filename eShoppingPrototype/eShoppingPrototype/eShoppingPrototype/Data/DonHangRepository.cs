using System;
using System.Data.SqlClient;
using eShoppingPrototype.Models;

namespace eShoppingPrototype.Data
{
    public class DonHangRepository
    {
        public bool LuuDonHangTransaction(DonDatHang donHang, out string errorMessage)
        {
            errorMessage = string.Empty;
            using (SqlConnection conn = DatabaseHelper.GetConnection())
            {
                conn.Open();
                SqlTransaction transaction = conn.BeginTransaction();

                try
                {
                    string queryDonHang = @"
                        INSERT INTO DonDatHang 
                        (maDonHang, thoiDiemDat, tongTriGia, trangThai, maKH, maHinhThuc, maThanhToan, soThe, nguoiNhan_hoTen, nguoiNhan_diaChi, nguoiNhan_dienThoai)
                        VALUES (@maDonHang, @thoiDiemDat, @tongTriGia, @trangThai, @maKH, @maHinhThuc, @maThanhToan, @soThe, @hoTen, @diaChi, @dienThoai)";

                    using (SqlCommand cmd = new SqlCommand(queryDonHang, conn, transaction))
                    {
                        cmd.Parameters.AddWithValue("@maDonHang", donHang.MaDonHang);
                        cmd.Parameters.AddWithValue("@thoiDiemDat", donHang.ThoiDiemDat);
                        cmd.Parameters.AddWithValue("@tongTriGia", donHang.TongTriGia);
                        cmd.Parameters.AddWithValue("@trangThai", donHang.TrangThai);
                        cmd.Parameters.AddWithValue("@maKH", donHang.MaKH);
                        cmd.Parameters.AddWithValue("@maHinhThuc", (object)donHang.MaHinhThuc ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@maThanhToan", (object)donHang.MaThanhToan ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@soThe", (object)donHang.SoThe ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@hoTen", donHang.NguoiNhanInfo.HoTen);
                        cmd.Parameters.AddWithValue("@diaChi", donHang.NguoiNhanInfo.DiaChi);
                        cmd.Parameters.AddWithValue("@dienThoai", donHang.NguoiNhanInfo.DienThoai);
                        cmd.ExecuteNonQuery();
                    }

                    string queryChiTiet = @"
                        INSERT INTO ChiTietDonHang (maDonHang, maSP, soLuong, dongGia)
                        VALUES (@maDonHang, @maSP, @soLuong, @dongGia)";

                    foreach (var ct in donHang.ChiTietList)
                    {
                        using (SqlCommand cmd = new SqlCommand(queryChiTiet, conn, transaction))
                        {
                            cmd.Parameters.AddWithValue("@maDonHang", donHang.MaDonHang);
                            cmd.Parameters.AddWithValue("@maSP", ct.MaSP);
                            cmd.Parameters.AddWithValue("@soLuong", ct.SoLuong);
                            cmd.Parameters.AddWithValue("@dongGia", ct.DongGia);
                            cmd.ExecuteNonQuery();
                        }
                    }

                    transaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    errorMessage = ex.Message;
                    return false;
                }
            }
        }
    }
}
