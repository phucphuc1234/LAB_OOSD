using System;
using System.Data;
using QuanLyHoSoBenhAn.Data;
using QuanLyHoSoBenhAn.Models;

namespace QuanLyHoSoBenhAn.Services
{
    public class DangKyService
    {
        private readonly HospitalRepository repo = new HospitalRepository();
        public DangKyResult DangKyLanDau(BenhNhan bn, decimal lePhi)
        {
            if (bn == null) throw new ArgumentNullException("bn");
            if (string.IsNullOrWhiteSpace(bn.HoTen)) throw new Exception("Họ tên không được trống.");
            if (string.IsNullOrWhiteSpace(bn.DienThoai)) throw new Exception("Số điện thoại không được trống.");
            if (bn.NgaySinh.Date >= DateTime.Today) throw new Exception("Ngày sinh không hợp lệ.");
            if (lePhi <= 0) throw new Exception("Lệ phí năm phải lớn hơn 0.");
            return repo.DangKyLanDau(bn, lePhi);
        }
    }

    public class HoSoService
    {
        private readonly HospitalRepository repo = new HospitalRepository();
        public DataTable TraCuu(string keyword) { return repo.TraCuuHoSo(keyword ?? ""); }
        public DataTable LayLichSu(int maHoSo)
        {
            if (maHoSo <= 0) throw new Exception("Mã hồ sơ không hợp lệ.");
            return repo.LayLichSuKham(maHoSo);
        }
    }

    public class LichHenService
    {
        private readonly HospitalRepository repo = new HospitalRepository();
        public void DatLichDinhKy(int maBenhNhan, DateTime ngayGio, string ghiChu)
        {
            if (maBenhNhan <= 0) throw new Exception("Chưa chọn bệnh nhân.");
            if (ngayGio <= DateTime.Now) throw new Exception("Ngày hẹn phải ở tương lai.");
            repo.DatLich(maBenhNhan, ngayGio, "Định kỳ", ghiChu);
        }
    }

    public class KhamBenhService
    {
        private readonly HospitalRepository repo = new HospitalRepository();
        public DataTable LayBacSi() { return repo.LayBacSi(); }
        public DataTable LayKhoa() { return repo.LayKhoa(); }
        public int TaoPhieuKham(PhieuKham p)
        {
            if (p.MaHoSo <= 0) throw new Exception("Mã hồ sơ không hợp lệ.");
            if (p.MaBacSi <= 0 || p.MaKhoa <= 0) throw new Exception("Phải chọn bác sĩ và khoa.");
            if (p.ThanNhiet.HasValue && (p.ThanNhiet.Value < 30 || p.ThanNhiet.Value > 45))
                throw new Exception("Thân nhiệt không hợp lệ.");
            return repo.TaoPhieuKham(p);
        }
        public void ThemXetNghiem(int maPhieuKham, string ten, string ketQua)
        {
            if (maPhieuKham <= 0) throw new Exception("Mã phiếu khám không hợp lệ.");
            if (string.IsNullOrWhiteSpace(ten)) throw new Exception("Tên xét nghiệm không được trống.");
            repo.ThemXetNghiem(maPhieuKham, ten, ketQua);
        }
        public void ThanhToanVaHoanTat(int maPhieuKham, decimal soTien, string ghiChu)
        {
            if (maPhieuKham <= 0) throw new Exception("Mã phiếu khám không hợp lệ.");
            if (soTien < 0) throw new Exception("Số tiền không hợp lệ.");
            repo.ThanhToanVaHoanTat(maPhieuKham, soTien, ghiChu);
        }
    }

    public class ToaThuocService
    {
        private readonly HospitalRepository repo = new HospitalRepository();
        public int LapToa(int maPhieuKham, string huongDan, ChiTietToaThuoc ct)
        {
            if (maPhieuKham <= 0) throw new Exception("Mã phiếu khám không hợp lệ.");
            if (ct == null || string.IsNullOrWhiteSpace(ct.TenThuoc)) throw new Exception("Thuốc không được trống.");
            if (ct.SoLuong <= 0) throw new Exception("Số lượng thuốc phải lớn hơn 0.");
            return repo.LapToaThuoc(maPhieuKham, huongDan, ct);
        }
    }
}
