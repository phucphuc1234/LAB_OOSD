using System.Configuration;
using System.Data.SqlClient;

namespace eShoppingPrototype.Data
{
    public class DatabaseHelper
    {
        private static readonly string ConnectionString = 
            ConfigurationManager.ConnectionStrings["eShoppingDB"]?.ConnectionString 
            ?? "Server=.;Database=eShoppingDB;Trusted_Connection=True;";

        public static SqlConnection GetConnection()
        {
            return new SqlConnection(ConnectionString);
        }
    }
}
