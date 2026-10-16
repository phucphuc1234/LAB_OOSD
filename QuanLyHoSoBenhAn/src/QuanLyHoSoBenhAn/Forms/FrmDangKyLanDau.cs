using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Models;
using QuanLyHoSoBenhAn.Services;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmDangKyLanDau : Form
    {
        TextBox txtHoTen=new TextBox(), txtDiaChi=new TextBox(), txtDienThoai=new TextBox(), txtAnh=new TextBox();
        DateTimePicker dtNgaySinh=new DateTimePicker(); NumericUpDown numLePhi=new NumericUpDown();
        public FrmDangKyLanDau()
        {
            Text="Đăng ký bệnh nhân lần đầu"; Width=620; Height=460; StartPosition=FormStartPosition.CenterParent;
            AddRow("Họ tên",txtHoTen,40); AddRow("Địa chỉ",txtDiaChi,85); AddRow("Ngày sinh",dtNgaySinh,130);
            AddRow("Điện thoại",txtDienThoai,175); AddRow("Ảnh 3x4 (đường dẫn)",txtAnh,220);
            Controls.Add(new Label{Text="Lệ phí năm",Left=70,Top=270,Width=130});
            numLePhi.Left=220; numLePhi.Top=265; numLePhi.Width=250; numLePhi.Maximum=100000000; numLePhi.Value=1200000; Controls.Add(numLePhi);
            var btn=new Button{Text="Đăng ký + cấp hồ sơ",Left=220,Top=325,Width=200,Height=40}; btn.Click+=OnSave; Controls.Add(btn);
        }
        void AddRow(string label,Control c,int top){Controls.Add(new Label{Text=label,Left=70,Top=top+5,Width=140}); c.Left=220;c.Top=top;c.Width=300;Controls.Add(c);}
        void OnSave(object sender,EventArgs e)
        {
            try{
                var r=new DangKyService().DangKyLanDau(new BenhNhan{HoTen=txtHoTen.Text.Trim(),DiaChi=txtDiaChi.Text.Trim(),NgaySinh=dtNgaySinh.Value.Date,DienThoai=txtDienThoai.Text.Trim(),Anh3x4=txtAnh.Text.Trim()},numLePhi.Value);
                MessageBox.Show("Đăng ký thành công. Mã hồ sơ: "+r.MaHoSoCode);
            }catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}
        }
    }
}
