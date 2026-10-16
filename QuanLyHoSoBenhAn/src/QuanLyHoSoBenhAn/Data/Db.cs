using System.Configuration;
using System.Data.SqlClient;

namespace QuanLyHoSoBenhAn.Data
{
    public static class Db
    {
        public static SqlConnection Open()
        {
            var cs = ConfigurationManager.ConnectionStrings["HospitalDb"].ConnectionString;
            var cn = new SqlConnection(cs);
            cn.Open();
            return cn;
        }
    }
}
