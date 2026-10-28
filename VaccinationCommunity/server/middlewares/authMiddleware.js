const { verifyToken, matchesCredentialVersion } = require('../utils/jwt');
const authRepository = require('../repositories/authRepository');
const { roles } = require('../utils/authValidation');

const authenticate = async (req, res, next) => {
    const match = typeof req.headers.authorization === 'string' && req.headers.authorization.match(/^Bearer ([^\s]+)$/);
    if (!match || match[1].length > 8192) {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập.' });
    }
    let decoded;
    try {
        decoded = verifyToken(match[1]);
        if (!Number.isSafeInteger(decoded.maTaiKhoan) || decoded.maTaiKhoan < 1 || decoded.sub !== String(decoded.maTaiKhoan)) throw new Error('Invalid account');
    } catch (failure) {
        if (failure.statusCode === 500) return res.status(503).json({ success: false, message: 'Dịch vụ đăng nhập chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    try {
        const account = await authRepository.findAuthenticatedAccount(decoded.maTaiKhoan);
        if (!account) return res.status(401).json({ success: false, message: 'Tài khoản không còn tồn tại. Vui lòng đăng nhập lại.' });
        if (!account.TrangThai || !account.VaiTroHoatDong || !roles.includes(account.TenVaiTro)) {
            return res.status(403).json({ success: false, message: 'Tài khoản hoặc vai trò đã bị khóa.' });
        }
        if (!matchesCredentialVersion(decoded.credentialVersion, account)) {
            return res.status(401).json({ success: false, message: 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.' });
        }
        req.user = {
            maTaiKhoan: account.MaTaiKhoan,
            tenDangNhap: account.TenDangNhap,
            maVaiTro: account.MaVaiTro,
            tenVaiTro: account.TenVaiTro
        };
        return next();
    } catch (_) {
        return res.status(503).json({ success: false, message: 'Chưa xác thực được tài khoản. Vui lòng thử lại.' });
    }
};
module.exports = authenticate;
