using System;
using System.Windows.Forms;
using eShoppingPrototype.UI;

namespace eShoppingPrototype
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new FormCheckout());
        }
    }
}
