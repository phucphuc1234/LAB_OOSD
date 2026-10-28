const { integer } = require("../utils/validation");
const historyRepository =
    require("../repositories/historyRepository");

const citizenRepository =
    require("../repositories/citizenRepository");


const createError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};


// Người dân xem lịch sử của chính mình
const getMyHistory = async (
    maTaiKhoan
) => {
    const citizen =
        await citizenRepository
            .findByAccountId(maTaiKhoan);

    if (!citizen) {
        throw createError(
            "Không tìm thấy hồ sơ người dân.",
            404
        );
    }

    return await historyRepository
        .findByCitizenId(
            citizen.MaNguoiDan
        );
};


// Nhân viên xem lịch sử của người dân
const getCitizenHistory = async (
    maNguoiDan
) => {
    maNguoiDan = integer(maNguoiDan, "Mã người dân");
    const citizen =
        await citizenRepository.findById(
            maNguoiDan
        );

    if (!citizen) {
        throw createError(
            "Không tìm thấy người dân.",
            404
        );
    }

    return await historyRepository
        .findByCitizenId(
            maNguoiDan
        );
};


// Xem chi tiết một mũi tiêm
const getHistoryDetail = async (
    maMuiTiem
) => {
    maMuiTiem = integer(maMuiTiem, "Mã mũi tiêm");
    const vaccination =
        await historyRepository
            .findByVaccinationId(
                maMuiTiem
            );

    if (!vaccination) {
        throw createError(
            "Không tìm thấy bản ghi tiêm.",
            404
        );
    }

    return vaccination;
};


// Người dân xem chi tiết,
// nhưng chỉ được xem mũi tiêm của mình
const getMyHistoryDetail = async (
    maTaiKhoan,
    maMuiTiem
) => {
    maMuiTiem = integer(maMuiTiem, "Mã mũi tiêm");
    const citizen =
        await citizenRepository
            .findByAccountId(
                maTaiKhoan
            );

    if (!citizen) {
        throw createError(
            "Không tìm thấy hồ sơ người dân.",
            404
        );
    }

    const vaccination =
        await historyRepository
            .findByVaccinationId(
                maMuiTiem
            );

    if (!vaccination) {
        throw createError(
            "Không tìm thấy bản ghi tiêm.",
            404
        );
    }

    if (
        vaccination.MaNguoiDan !==
        citizen.MaNguoiDan
    ) {
        throw createError(
            "Bạn không có quyền xem bản ghi này.",
            403
        );
    }

    return vaccination;
};


module.exports = {
    getMyHistory,
    getCitizenHistory,
    getHistoryDetail,
    getMyHistoryDetail
};
