using System;
using System.Drawing;
using System.Windows.Forms;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmMain : Form
    {
        public FrmMain()
        {
            Text = "Quản lý hồ sơ bệnh án";
            Width = 980; Height = 620; StartPosition = FormStartPosition.CenterScreen;
            Controls.Add(new Label { Text = "HỆ THỐNG QUẢN LÝ HỒ SƠ BỆNH ÁN", Font = new Font("Segoe UI",20,FontStyle.Bold), AutoSize = true, Left = 220, Top = 45 });
            AddButton("Đăng ký lần đầu",110,150,delegate { new FrmDangKyLanDau().ShowDialog(); });
            AddButton("Tra cứu hồ sơ",360,150,delegate { new FrmTraCuuHoSo().ShowDialog(); });
            AddButton("Đặt lịch định kỳ",610,150,delegate { new FrmLichHen().ShowDialog(); });
            AddButton("Ghi nhận khám",110,260,delegate { new FrmKhamBenh().ShowDialog(); });
            AddButton("Lập toa thuốc",360,260,delegate { new FrmLapToaThuoc().ShowDialog(); });
            AddButton("Thanh toán viện phí",610,260,delegate { new FrmThanhToan().ShowDialog(); });
            Controls.Add(new Label { Text = "Kiến trúc: UI → Service → Data → SQL Server", AutoSize = true, Left = 320, Top = 430, ForeColor = Color.DimGray });
        }
        private void AddButton(string text,int left,int top,EventHandler click)
        {
            var b = new Button { Text=text, Width=200, Height=60, Left=left, Top=top };
            b.Click += click; Controls.Add(b);
        }
    }
}
