using System;
using System.Data;
using System.Data.SqlClient;
using TravelManager.Data;
using TravelManager.Models;
namespace TravelManager.Services {
 public class TravelService {
  public int Register(BookingRequest r) {
   if(r.CustomerId<=0||r.TourId<=0||r.Headcount<=0) throw new ArgumentException("Thông tin khách, tour và số người không hợp lệ.");
   if(r.Type!="DOAN"&&r.Type!="LE") throw new ArgumentException("Loại khách không hợp lệ.");
   if((r.Type=="DOAN"&&r.Headcount<12)||(r.Type=="LE"&&r.Headcount>=12)) throw new ArgumentException("Khách lẻ 1-11; khách đoàn từ 12 người.");
   string[] names=(r.InsuredNames??"").Split(new[]{'\r','\n'},StringSplitOptions.RemoveEmptyEntries);
   if(r.Insurance&&(r.Type!="DOAN"||names.Length!=r.Headcount)) throw new ArgumentException("Bảo hiểm đoàn phải có đủ tên từng người tham gia.");
   if(r.Type=="LE"&&!r.TripId.HasValue) throw new ArgumentException("Khách lẻ phải chọn chuyến.");
   if(r.Type=="DOAN"&&(string.IsNullOrWhiteSpace(r.AgencyName)||string.IsNullOrWhiteSpace(r.Representative)||string.IsNullOrWhiteSpace(r.Pickup)||r.Deposit<=0)) throw new ArgumentException("Đoàn phải có đơn vị, người đại diện, nơi đón và cọc > 0.");
   using(var c=Db.Open()) using(var tx=c.BeginTransaction(IsolationLevel.Serializable)) { try {
    decimal price=Convert.ToDecimal(Db.Scalar(c,tx,"SELECT DonGia FROM Tour WHERE MaTour=@id",Db.P("@id",r.TourId))??throw new ArgumentException("Tour không tồn tại"));
    if(Db.Scalar(c,tx,"SELECT MaKH FROM KhachHang WHERE MaKH=@id",Db.P("@id",r.CustomerId))==null) throw new ArgumentException("Khách hàng không tồn tại");
    if(r.Type=="LE") {using(var cmd=new SqlCommand("SELECT MaChuyen,NgayDi,SoCho FROM ChuyenDi WITH (UPDLOCK,HOLDLOCK) WHERE MaChuyen=@id AND MaTour=@tour",c,tx)) {cmd.Parameters.AddWithValue("@id",r.TripId.Value);cmd.Parameters.AddWithValue("@tour",r.TourId);using(var dr=cmd.ExecuteReader()){if(!dr.Read()) throw new ArgumentException("Chuyến không thuộc tour");var depart=dr.GetDateTime(1);if(depart.Date<DateTime.Today) throw new ArgumentException("Chuyến đã qua");r.Departure=depart; int seats=dr.GetInt32(2);dr.Close();int sold=Convert.ToInt32(Db.Scalar(c,tx,"SELECT ISNULL(SUM(SoNguoi),0) FROM PhieuDangKy WITH (UPDLOCK,HOLDLOCK) WHERE MaChuyen=@id AND TrangThai <> 'HUY'",Db.P("@id",r.TripId.Value)));if(sold+r.Headcount>seats) throw new ArgumentException("Không đủ chỗ");}}}
    else if(r.Departure.Date<DateTime.Today) throw new ArgumentException("Ngày đi đã qua");
    decimal total=price*r.Headcount;
    if(r.Type=="DOAN"&&r.Deposit>total) throw new ArgumentException("Tiền cọc vượt tổng giá");
    object id=Db.Scalar(c,tx,@"INSERT INTO PhieuDangKy(MaKH,MaTour,MaChuyen,LoaiDangKy,SoNguoi,NgayDi,TongTien,TrangThai,CoBaoHiem)
VALUES (@kh,@tour,@chuyen,@loai,@nguoi,@ngay,@tong,'DA_XAC_NHAN',@bh); SELECT CAST(SCOPE_IDENTITY() AS INT)",Db.P("@kh",r.CustomerId),Db.P("@tour",r.TourId),Db.P("@chuyen",r.TripId.HasValue?(object)r.TripId.Value:DBNull.Value),Db.P("@loai",r.Type),Db.P("@nguoi",r.Headcount),Db.P("@ngay",r.Departure.Date),Db.P("@tong",total),Db.P("@bh",r.Insurance));
    int bookingId=Convert.ToInt32(id);
    if(r.Insurance) foreach(string name in names) Db.Exec(c,tx,"INSERT INTO NguoiDuLich(MaPhieu,HoTen) VALUES (@id,@name)",Db.P("@id",bookingId),Db.P("@name",name.Trim()));
    if(r.Type=="DOAN") {Db.Exec(c,tx,"INSERT INTO KhachDoan(MaPhieu,TenCoQuan,NguoiDaiDien,DiaDiemDon,DienThoai) VALUES (@phieu,@ten,@daidien,@don,@dt)",Db.P("@phieu",bookingId),Db.P("@ten",r.AgencyName),Db.P("@daidien",r.Representative),Db.P("@don",r.Pickup),Db.P("@dt",r.Phone));Db.Exec(c,tx,"INSERT INTO ThanhToan(MaPhieu,LoaiThanhToan,SoTien) VALUES (@id,'COC',@amount)",Db.P("@id",bookingId),Db.P("@amount",r.Deposit));}
    else {Db.Exec(c,tx,"INSERT INTO ThanhToan(MaPhieu,LoaiThanhToan,SoTien) VALUES (@id,'VE',@amount)",Db.P("@id",bookingId),Db.P("@amount",total));}
    tx.Commit();return bookingId;
   } catch {tx.Rollback();throw;} }
  }
  public int Assign(AssignmentRequest r) {
   if(r.TourWage<0) throw new ArgumentException("Thù lao không âm");
   using(var c=Db.Open()) using(var tx=c.BeginTransaction(IsolationLevel.Serializable)){try{
    object dates=Db.Scalar(c,tx,@"SELECT p.MaPhieu FROM PhieuDangKy p WITH (UPDLOCK,HOLDLOCK)
WHERE p.MaPhieu=@id AND p.TrangThai <> 'HUY'",Db.P("@id",r.BookingId));if(dates==null) throw new ArgumentException("Phiếu không hợp lệ");
    object overlap=Db.Scalar(c,tx,@"SELECT TOP 1 a.MaPhanCong FROM PhanCong a WITH (UPDLOCK,HOLDLOCK)
JOIN PhieuDangKy p1 ON a.MaPhieu=p1.MaPhieu JOIN Tour t1 ON p1.MaTour=t1.MaTour
JOIN PhieuDangKy p2 ON p2.MaPhieu=@booking JOIN Tour t2 ON p2.MaTour=t2.MaTour
WHERE a.MaNV=@nv AND p1.TrangThai <> 'HUY'
AND p1.NgayDi < DATEADD(DAY,t2.SoNgay,p2.NgayDi) AND p2.NgayDi < DATEADD(DAY,t1.SoNgay,p1.NgayDi)",Db.P("@booking",r.BookingId),Db.P("@nv",r.StaffId));
    if(overlap!=null) throw new ArgumentException("Hướng dẫn viên bị trùng lịch");
    int count=Convert.ToInt32(Db.Scalar(c,tx,"SELECT COUNT(*) FROM PhanCong WHERE MaPhieu=@id",Db.P("@id",r.BookingId)));
    string kind=Convert.ToString(Db.Scalar(c,tx,"SELECT LoaiDangKy FROM PhieuDangKy WHERE MaPhieu=@id",Db.P("@id",r.BookingId)));
    if(kind=="LE"&&count>=1) throw new ArgumentException("Khách lẻ: chỉ một hướng dẫn viên mỗi phiếu; các phiếu cùng chuyến dùng cùng hướng dẫn viên.");
    if(kind=="LE") {object other=Db.Scalar(c,tx,@"SELECT TOP 1 a.MaNV FROM PhanCong a JOIN PhieuDangKy p ON p.MaPhieu=a.MaPhieu WHERE p.MaChuyen=(SELECT MaChuyen FROM PhieuDangKy WHERE MaPhieu=@id) AND p.MaPhieu<>@id AND p.TrangThai<>'HUY'",Db.P("@id",r.BookingId));if(other!=null&&Convert.ToInt32(other)!=r.StaffId) throw new ArgumentException("Chuyến đã có hướng dẫn viên khác");}
    object newId=Db.Scalar(c,tx,"INSERT INTO PhanCong(MaNV,MaPhieu,LuongTour) VALUES (@nv,@id,@luong);SELECT CAST(SCOPE_IDENTITY() AS INT)",Db.P("@nv",r.StaffId),Db.P("@id",r.BookingId),Db.P("@luong",r.TourWage));tx.Commit();return Convert.ToInt32(newId);
   }catch{tx.Rollback();throw;}}
  }
  public void Pay(PaymentRequest r) {
   if(r.Amount<=0||(r.Kind!="QUYET_TOAN"&&r.Kind!="HOAN_TIEN")) throw new ArgumentException("Loại thanh toán / số tiền không hợp lệ");
   using(var c=Db.Open()) using(var tx=c.BeginTransaction(IsolationLevel.Serializable)){try{
    using(var cmd=new SqlCommand("SELECT LoaiDangKy,TrangThai,TongTien FROM PhieuDangKy WITH (UPDLOCK,HOLDLOCK) WHERE MaPhieu=@id",c,tx)){cmd.Parameters.AddWithValue("@id",r.BookingId);using(var dr=cmd.ExecuteReader()){if(!dr.Read())throw new ArgumentException("Không có phiếu");string kind=dr.GetString(0),state=dr.GetString(1);decimal total=dr.GetDecimal(2);dr.Close();if(kind!="DOAN") throw new ArgumentException("Thanh toán bổ sung chỉ dành cho đoàn");if(state=="HUY")throw new ArgumentException("Phiếu đã hủy");decimal paid=Convert.ToDecimal(Db.Scalar(c,tx,"SELECT ISNULL(SUM(CASE WHEN LoaiThanhToan='HOAN_TIEN' THEN -SoTien ELSE SoTien END),0) FROM ThanhToan WITH (UPDLOCK,HOLDLOCK) WHERE MaPhieu=@id",Db.P("@id",r.BookingId)));if(r.Kind=="QUYET_TOAN"&&paid+r.Amount>total)throw new ArgumentException("Vượt công nợ");if(r.Kind=="HOAN_TIEN"&&r.Amount>paid)throw new ArgumentException("Hoàn quá số đã thu");}}
    Db.Exec(c,tx,"INSERT INTO ThanhToan(MaPhieu,LoaiThanhToan,SoTien) VALUES (@id,@kind,@amount)",Db.P("@id",r.BookingId),Db.P("@kind",r.Kind),Db.P("@amount",r.Amount));tx.Commit();
   }catch{tx.Rollback();throw;}}
  }
  public void Cancel(int bookingId) {using(var c=Db.Open())using(var tx=c.BeginTransaction(IsolationLevel.Serializable)){try{string kind=Convert.ToString(Db.Scalar(c,tx,"SELECT LoaiDangKy FROM PhieuDangKy WITH (UPDLOCK,HOLDLOCK) WHERE MaPhieu=@id AND TrangThai<>'HUY'",Db.P("@id",bookingId)));if(kind!="DOAN"&&kind!="LE")throw new ArgumentException("Phiếu không thể hủy");Db.Exec(c,tx,"UPDATE PhieuDangKy SET TrangThai='HUY' WHERE MaPhieu=@id",Db.P("@id",bookingId));tx.Commit();}catch{tx.Rollback();throw;}}}
  public void Complete(int bookingId){Db.Execute(@"UPDATE p SET TrangThai='HOAN_THANH' FROM PhieuDangKy p JOIN Tour t ON p.MaTour=t.MaTour WHERE p.MaPhieu=@id AND p.TrangThai='DA_XAC_NHAN' AND DATEADD(DAY,t.SoNgay,p.NgayDi)<=CAST(GETDATE() AS DATE)",Db.P("@id",bookingId));}
  public void Survey(SurveyRequest r) {if(r.Rating<1||r.Rating>5)throw new ArgumentException("Đánh giá từ 1 đến 5");if(Convert.ToInt32(Db.Scalar("SELECT COUNT(*) FROM PhieuDangKy WHERE MaPhieu=@id AND TrangThai='HOAN_THANH'",Db.P("@id",r.BookingId)))==0)throw new ArgumentException("Chỉ khảo sát sau khi hoàn thành");Db.Execute("INSERT INTO PhieuKhaoSat(MaPhieu,NoiDungGopY,DiemDanhGia) VALUES (@id,@comment,@rating)",Db.P("@id",r.BookingId),Db.P("@comment",r.Feedback),Db.P("@rating",r.Rating));}
  public DataTable Bookings() {return Db.Query(@"SELECT p.MaPhieu,k.TenKH,t.TenTour,p.LoaiDangKy,p.MaChuyen,p.SoNguoi,p.NgayDi,p.TongTien,p.TrangThai,p.CoBaoHiem FROM PhieuDangKy p JOIN KhachHang k ON p.MaKH=k.MaKH JOIN Tour t ON p.MaTour=t.MaTour ORDER BY p.MaPhieu DESC");}
  public DataTable Salary(int year,int month){return Db.Query(@"SELECT n.MaNV,n.TenNV,n.LuongCB,ISNULL(SUM(a.LuongTour),0) AS LuongTour,n.LuongCB+ISNULL(SUM(a.LuongTour),0) AS TongLuong FROM NhanVienHDDL n LEFT JOIN (PhanCong a JOIN PhieuDangKy p ON a.MaPhieu=p.MaPhieu AND p.TrangThai='HOAN_THANH' AND YEAR(p.NgayDi)=@year AND MONTH(p.NgayDi)=@month) ON a.MaNV=n.MaNV GROUP BY n.MaNV,n.TenNV,n.LuongCB ORDER BY n.MaNV",Db.P("@year",year),Db.P("@month",month));}
 }
}
