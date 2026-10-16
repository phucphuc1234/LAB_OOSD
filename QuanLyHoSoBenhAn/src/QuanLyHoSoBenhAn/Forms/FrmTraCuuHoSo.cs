using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Services;

namespace QuanLyHoSoBenhAn.Forms
{
    public class FrmTraCuuHoSo : Form
    {
        TextBox txt=new TextBox(); DataGridView g1=new DataGridView(), g2=new DataGridView(); HoSoService svc=new HoSoService();
        public FrmTraCuuHoSo()
        {
            Text="Tra cứu hồ sơ và lịch sử";Width=1050;Height=650;StartPosition=FormStartPosition.CenterParent;
            txt.Left=30;txt.Top=25;txt.Width=520;Controls.Add(txt);
            var b=new Button{Text="Tra cứu",Left=570,Top=23,Width=100};b.Click+=delegate{g1.DataSource=svc.TraCuu(txt.Text.Trim());};Controls.Add(b);
            g1.Left=30;g1.Top=75;g1.Width=970;g1.Height=220;g1.ReadOnly=true;g1.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.Fill;g1.SelectionChanged+=SelectRow;Controls.Add(g1);
            g2.Left=30;g2.Top=330;g2.Width=970;g2.Height=240;g2.ReadOnly=true;g2.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.Fill;Controls.Add(g2);
        }
        void SelectRow(object sender,EventArgs e){if(g1.CurrentRow==null||g1.CurrentRow.Cells["MaHoSo"].Value==null)return; g2.DataSource=svc.LayLichSu(Convert.ToInt32(g1.CurrentRow.Cells["MaHoSo"].Value));}
    }
}
