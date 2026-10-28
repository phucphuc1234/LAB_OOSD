const { sql, databaseConfig } = require("../server/config/database");
(async () => {
    for (let i=0;i<30;i++) {
        const pool = new sql.ConnectionPool({ ...databaseConfig, database:"master", connectionTimeout:3000 });
        try { await pool.connect(); await pool.close(); console.log("SQL Server ready."); return; }
        catch { await pool.close().catch(()=>{}); await new Promise(resolve=>setTimeout(resolve,2000)); }
    }
    throw new Error("SQL Server did not become ready.");
})().catch(error=>{console.error(error.message);process.exitCode=1;});
