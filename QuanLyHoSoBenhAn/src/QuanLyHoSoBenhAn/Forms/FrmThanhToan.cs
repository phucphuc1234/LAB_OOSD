using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Services;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmThanhToan : Form
    {
        NumericUpDown maPK=new NumericUpDown(),soTien=new NumericUpDown();TextBox note=new TextBox();
        public FrmThanhToan()
        {
            Text="Thanh toán viện phí & hoàn tất";Width=580;Height=330;StartPosition=FormStartPosition.CenterParent;
            Controls.Add(new Label{Text="Mã phiếu khám",Left=70,Top=65,Width=140});maPK.Left=220;maPK.Top=60;maPK.Width=250;maPK.Minimum=1;Controls.Add(maPK);
            Controls.Add(new Label{Text="Số tiền",Left=70,Top=115,Width=140});soTien.Left=220;soTien.Top=110;soTien.Width=250;soTien.Maximum=1000000000;soTien.Value=500000;Controls.Add(soTien);
            Controls.Add(new Label{Text="Ghi chú",Left=70,Top=165,Width=140});note.Left=220;note.Top=160;note.Width=250;Controls.Add(note);
            var b=new Button{Text="Thanh toán & hoàn tất",Left=220,Top=215,Width=200,Height=40};b.Click+=delegate{try{new KhamBenhService().ThanhToanVaHoanTat((int)maPK.Value,soTien.Value,note.Text.Trim());MessageBox.Show("Thanh toán thành công. Phiếu khám đã Hoàn tất.");}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}};Controls.Add(b);
        }
    }
}
