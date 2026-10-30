const { integer, text, fail } = require("../utils/validation");
const repository = require("../repositories/traceRepository");
const batchResult = records => {
    if (!records.length) fail("Không tìm thấy lô vaccine được phép truy vết.", 404);
    const first = records[0];
    const vaccinations = records.filter(row => row.MaMuiTiem != null);
    return { batch: {
        maLo: first.MaLo, maLoVaccine: first.MaLoVaccine, maVaccine: first.MaVaccine,
        tenVaccine: first.TenVaccine, ngaySanXuat: first.NgaySanXuat, hanSuDung: first.HanSuDung,
        soLuongNhap: first.SoLuongNhap, soLuongCon: first.SoLuongCon, trangThai: first.TrangThai,
        maCoSoTiem: first.MaCoSoTiem, tenCoSo: first.TenCoSo, diaChiCoSo: first.DiaChiCoSo,
    }, soMuiTiemDaSuDung: vaccinations.length, vaccinations };
};
const traceBatchById = async (id, actorId) => batchResult(await repository.traceByBatchId(
    integer(id, "Mã lô"), integer(actorId, "Tài khoản nhân viên")));
const traceBatchByCode = async (code, actorId) => batchResult(await repository.traceByBatchCode(
    text(code, "Mã lô vaccine", 50, true), integer(actorId, "Tài khoản nhân viên")));
const traceVaccination = async (id, actorId) => {
    const row = await repository.traceByVaccinationId(integer(id, "Mã mũi tiêm"), integer(actorId, "Tài khoản nhân viên"));
    if (!row) fail("Không tìm thấy mũi tiêm được phép truy vết.", 404);
    return { ...row, TrangThaiLo: row.TrangThai };
};
module.exports = { traceBatchById, traceBatchByCode, traceVaccination };
