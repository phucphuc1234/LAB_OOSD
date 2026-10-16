using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Models;
using QuanLyHoSoBenhAn.Services;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmKhamBenh : Form
    {
        NumericUpDown maHoSo=new NumericUpDown(),nhiet=new NumericUpDown(),maPK=new NumericUpDown(); ComboBox bs=new ComboBox(),khoa=new ComboBox(),loai=new ComboBox();
        TextBox trieuChung=new TextBox(),huyetAp=new TextBox(),chanDoan=new TextBox(),tenXN=new TextBox(),ketQua=new TextBox(); KhamBenhService svc=new KhamBenhService();
        public FrmKhamBenh()
        {
            Text="Ghi nhận phiếu khám / xét nghiệm";Width=760;Height=620;StartPosition=FormStartPosition.CenterParent;
            AddRow("Mã hồ sơ",maHoSo,35);AddRow("Bác sĩ",bs,80);AddRow("Khoa",khoa,125);AddRow("Loại khám",loai,170);AddRow("Triệu chứng",trieuChung,215);AddRow("Thân nhiệt",nhiet,260);AddRow("Huyết áp",huyetAp,305);AddRow("Chẩn đoán",chanDoan,350);
            maHoSo.Minimum=1;loai.Items.AddRange(new object[]{"Điều trị","Định kỳ"});loai.SelectedIndex=0;nhiet.DecimalPlaces=1;nhiet.Minimum=30;nhiet.Maximum=45;nhiet.Value=37;
            bs.DataSource=svc.LayBacSi();bs.DisplayMember="HoTen";bs.ValueMember="MaBacSi";khoa.DataSource=svc.LayKhoa();khoa.DisplayMember="TenKhoa";khoa.ValueMember="MaKhoa";
            var b=new Button{Text="Tạo phiếu khám",Left=190,Top=400,Width=170,Height=36};b.Click+=CreateVisit;Controls.Add(b);
            Controls.Add(new Label{Text="Mã phiếu khám",Left=430,Top=60,Width=110});maPK.Left=550;maPK.Top=55;maPK.Minimum=1;maPK.Width=140;Controls.Add(maPK);
            Controls.Add(new Label{Text="Tên xét nghiệm",Left=430,Top=110,Width=110});tenXN.Left=550;tenXN.Top=105;tenXN.Width=160;Controls.Add(tenXN);
            Controls.Add(new Label{Text="Kết quả",Left=430,Top=160,Width=110});ketQua.Left=550;ketQua.Top=155;ketQua.Width=160;Controls.Add(ketQua);
            var bx=new Button{Text="Thêm xét nghiệm",Left=520,Top=210,Width=170,Height=36};bx.Click+=AddTest;Controls.Add(bx);
        }
        void AddRow(string l,Control c,int t){Controls.Add(new Label{Text=l,Left=45,Top=t+5,Width=140});c.Left=185;c.Top=t;c.Width=200;Controls.Add(c);}
        void CreateVisit(object s,EventArgs e){try{int id=svc.TaoPhieuKham(new PhieuKham{MaHoSo=(int)maHoSo.Value,MaBacSi=Convert.ToInt32(bs.SelectedValue),MaKhoa=Convert.ToInt32(khoa.SelectedValue),LoaiKham=Convert.ToString(loai.SelectedItem),TrieuChung=trieuChung.Text.Trim(),ThanNhiet=nhiet.Value,HuyetAp=huyetAp.Text.Trim(),ChanDoan=chanDoan.Text.Trim()});maPK.Value=id;MessageBox.Show("Đã tạo phiếu khám #"+id);}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}}
        void AddTest(object s,EventArgs e){try{svc.ThemXetNghiem((int)maPK.Value,tenXN.Text.Trim(),ketQua.Text.Trim());MessageBox.Show("Đã liên kết xét nghiệm với phiếu khám.");}catch(Exception ex){MessageBox.Show(ex.Message,"Lỗi");}}
    }
}
