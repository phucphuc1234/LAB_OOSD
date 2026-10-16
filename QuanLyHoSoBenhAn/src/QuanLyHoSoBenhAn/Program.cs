using System;
using System.Windows.Forms;
using QuanLyHoSoBenhAn.Forms;

namespace QuanLyHoSoBenhAn
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new FrmMain());
        }
    }
}
