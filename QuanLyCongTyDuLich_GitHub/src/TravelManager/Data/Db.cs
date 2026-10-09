using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
namespace TravelManager.Data {
 public static class Db {
  public static SqlConnection Open() { var c=new SqlConnection(ConfigurationManager.ConnectionStrings["TravelDb"].ConnectionString); c.Open(); return c; }
  public static SqlParameter P(string name, object value) { return new SqlParameter(name, value??DBNull.Value); }
  public static DataTable Query(string sql, params SqlParameter[] args) { using(var c=Open()) using(var cmd=new SqlCommand(sql,c)) using(var da=new SqlDataAdapter(cmd)) {cmd.Parameters.AddRange(args); var t=new DataTable(); da.Fill(t); return t;} }
  public static int Execute(string sql, params SqlParameter[] args) { using(var c=Open()) using(var cmd=new SqlCommand(sql,c)) { cmd.Parameters.AddRange(args); return cmd.ExecuteNonQuery(); } }
  public static object Scalar(string sql, params SqlParameter[] args) {using(var c=Open()) using(var cmd=new SqlCommand(sql,c)){cmd.Parameters.AddRange(args);return cmd.ExecuteScalar();}}
  public static object Scalar(SqlConnection c, SqlTransaction tx,string sql,params SqlParameter[] args) { using(var cmd=new SqlCommand(sql,c,tx)){cmd.Parameters.AddRange(args);return cmd.ExecuteScalar();} }
  public static int Exec(SqlConnection c, SqlTransaction tx,string sql,params SqlParameter[] args) { using(var cmd=new SqlCommand(sql,c,tx)){cmd.Parameters.AddRange(args);return cmd.ExecuteNonQuery();} }
 }
}
