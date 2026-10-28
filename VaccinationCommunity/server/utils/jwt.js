const jwt = require('jsonwebtoken');
const { createHmac, timingSafeEqual } = require('node:crypto');

const signingSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) {
        throw Object.assign(new Error('JWT_SECRET phải có ít nhất 32 ký tự.'), { statusCode: 500 });
    }
    return secret;
};
const credentialVersion = (user) => createHmac('sha256', signingSecret())
    .update(String(user.MatKhau || ''))
    .digest('base64url');
const matchesCredentialVersion = (claim, user) => {
    if (typeof claim !== 'string') return false;
    const expected = Buffer.from(credentialVersion(user));
    const actual = Buffer.from(claim);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
};
const generateToken = (user) => jwt.sign({
    maTaiKhoan: user.MaTaiKhoan,
    tenDangNhap: user.TenDangNhap,
    maVaiTro: user.MaVaiTro,
    tenVaiTro: user.TenVaiTro,
    credentialVersion: credentialVersion(user)
}, signingSecret(), {
    algorithm: 'HS256',
    subject: String(user.MaTaiKhoan),
    issuer: 'vaccination-community',
    audience: 'vaccination-community-web',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
});
const verifyToken = (token) => jwt.verify(token, signingSecret(), {
    algorithms: ['HS256'],
    issuer: 'vaccination-community',
    audience: 'vaccination-community-web'
});
module.exports = { generateToken, verifyToken, matchesCredentialVersion };
