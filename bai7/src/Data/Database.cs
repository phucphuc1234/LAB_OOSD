using System; using System.Data; using System.Data.SqlClient; using System.Configuration;
namespace DongA.Data {
 public class Database {
 readonly string cs=ConfigurationManager.ConnectionStrings["DongA"].ConnectionString;
 public DataTable Query(string sql, params SqlParameter[] args) { using(var c=new SqlConnection(cs)) using(var cmd=new SqlCommand(sql,c)) {cmd.CommandTimeout=120;cmd.Parameters.AddRange(args);using(var a=new SqlDataAdapter(cmd)){var t=new DataTable();a.Fill(t);return t;}} }
 public void Execute(string sql, params SqlParameter[] args) {using(var c=new SqlConnection(cs)) using(var cmd=new SqlCommand(sql,c)){cmd.CommandTimeout=120;cmd.Parameters.AddRange(args);c.Open();cmd.ExecuteNonQuery();}}
 public void Procedure(string name,params SqlParameter[] args){using(var c=new SqlConnection(cs))using(var cmd=new SqlCommand(name,c)){cmd.CommandType=CommandType.StoredProcedure;cmd.CommandTimeout=120;cmd.Parameters.AddRange(args);c.Open();try{cmd.ExecuteNonQuery();}catch{try{using(var rollback=new SqlCommand("IF @@TRANCOUNT>0 ROLLBACK",c))rollback.ExecuteNonQuery();}catch{}throw;}}}
 }
}