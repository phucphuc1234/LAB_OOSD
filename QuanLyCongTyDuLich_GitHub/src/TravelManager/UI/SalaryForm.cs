using System;
using System.Windows.Forms;
using TravelManager.Services;
namespace TravelManager.UI {
 public class SalaryForm:Form {public SalaryForm(){Text="Bảng lương hướng dẫn viên";Width=900;Height=600;var bar=new FlowLayoutPanel{Dock=DockStyle.Top,Height=60};Controls.Add(bar);var year=new NumericUpDown{Minimum=2020,Maximum=2100,Value=DateTime.Today.Year};var month=new NumericUpDown{Minimum=1,Maximum=12,Value=DateTime.Today.Month};var view=new DataGridView{Dock=DockStyle.Fill,ReadOnly=true,AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.Fill};bar.Controls.Add(new Label{Text="Năm",AutoSize=true});bar.Controls.Add(year);bar.Controls.Add(new Label{Text="Tháng",AutoSize=true});bar.Controls.Add(month);var button=new Button{Text="Tính lương"};bar.Controls.Add(button);button.Click+=(s,e)=>{try{view.DataSource=new TravelService().Salary((int)year.Value,(int)month.Value);}catch(Exception ex){MessageBox.Show(ex.Message);}};Controls.Add(view);view.BringToFront();button.PerformClick();}}
}
