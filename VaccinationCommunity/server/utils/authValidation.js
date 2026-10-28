const error = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const object = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw error('Dữ liệu gửi lên không hợp lệ.');
    return value;
};
const text = (value, label, max, optional = false) => {
    if (value === undefined || value === null || value === '') {
        if (optional) return null;
        throw error(`Vui lòng nhập ${label}.`);
    }
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
        throw error(`${label} không hợp lệ (tối đa ${max} ký tự).`);
    }
    return value.trim();
};
const id = (value, label = 'Mã') => {
    if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647) throw error(`${label} không hợp lệ.`);
    return Number(value);
};
const email = (value) => {
    const result = text(value, 'email', 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) || /[^\x21-\x7E]/.test(result)) throw error('Email không hợp lệ.');
    return result;
};
const phone = (value) => {
    const result = text(value, 'số điện thoại', 20).replace(/[\s().-]/g, '');
    if (!/^\+?\d{9,15}$/.test(result)) throw error('Số điện thoại cần có 9–15 chữ số.');
    return result;
};
const password = (value, label = 'Mật khẩu', requireStrength = true) => {
    if (typeof value !== 'string' || (requireStrength ? value.length < 8 : value.length < 1) || Buffer.byteLength(value, 'utf8') > 72 || /\x00/.test(value)) {
        throw error(`${label} cần ${requireStrength ? 'ít nhất 8 ký tự và ' : ''}không quá 72 byte.`);
    }
    return value;
};
const birthDate = (value) => {
    const result = text(value, 'ngày sinh', 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw error('Ngày sinh phải theo định dạng YYYY-MM-DD.');
    const date = new Date(`${result}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== result || result < '1900-01-01' || result > new Date().toISOString().slice(0, 10)) throw error('Ngày sinh không hợp lệ hoặc nằm trong tương lai.');
    return result;
};
const roles = Object.freeze(['Người dân', 'Nhân viên', 'Quản trị viên']);
const publicAccount = (user) => ({
    maTaiKhoan: user.MaTaiKhoan,
    tenDangNhap: user.TenDangNhap,
    email: user.Email,
    soDienThoai: user.SoDienThoai,
    maVaiTro: user.MaVaiTro,
    tenVaiTro: user.TenVaiTro
});
const respondError = (res, failure) => {
    let status = failure.statusCode || 500;
    let message = status < 500 ? failure.message : 'Có lỗi hệ thống. Vui lòng thử lại.';
    const procedureStatuses = { 51000: 400, 51001: 404, 51002: 403, 51003: 409, 51004: 409 };
    if (procedureStatuses[failure.number]) {
        status = procedureStatuses[failure.number];
        message = failure.message;
    } else if ([2601, 2627, 547].includes(failure.number)) {
        status = 409;
        message = 'Dữ liệu đã tồn tại hoặc đang được sử dụng. Vui lòng kiểm tra lại.';
    } else if ([245, 2628, 8152].includes(failure.number)) {
        status = 400;
        message = 'Dữ liệu không đúng định dạng hoặc vượt quá độ dài cho phép.';
    } else if (failure.number === 1205) {
        status = 409;
        message = 'Dữ liệu đang được cập nhật. Vui lòng thử lại.';
    }
    return res.status(status).json({ success: false, message });
};
module.exports = { error, object, text, id, email, phone, password, birthDate, roles, publicAccount, respondError };
