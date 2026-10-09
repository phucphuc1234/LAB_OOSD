using System;
using System.Drawing;
using System.Windows.Forms;
using TravelManager.Data;
using TravelManager.Models;
using TravelManager.Services;
namespace TravelManager.UI {
 public class BookingForm:Form {
  readonly TravelService service=new TravelService();readonly ComboBox tours=new ComboBox(),customers=new ComboBox(),trips=new ComboBox(),type=new ComboBox();readonly NumericUpDown count=new NumericUpDown(),deposit=new NumericUpDown();readonly DateTimePicker depart=new DateTimePicker();readonly TextBox agency=new TextBox(),representative=new TextBox(),pickup=new TextBox(),phone=new TextBox();readonly CheckBox insured=new CheckBox();readonly TextBox insuredNames=new TextBox();readonly DataGridView list=new DataGridView();
  public BookingForm(){Text="Đăng ký Tour";Width=1180;Height=780;StartPosition=FormStartPosition.CenterParent;var layout=new SplitContainer{Dock=DockStyle.Fill,SplitterDistance=425};Controls.Add(layout);var pane=new FlowLayoutPanel{Dock=DockStyle.Fill,FlowDirection=FlowDirection.TopDown,AutoScroll=true,WrapContents=false,Padding=new Padding(12)};layout.Panel1.Controls.Add(pane);
   Combo(pane,"Tour",tours);Combo(pane,"Khách hàng",customers);Combo(pane,"Chuyến (khách lẻ)",trips);Combo(pane,"Hình thức",type);type.Items.AddRange(new object[]{"LE","DOAN"});type.SelectedIndex=0;
   count.Minimum=1;count.Maximum=500;count.Value=1;Number(pane,"Số người",count);deposit.Maximum=1000000000;deposit.DecimalPlaces=0;deposit.Increment=100000;Number(pane,"Tiền cọc đoàn",deposit);Text(pane,"Đơn vị / gia đình",agency);Text(pane,"Người đại diện",representative);Text(pane,"Địa điểm đón",pickup);Text(pane,"Điện thoại",phone);pane.Controls.Add(new Label{Text="Ngày đi đoàn",AutoSize=true});depart.Width=370;pane.Controls.Add(depart);insured.Text="Có bảo hiểm";insured.AutoSize=true;pane.Controls.Add(insured);insuredNames.Multiline=true;insuredNames.Height=85;Text(pane,"Danh sách khách bảo hiểm (mỗi người một dòng)",insuredNames);
   var button=new Button{Text="LẬP PHIẾU VÀ THU TIỀN",Width=370,Height=46,BackColor=Color.LightSkyBlue};button.Click+=(s,e)=>Act(()=>{var r=new BookingRequest{TourId=Get(tours),CustomerId=Get(customers),TripId=type.Text=="LE"?(int?)Get(trips):null,Type=type.Text,Headcount=(int)count.Value,Deposit=deposit.Value,AgencyName=agency.Text,Representative=representative.Text,Pickup=pickup.Text,Phone=phone.Text,Departure=depart.Value,Insurance=insured.Checked,InsuredNames=insuredNames.Text};int id=service.Register(r);MessageBox.Show("Đã lập phiếu số "+id);Reload();});pane.Controls.Add(button);
   list.Dock=DockStyle.Fill;list.ReadOnly=true;list.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.DisplayedCells;layout.Panel2.Controls.Add(list);Act(()=>{tours.DataSource=Db.Query("SELECT MaTour,TenTour FROM Tour");tours.DisplayMember="TenTour";tours.ValueMember="MaTour";customers.DataSource=Db.Query("SELECT MaKH,TenKH FROM KhachHang");customers.DisplayMember="TenKH";customers.ValueMember="MaKH";trips.DataSource=Db.Query("SELECT MaChuyen,CONCAT(MaChuyen,' - ',CONVERT(VARCHAR(10),NgayDi,120)) AS Ten FROM ChuyenDi");trips.DisplayMember="Ten";trips.ValueMember="MaChuyen";Reload();});}
  static int Get(ComboBox b){if(b.SelectedValue==null)throw new ArgumentException("Chưa chọn dữ liệu");return Convert.ToInt32(b.SelectedValue);}
  void Reload(){list.DataSource=service.Bookings();}
  void Act(Action a){try{a();}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi nghiệp vụ");}}
  public static void Combo(FlowLayoutPanel p,string label,ComboBox box){p.Controls.Add(new Label{Text=label,AutoSize=true});box.Width=370;box.DropDownStyle=ComboBoxStyle.DropDownList;p.Controls.Add(box);}
  public static void Text(FlowLayoutPanel p,string label,TextBox box){p.Controls.Add(new Label{Text=label,AutoSize=true});box.Width=370;p.Controls.Add(box);}
  public static void Number(FlowLayoutPanel p,string label,NumericUpDown box){p.Controls.Add(new Label{Text=label,AutoSize=true});box.Width=370;p.Controls.Add(box);}
 }
}
