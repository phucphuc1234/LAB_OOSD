using System;
using System.Drawing;
using System.Windows.Forms;
using TravelManager.Data;
namespace TravelManager.UI {
 public class MainForm:Form {
  public MainForm(){Text="QUẢN LÝ CÔNG TY DU LỊCH - HUTECH";Width=1100;Height=720;StartPosition=FormStartPosition.CenterScreen;Font=new Font("Segoe UI",10);
   var title=new Label{Text="HỆ THỐNG QUẢN LÝ CÔNG TY DU LỊCH",Dock=DockStyle.Top,Height=85,TextAlign=ContentAlignment.MiddleCenter,BackColor=Color.FromArgb(26,65,110),ForeColor=Color.White,Font=new Font("Segoe UI",20,FontStyle.Bold)};Controls.Add(title);
   var grid=new FlowLayoutPanel{Dock=DockStyle.Fill,Padding=new Padding(30),AutoScroll=true,WrapContents=true};Controls.Add(grid);grid.BringToFront();
   foreach(var kv in Catalog.Tables){var spec=kv.Value;Add(grid,kv.Key,()=>new GridForm(spec).ShowDialog(this));}
   Add(grid,"Đăng ký tour / đoàn",()=>new BookingForm().ShowDialog(this));Add(grid,"Phân công HDV",()=>new AssignmentForm().ShowDialog(this));Add(grid,"Thanh toán / khảo sát",()=>new PaymentForm().ShowDialog(this));Add(grid,"Tính lương tháng",()=>new SalaryForm().ShowDialog(this));
   var note=new Label{Text="Hướng dẫn: Tạo Tour, Chuyến, Khách hàng, Hướng dẫn viên trước khi đăng ký. Kết nối SQL cấu hình trong App.config.",Dock=DockStyle.Bottom,Height=45,TextAlign=ContentAlignment.MiddleCenter};Controls.Add(note);
  }
  void Add(FlowLayoutPanel p,string s,Action click){var b=new Button{Text=s,Width=230,Height=70,Margin=new Padding(9),BackColor=Color.FromArgb(230,242,255),FlatStyle=FlatStyle.Flat};b.Click+=(o,e)=>{try{click();}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi",MessageBoxButtons.OK,MessageBoxIcon.Error);}};p.Controls.Add(b);}
 }
}
