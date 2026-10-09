using System;
using System.Windows.Forms;
using TravelManager.Data;
using TravelManager.Models;
using TravelManager.Services;
namespace TravelManager.UI {
 public class PaymentForm:Form {
  readonly TravelService svc=new TravelService();readonly NumericUpDown id=new NumericUpDown(),amount=new NumericUpDown(),rating=new NumericUpDown();readonly ComboBox kind=new ComboBox();readonly TextBox feedback=new TextBox();readonly DataGridView grid=new DataGridView();
  public PaymentForm(){Text="Quyết toán - kết thúc tour - khảo sát";Width=1120;Height=650;var p=new FlowLayoutPanel{Dock=DockStyle.Left,Width=420,AutoScroll=true,FlowDirection=FlowDirection.TopDown,WrapContents=false,Padding=new Padding(10)};Controls.Add(p);id.Minimum=1;id.Maximum=999999;BookingForm.Number(p,"Mã phiếu",id);kind.Items.AddRange(new object[]{"QUYET_TOAN","HOAN_TIEN"});kind.SelectedIndex=0;BookingForm.Combo(p,"Loại giao dịch",kind);amount.Maximum=1000000000;amount.Increment=100000;BookingForm.Number(p,"Số tiền",amount);Button(p,"Ghi thanh toán",()=>svc.Pay(new PaymentRequest{BookingId=(int)id.Value,Amount=amount.Value,Kind=kind.Text}));Button(p,"Hủy phiếu (đoàn mất cọc)",()=>svc.Cancel((int)id.Value));Button(p,"Hoàn thành tour (sau ngày về)",()=>svc.Complete((int)id.Value));rating.Minimum=1;rating.Maximum=5;rating.Value=5;BookingForm.Number(p,"Đánh giá 1–5",rating);BookingForm.Text(p,"Ý kiến khảo sát",feedback);Button(p,"Lưu khảo sát",()=>svc.Survey(new SurveyRequest{BookingId=(int)id.Value,Rating=(int)rating.Value,Feedback=feedback.Text}));grid.Dock=DockStyle.Fill;grid.ReadOnly=true;grid.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.DisplayedCells;Controls.Add(grid);Reload();}
  void Button(FlowLayoutPanel p,string text,Action a){var b=new Button{Text=text,Width=380,Height=39};b.Click+=(s,e)=>{try{a();Reload();MessageBox.Show("Đã xử lý yêu cầu");}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}};p.Controls.Add(b);}
  void Reload(){try{grid.DataSource=svc.Bookings();}catch(Exception ex){MessageBox.Show(ex.Message);}}
 }
}
