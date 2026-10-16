using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Services;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmLichHen : Form
    {
        NumericUpDown num=new NumericUpDown();DateTimePicker dt=new DateTimePicker();TextBox note=new TextBox();
        public FrmLichHen()
        {
            Text="Đặt lịch khám định kỳ theo quý";Width=600;Height=360;StartPosition=FormStartPosition.CenterParent;
            Controls.Add(new Label{Text="Mã bệnh nhân",Left=70,Top=65,Width=140});num.Left=220;num.Top=60;num.Width=250;num.Minimum=1;Controls.Add(num);
            Controls.Add(new Label{Text="Ngày giờ hẹn",Left=70,Top=115,Width=140});dt.Left=220;dt.Top=110;dt.Width=250;dt.Format=DateTimePickerFormat.Custom;dt.CustomFormat="dd/MM/yyyy HH:mm";Controls.Add(dt);
            Controls.Add(new Label{Text="Ghi chú",Left=70,Top=165,Width=140});note.Left=220;note.Top=160;note.Width=250;Controls.Add(note);
            var b=new Button{Text="Đặt lịch định kỳ",Left=220,Top=220,Width=180,Height=40};b.Click+=delegate{try{new LichHenService().DatLichDinhKy((int)num.Value,dt.Value,note.Text.Trim());MessageBox.Show("Đặt lịch thành công.");}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}};Controls.Add(b);
        }
    }
}
