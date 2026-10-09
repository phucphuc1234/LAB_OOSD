using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
namespace TravelManager.Data {
 // Whitelisted table and column metadata; never interpolate user-entered SQL identifiers.
 public sealed class TableSpec {
  public string Table, PrimaryKey; public string[] Columns, Required;
  public TableSpec(string table,string pk,string columns,string required="") {Table=table;PrimaryKey=pk;Columns=columns.Split(',');Required=required.Length==0?new string[0]:required.Split(',');}
 }
 public static class Catalog {
  public static readonly Dictionary<string,TableSpec> Tables=new Dictionary<string,TableSpec> {
   {"Tour",new TableSpec("Tour","MaTour","TenTour,SoNgay,SoDem,DonGia","TenTour,SoNgay,SoDem,DonGia")},
   {"Chuyến đi",new TableSpec("ChuyenDi","MaChuyen","MaTour,NgayDi,NgayVe,SoCho","MaTour,NgayDi,NgayVe,SoCho")},
   {"Khách hàng",new TableSpec("KhachHang","MaKH","TenKH,DiaChi,DienThoai","TenKH")},
   {"Hướng dẫn viên",new TableSpec("NhanVienHDDL","MaNV","TenNV,LuongCB","TenNV,LuongCB")},
   {"Nơi dừng chân",new TableSpec("NoiDungChan","MaNoiDC","MaTour,ThuTu,TenNoi,CoDoiPhuongTien,CoNoiAn,CoKhachSan,LoaiKhachSan","MaTour,ThuTu,TenNoi")},
   {"Điểm tham quan",new TableSpec("DiemThamQuan","MaDiem","TenDiem,DiaDiem,NoiDung,YNghia","TenDiem")},
   {"Tour - điểm tham quan",new TableSpec("TourDiemThamQuan","MaTourDiem","MaTour,MaDiem,ThuTu","MaTour,MaDiem,ThuTu")},
   {"Chặng phương tiện",new TableSpec("TourChang","MaChang","MaTour,ThuTu,NoiDi,NoiDen,PhuongTien","MaTour,ThuTu,NoiDi,NoiDen,PhuongTien")}
  };
 }
 public class CrudRepository {
  public DataTable All(TableSpec spec) {return Db.Query("SELECT * FROM ["+spec.Table+"] ORDER BY ["+spec.PrimaryKey+"] DESC");}
  public int Save(TableSpec spec,int? id,Dictionary<string,object> values) {
   var cols=spec.Columns.Where(values.ContainsKey).ToArray();
   if(cols.Length==0) throw new ArgumentException("Chưa nhập dữ liệu");
   foreach(var col in spec.Required) if(!values.ContainsKey(col)||values[col]==null||values[col].ToString().Trim()=="") throw new ArgumentException("Thiếu "+col);
   var pars=cols.Select((col,i)=>Db.P("@p"+i,values[col])).ToArray();
   if(id.HasValue) {var sql="UPDATE ["+spec.Table+"] SET "+string.Join(",",cols.Select((col,i)=>"["+col+"]=@p"+i))+" WHERE ["+spec.PrimaryKey+"]=@id"; return Db.Execute(sql,pars.Concat(new[]{Db.P("@id",id.Value)}).ToArray());}
   else {var sql="INSERT INTO ["+spec.Table+"] ("+string.Join(",",cols.Select(c=>"["+c+"]"))+") VALUES ("+string.Join(",",cols.Select((col,i)=>"@p"+i))+")";return Db.Execute(sql,pars);}
  }
  public void Delete(TableSpec spec,int id) {Db.Execute("DELETE FROM ["+spec.Table+"] WHERE ["+spec.PrimaryKey+"]=@id",Db.P("@id",id));}
 }
}
