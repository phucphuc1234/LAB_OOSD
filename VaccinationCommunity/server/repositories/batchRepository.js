const { sql } = require("../config/database");


// Lấy toàn bộ lô vaccine
const findAll = async () => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .query(`
            SELECT
                lv.MaLo,
                lv.MaLoVaccine,
                lv.MaVaccine,
                v.TenVaccine,
                lv.NgaySanXuat,
                lv.HanSuDung,
                lv.SoLuongNhap,
                lv.SoLuongCon,
                lv.SoLuongDatTruoc,
                lv.NgayNhap,
                lv.TrangThai,
                lv.GhiChu
            FROM LOVACCINE lv
            INNER JOIN VACCINE v
                ON lv.MaVaccine = v.MaVaccine
            ORDER BY lv.MaLo DESC
        `);

    return result.recordset;
};


// Tìm lô theo ID
const findById = async (maLo) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input("MaLo", sql.Int, maLo)
        .query(`
            SELECT
                lv.MaLo,
                lv.MaLoVaccine,
                lv.MaVaccine,
                v.TenVaccine,
                lv.NgaySanXuat,
                lv.HanSuDung,
                lv.SoLuongNhap,
                lv.SoLuongCon,
                lv.SoLuongDatTruoc,
                lv.NgayNhap,
                lv.TrangThai,
                lv.GhiChu
            FROM LOVACCINE lv
            INNER JOIN VACCINE v
                ON lv.MaVaccine = v.MaVaccine
            WHERE lv.MaLo = @MaLo
        `);

    return result.recordset[0] || null;
};


// Tìm theo mã lô
const findByCode = async (maLoVaccine) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaLoVaccine",
            sql.VarChar(50),
            maLoVaccine
        )
        .query(`
            SELECT
                MaLo,
                MaLoVaccine,
                MaVaccine
            FROM LOVACCINE
            WHERE MaLoVaccine = @MaLoVaccine
        `);

    return result.recordset[0] || null;
};


// Thêm lô vaccine
const create = async (data) => {
    const pool = await sql.connect();

    const result = await pool
        .request()

        .input(
            "MaLoVaccine",
            sql.VarChar(50),
            data.maLoVaccine
        )

        .input(
            "MaVaccine",
            sql.Int,
            data.maVaccine
        )

        .input(
            "NgaySanXuat",
            sql.Date,
            data.ngaySanXuat
                ? new Date(data.ngaySanXuat)
                : null
        )

        .input(
            "HanSuDung",
            sql.Date,
            new Date(data.hanSuDung)
        )

        .input(
            "SoLuongNhap",
            sql.Int,
            data.soLuongNhap
        )

        .input(
            "SoLuongCon",
            sql.Int,
            data.soLuongCon
        )

        .input(
            "TrangThai",
            sql.NVarChar(50),
            data.trangThai || "Đang sử dụng"
        )

        .input(
            "GhiChu",
            sql.NVarChar(255),
            data.ghiChu || null
        )

        .query(`
            INSERT INTO LOVACCINE
            (
                MaLoVaccine,
                MaVaccine,
                NgaySanXuat,
                HanSuDung,
                SoLuongNhap,
                SoLuongCon,
                TrangThai,
                GhiChu
            )

            VALUES
            (
                @MaLoVaccine,
                @MaVaccine,
                @NgaySanXuat,
                @HanSuDung,
                @SoLuongNhap,
                @SoLuongCon,
                @TrangThai,
                @GhiChu
            )
        ; SELECT * FROM LOVACCINE WHERE MaLo=CONVERT(int,SCOPE_IDENTITY());
        `);

    return result.recordset[0];
};


// Inventory edits use the same lock order as booking/cancellation/vaccination.
const edit = async (id, data, statusOnly = false) => {
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        await new sql.Request(transaction).query(`
            DECLARE @LockResult int;
            EXEC @LockResult = sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',
                @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=10000;
            IF @LockResult < 0 THROW 51003, N'Dữ liệu kho đang được xử lý. Vui lòng thử lại.', 1;
        `);
        const old = (await new sql.Request(transaction).input("Id", sql.Int, id)
            .query("SELECT * FROM LOVACCINE WITH (UPDLOCK,HOLDLOCK) WHERE MaLo=@Id")).recordset[0];
        if (!old) { const e = new Error("Không tìm thấy lô vaccine."); e.statusCode=404; throw e; }
        const status = data.trangThai ?? old.TrangThai;
        const conflict = message => { const e = new Error(message); e.statusCode=409; throw e; };
        if (!statusOnly && (data.soLuongNhap !== old.SoLuongNhap || data.soLuongCon !== old.SoLuongCon)) {
            conflict("Không được chỉnh số lượng nhập/còn của lô đã tạo; hãy tải lại dữ liệu hoặc tạo lô mới để nhập bổ sung.");
        }
        if (old.SoLuongDatTruoc > 0 && status !== "Đang sử dụng") {
            conflict("Lô đang được giữ cho lịch tiêm. Vui lòng dời hoặc hủy các lịch liên quan trước.");
        }
        const expiry = new Date(data.hanSuDung ?? old.HanSuDung);
        if (status === "Đang sử dụng" && (old.SoLuongCon <= 0 || expiry.toISOString().slice(0,10) < new Date().toISOString().slice(0,10))) {
            conflict("Không thể sử dụng lô đã hết hàng hoặc hết hạn.");
        }
        if (status === "Hết hàng" && old.SoLuongCon !== 0) conflict("Lô vẫn còn vaccine, không thể đánh dấu hết hàng.");
        if (status === "Hết hạn" && expiry.toISOString().slice(0,10) >= new Date().toISOString().slice(0,10)) conflict("Lô chưa hết hạn sử dụng.");
        if (!statusOnly) {
            const reserved = (await new sql.Request(transaction).input("Id",sql.Int,id)
                .query("SELECT MAX(NgayDuKien) AS LastAppointment FROM LICHTIEM WHERE MaLoDuKien=@Id AND TrangThai IN (N'Đã lên lịch',N'Đã xác nhận')")).recordset[0]?.LastAppointment;
            if (reserved && expiry.toISOString().slice(0,10) < new Date(reserved).toISOString().slice(0,10)) conflict("Hạn sử dụng phải bao phủ các lịch tiêm đã đặt trước.");
        }
        const request = new sql.Request(transaction).input("Id",sql.Int,id).input("TrangThai",sql.NVarChar(50),status);
        if (statusOnly) {
            await request.query("UPDATE LOVACCINE SET TrangThai=@TrangThai WHERE MaLo=@Id;");
        } else {
            await request.input("NgaySanXuat",sql.Date,data.ngaySanXuat).input("HanSuDung",sql.Date,expiry)
                .input("GhiChu",sql.NVarChar(255),data.ghiChu).query(`
                    UPDATE LOVACCINE SET NgaySanXuat=@NgaySanXuat,HanSuDung=@HanSuDung,
                        GhiChu=@GhiChu,TrangThai=@TrangThai WHERE MaLo=@Id;`);
        }
        const result = await new sql.Request(transaction).input("Id",sql.Int,id).query("SELECT * FROM LOVACCINE WHERE MaLo=@Id");
        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        try { await transaction.rollback(); } catch (_) { /* keep original error */ }
        throw error;
    }
};
const update = (id,data) => edit(id,data);
const updateStatus = (id,status) => edit(id,{trangThai:status},true);
module.exports = { findAll, findById, findByCode, create, update, updateStatus };
