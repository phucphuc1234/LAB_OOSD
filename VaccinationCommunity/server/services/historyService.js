const { integer, fail } = require("../utils/validation");
const history = require("../repositories/historyRepository");
const citizens = require("../repositories/citizenRepository");
const ownCitizen = async accountId => {
    const ownerAccountId = integer(accountId, "Tài khoản người dân");
    const row = await citizens.findByAccountId(ownerAccountId);
    if (!row) fail("Không tìm thấy hồ sơ người dân.", 404);
    return { row, ownerAccountId };
};
const getMyHistory = async accountId => {
    const { row, ownerAccountId } = await ownCitizen(accountId);
    return history.findByCitizenId(row.MaNguoiDan, { ownerAccountId });
};
const getCitizenHistory = async (citizenId, accountId) => {
    citizenId = integer(citizenId, "Mã người dân");
    const actorId = integer(accountId, "Tài khoản nhân viên");
    if (!await citizens.findScopedById(citizenId, actorId)) fail("Không tìm thấy hồ sơ người dân được phép xem.", 404);
    return history.findByCitizenId(citizenId, { actorId });
};
const getHistoryDetail = async (vaccinationId, accountId) => {
    const row = await history.findByVaccinationId(integer(vaccinationId, "Mã mũi tiêm"), {
        actorId: integer(accountId, "Tài khoản nhân viên"),
    });
    if (!row) fail("Không tìm thấy bản ghi tiêm được phép xem.", 404);
    return row;
};
const getMyHistoryDetail = async (accountId, vaccinationId) => {
    const { ownerAccountId } = await ownCitizen(accountId);
    const row = await history.findByVaccinationId(integer(vaccinationId, "Mã mũi tiêm"), { ownerAccountId });
    if (!row) fail("Không tìm thấy bản ghi tiêm thuộc hồ sơ của bạn.", 404);
    return row;
};
module.exports = { getMyHistory, getCitizenHistory, getHistoryDetail, getMyHistoryDetail };
