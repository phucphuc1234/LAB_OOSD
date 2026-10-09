using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using TravelManager.Data;
namespace TravelManager.UI {
 public class GridForm:Form {
  readonly TableSpec spec; readonly CrudRepository repo=new CrudRepository();readonly DataGridView table=new DataGridView();readonly Dictionary<string,TextBox> fields=new Dictionary<string,TextBox>();int? selected;
  public GridForm(TableSpec s){spec=s;Text="Quản lý: "+s.Table;Width=1120;Height=730;StartPosition=FormStartPosition.CenterParent;Font=new Font("Segoe UI",10);
   var split=new SplitContainer{Dock=DockStyle.Fill,SplitterDistance=660};Controls.Add(split);table.Dock=DockStyle.Fill;table.ReadOnly=true;table.SelectionMode=DataGridViewSelectionMode.FullRowSelect;table.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.DisplayedCells;table.MultiSelect=false;split.Panel1.Controls.Add(table);table.SelectionChanged+=(o,e)=>SelectRow();
   var panel=new FlowLayoutPanel{Dock=DockStyle.Fill,FlowDirection=FlowDirection.TopDown,WrapContents=false,AutoScroll=true,Padding=new Padding(14)};split.Panel2.Controls.Add(panel);
   panel.Controls.Add(new Label{Text="SỬA / THÊM: "+s.Table,AutoSize=true,Font=new Font("Segoe UI",13,FontStyle.Bold),Margin=new Padding(2,4,2,15)});
   foreach(string col in s.Columns){panel.Controls.Add(new Label{Text=col,AutoSize=true});var t=new TextBox{Width=340,Margin=new Padding(1,0,1,10)};fields[col]=t;panel.Controls.Add(t);}
   Button add=Btn("Làm mới",(o,e)=>Clear());Button save=Btn("Lưu",(o,e)=>Run(()=>{var values=new Dictionary<string,object>();foreach(var pair in fields){if(!string.IsNullOrWhiteSpace(pair.Value.Text))values.Add(pair.Key,pair.Value.Text.Trim());else if(pair.Key.StartsWith("Co") && pair.Key!="CongNo")values.Add(pair.Key,0);else values.Add(pair.Key,DBNull.Value);}repo.Save(spec,selected,values);Reload();Clear();}));Button del=Btn("Xóa dòng đã chọn",(o,e)=>Run(()=>{if(!selected.HasValue)return;if(MessageBox.Show("Xóa bản ghi?", "Xác nhận",MessageBoxButtons.YesNo)==DialogResult.Yes){repo.Delete(spec,selected.Value);Reload();Clear();}}));panel.Controls.Add(add);panel.Controls.Add(save);panel.Controls.Add(del);Reload(); }
  static Button Btn(string label,EventHandler handler){var b=new Button{Text=label,Width=340,Height=37,Margin=new Padding(0,5,0,5)};b.Click+=handler;return b;}
  void Run(Action a){try{a();}catch(Exception ex){MessageBox.Show(ex.Message,"Thao tác thất bại");}}
  void Reload(){table.DataSource=repo.All(spec);table.ClearSelection();}
  void Clear(){selected=null;foreach(var t in fields.Values)t.Clear();table.ClearSelection();}
  void SelectRow(){if(table.SelectedRows.Count==0)return;var row=table.SelectedRows[0];if(row.Cells[spec.PrimaryKey].Value==null)return;selected=Convert.ToInt32(row.Cells[spec.PrimaryKey].Value);foreach(var pair in fields)pair.Value.Text=Convert.ToString(row.Cells[pair.Key].Value);}
 }
}
