const { sql } = require('../config/database');
const { integer, fail } = require('./validation');

const actorId = actor => integer(typeof actor === 'object' && actor !== null ? actor.maTaiKhoan : actor, 'Tài khoản thực hiện');
const identifier = value => {
    if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) throw new Error('Invalid SQL alias');
    return value;
};
const scopeSql = (alias, parameter = 'ActorId') => `dbo.fn_CoSoDuocPhep(@${identifier(parameter)},${identifier(alias)}.MaCoSoTiem)=1`;
const citizenScopeSql = (alias, parameter = 'ActorId') => `dbo.fn_NguoiDanDuocPhep(@${identifier(parameter)},${identifier(alias)}.MaNguoiDan)=1`;

async function assertFacility(actor, facilityId, { active = false } = {}) {
    const pool = await sql.connect();
    const row = (await pool.request().input('ActorId', sql.Int, actorId(actor))
        .input('FacilityId', sql.Int, integer(facilityId, 'Cơ sở tiêm'))
        .query(`SELECT c.*,k.TenKhuVuc FROM dbo.COSOTIEM c JOIN dbo.KHUVUCTIEM k ON k.MaKhuVuc=c.MaKhuVuc
            WHERE c.MaCoSoTiem=@FacilityId AND ${scopeSql('c')}
            ${active ? 'AND c.TrangThai=1 AND k.TrangThai=1' : ''}`)).recordset[0];
    if (!row) fail('Cơ sở tiêm không thuộc phạm vi được giao hoặc chưa sẵn sàng.', 403);
    return row;
}
async function assertCitizen(actor, citizenId) {
    const pool = await sql.connect();
    const row = (await pool.request().input('ActorId', sql.Int, actorId(actor))
        .input('CitizenId', sql.Int, integer(citizenId, 'Người dân'))
        .query(`SELECT n.* FROM dbo.NGUOIDAN n WHERE n.MaNguoiDan=@CitizenId AND ${citizenScopeSql('n')}`)).recordset[0];
    if (!row) fail('Không tìm thấy người dân trong phạm vi được giao.', 404);
    return row;
}
const records = Object.freeze({ LOVACCINE: 'MaLo', LICHTIEM: 'MaLichTiem', MUITIEM: 'MaMuiTiem', CHONGCHIDINH: 'MaChongChiDinh' });
async function assertRecord(actor, table, idColumn, recordId) {
    if (!Object.hasOwn(records, table) || records[table] !== idColumn) throw new Error('Unsupported scoped table');
    const pool = await sql.connect();
    const row = (await pool.request().input('ActorId', sql.Int, actorId(actor))
        .input('RecordId', sql.Int, integer(recordId, 'Mã bản ghi'))
        .query(`SELECT r.* FROM dbo.${table} r WHERE r.${idColumn}=@RecordId AND ${scopeSql('r')}`)).recordset[0];
    if (!row) fail('Không tìm thấy dữ liệu trong phạm vi được giao.', 404);
    return row;
}
module.exports = { actorId, scopeSql, citizenScopeSql, assertFacility, assertCitizen, assertRecord };
