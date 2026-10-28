const { integer, text } = require("../utils/validation");
const traceRepository =
    require("../repositories/traceRepository");

const batchRepository =
    require("../repositories/batchRepository");

const vaccinationRepository =
    require(
        "../repositories/vaccinationRepository"
    );


const createError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};


// Theo ID lô
const traceBatchById = async (maLo) => {
    maLo = integer(maLo, "Mã lô");

    const batch =
        await batchRepository.findById(
            maLo
        );

    if (!batch) {
        throw createError(
            "Không tìm thấy lô vaccine.",
            404
        );
    }

    const records =
        await traceRepository
            .traceByBatchId(maLo);


    return {
        batch: {
            maLo: batch.MaLo,
            maLoVaccine:
                batch.MaLoVaccine,
            maVaccine:
                batch.MaVaccine,
            tenVaccine:
                batch.TenVaccine,
            ngaySanXuat:
                batch.NgaySanXuat,
            hanSuDung:
                batch.HanSuDung,
            soLuongNhap:
                batch.SoLuongNhap,
            soLuongCon:
                batch.SoLuongCon,
            trangThai:
                batch.TrangThai
        },

        soMuiTiemDaSuDung:
            records.filter(
                item =>
                    item.MaMuiTiem != null
            ).length,

        vaccinations:
            records.filter(
                item =>
                    item.MaMuiTiem != null
            )
    };
};


// Theo mã lô
const traceBatchByCode = async (
    maLoVaccine
) => {
    maLoVaccine = text(maLoVaccine, "Mã lô vaccine", 50, true);

    if (!maLoVaccine) {
        throw createError(
            "Vui lòng nhập mã lô vaccine.",
            400
        );
    }

    const records =
        await traceRepository
            .traceByBatchCode(
                maLoVaccine
            );

    if (records.length === 0) {
        throw createError(
            "Không tìm thấy lô vaccine.",
            404
        );
    }

    const first = records[0];

    return {
        batch: {
            maLo: first.MaLo,
            maLoVaccine:
                first.MaLoVaccine,
            maVaccine:
                first.MaVaccine,
            tenVaccine:
                first.TenVaccine,
            ngaySanXuat:
                first.NgaySanXuat,
            hanSuDung:
                first.HanSuDung,
            soLuongNhap:
                first.SoLuongNhap,
            soLuongCon:
                first.SoLuongCon,
            trangThai:
                first.TrangThai
        },

        soMuiTiemDaSuDung:
            records.filter(
                item =>
                    item.MaMuiTiem != null
            ).length,

        vaccinations:
            records.filter(
                item =>
                    item.MaMuiTiem != null
            )
    };
};


// Từ mũi tiêm -> lô vaccine
const traceVaccination = async (
    maMuiTiem
) => {
    maMuiTiem = integer(maMuiTiem, "Mã mũi tiêm");

    const vaccination =
        await vaccinationRepository
            .findById(maMuiTiem);

    if (!vaccination) {
        throw createError(
            "Không tìm thấy mũi tiêm.",
            404
        );
    }

    return await traceRepository
        .traceByVaccinationId(
            maMuiTiem
        );
};


module.exports = {
    traceBatchById,
    traceBatchByCode,
    traceVaccination
};
