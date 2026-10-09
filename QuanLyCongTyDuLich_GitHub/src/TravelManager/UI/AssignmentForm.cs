using System;
using System.Windows.Forms;
using TravelManager.Data;
using TravelManager.Models;
using TravelManager.Services;
namespace TravelManager.UI {
 public class AssignmentForm:Form {
  readonly ComboBox staff=new ComboBox(),booking=new ComboBox();readonly NumericUpDown wage=new NumericUpDown();readonly DataGridView view=new DataGridView();
  public AssignmentForm(){Text="Phân công hướng dẫn viên";Width=990;Height=640;var top=new FlowLayoutPanel{Dock=DockStyle.Top,Height=165,Padding=new Padding(10)};Controls.Add(top);BookingForm.Combo(top,"Hướng dẫn viên",staff);BookingForm.Combo(top,"Phiếu đăng ký",booking);wage.Maximum=100000000;wage.Increment=100000;BookingForm.Number(top,"Thù lao tour",wage);var b=new Button{Text="Lưu phân công",Width=180,Height=43};top.Controls.Add(b);b.Click+=(s,e)=>Run(()=>{new TravelService().Assign(new AssignmentRequest{StaffId=Convert.ToInt32(staff.SelectedValue),BookingId=Convert.ToInt32(booking.SelectedValue),TourWage=wage.Value});Reload();});view.Dock=DockStyle.Fill;view.ReadOnly=true;view.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.Fill;Controls.Add(view);view.BringToFront();Run(()=>{staff.DataSource=Db.Query("SELECT MaNV,TenNV FROM NhanVienHDDL");staff.DisplayMember="TenNV";staff.ValueMember="MaNV";booking.DataSource=Db.Query("SELECT MaPhieu,CONCAT('Phiếu ',MaPhieu) AS Ten FROM PhieuDangKy WHERE TrangThai <> 'HUY'");booking.DisplayMember="Ten";booking.ValueMember="MaPhieu";Reload();});}
  void Reload(){view.DataSource=Db.Query("SELECT a.MaPhanCong,n.TenNV,p.MaPhieu,p.NgayDi,a.LuongTour FROM PhanCong a JOIN NhanVienHDDL n ON a.MaNV=n.MaNV JOIN PhieuDangKy p ON a.MaPhieu=p.MaPhieu ORDER BY a.MaPhanCong DESC");}
  static void Run(Action a){try{a();}catch(Exception ex){MessageBox.Show(ex.Message);}}
 }
}
