using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Models;
using QuanLyHoSoBenhAn.Services;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmLapToaThuoc : Form
    {
        NumericUpDown maPK=new NumericUpDown(),soLuong=new NumericUpDown();TextBox ten=new TextBox(),lieu=new TextBox(),cach=new TextBox(),hd=new TextBox();
        public FrmLapToaThuoc()
        {
            Text="Lập toa thuốc";Width=620;Height=480;StartPosition=FormStartPosition.CenterParent;
            AddRow("Mã phiếu khám",maPK,45);AddRow("Tên thuốc",ten,90);AddRow("Liều dùng",lieu,135);AddRow("Số lượng",soLuong,180);AddRow("Cách dùng",cach,225);AddRow("Hướng dẫn chung",hd,270);
            maPK.Minimum=1;soLuong.Minimum=1;soLuong.Maximum=10000;
            var b=new Button{Text="Lưu toa thuốc",Left=220,Top=335,Width=180,Height=40};b.Click+=delegate{try{int id=new ToaThuocService().LapToa((int)maPK.Value,hd.Text.Trim(),new ChiTietToaThuoc{TenThuoc=ten.Text.Trim(),LieuDung=lieu.Text.Trim(),SoLuong=(int)soLuong.Value,CachDung=cach.Text.Trim()});MessageBox.Show("Đã lập toa #"+id+". Phiếu khám chuyển sang Chờ thanh toán.");}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}};Controls.Add(b);
        }
        void AddRow(string l,Control c,int t){Controls.Add(new Label{Text=l,Left=70,Top=t+5,Width=140});c.Left=220;c.Top=t;c.Width=300;Controls.Add(c);}
    }
}
