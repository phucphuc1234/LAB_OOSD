using System;
using System.Windows.Forms;
using TravelManager.UI;
namespace TravelManager { static class Program { [STAThread] static void Main() { Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false); Application.Run(new MainForm()); } } }
