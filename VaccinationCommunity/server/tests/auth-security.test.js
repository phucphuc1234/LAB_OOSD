const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('node:path');
process.env.JWT_SECRET = 'unit-test-signing-key-only-at-least-32-characters';
const base = path.join(__dirname, '..');
const stub = (relative, exports) => {
    const filename = require.resolve(path.join(base, relative));
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
const authRepo = {};
const userRepo = {};
const citizenRepo = {};
stub('repositories/authRepository.js', authRepo);
stub('repositories/userRepository.js', userRepo);
stub('repositories/citizenRepository.js', citizenRepo);
const authService = require('../services/authService');
const userService = require('../services/userService');
const citizenService = require('../services/citizenService');
const authenticate = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const tokens = require('../utils/jwt');
const v = require('../utils/authValidation');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const account = { MaTaiKhoan: 3, TenDangNhap: 'admin', Email: 'admin@example.test', SoDienThoai: '0900000000',
    MaVaiTro: 3, TenVaiTro: 'Quản trị viên', TrangThai: true, VaiTroHoatDong: true, MatKhau: 'bcrypt-hash-not-a-plaintext-password' };
const validRegistration = { tenDangNhap: 'citizen.new', matKhau: 'StrongPass123', email: 'NEW@Example.test',
    soDienThoai: '0901234567', hoTen: 'Nguyễn An', ngaySinh: '2000-02-29', gioiTinh: 'Nam', cccd: '012345678901' };

test('public registration discards account/role injection and hashes the password', async () => {
    authRepo.findByUsername = authRepo.findByEmail = authRepo.findByCCCD = async () => null;
    let received;
    authRepo.createCitizenAccount = async (data) => { received = data; return { maTaiKhoan: 20, maNguoiDan: 15 }; };
    const result = await authService.register({ ...validRegistration, maVaiTro: 3, tenVaiTro: 'Quản trị viên', maTaiKhoan: 1 });
    assert.equal(result.maTaiKhoan, 20);
    assert.equal(received.maVaiTro, undefined);
    assert.equal(received.tenVaiTro, undefined);
    assert.equal(received.maTaiKhoan, undefined);
    assert.equal(received.email, 'new@example.test');
    assert.equal(await bcrypt.compare(validRegistration.matKhau, received.matKhau), true);
    assert.notEqual(received.matKhau, validRegistration.matKhau);
});

test('registration rejects malformed date, ID, gender, password length and data types before querying DB', async () => {
    authRepo.findByUsername = async () => { throw new Error('must not query DB for invalid input'); };
    for (const change of [{ ngaySinh: '2001-02-29' }, { ngaySinh: '2999-01-01' }, { cccd: 'abc' },
        { gioiTinh: 'administrator' }, { matKhau: 'short' }, { matKhau: 'á'.repeat(37) }, { email: {} }, { tenDangNhap: [] }]) {
        await assert.rejects(authService.register({ ...validRegistration, ...change }), { statusCode: 400 });
    }
});

test('racing duplicate registration is a conflict even after preliminary uniqueness checks pass', async () => {
    authRepo.findByUsername = authRepo.findByEmail = authRepo.findByCCCD = async () => null;
    authRepo.createCitizenAccount = async () => { throw Object.assign(new Error('SQL detail must not be shown'), { number: 2627 }); };
    await assert.rejects(authService.register(validRegistration), { statusCode: 409 });
});

test('login checks bcrypt and returns only public account data', async () => {
    const hash = await bcrypt.hash('StrongPass123', 4);
    authRepo.findByUsername = async () => ({ ...account, MatKhau: hash });
    authRepo.updateLastLogin = async (id) => assert.equal(id, account.MaTaiKhoan);
    await assert.rejects(authService.login('admin', 'wrong'), { statusCode: 401 });
    const result = await authService.login('admin', 'StrongPass123');
    assert.equal(result.user.tenVaiTro, 'Quản trị viên');
    assert.equal(result.user.MatKhau, undefined);
    const payload = tokens.verifyToken(result.token);
    assert.equal(payload.sub, '3');
    assert.equal(JSON.stringify(payload).includes(hash), false);
    assert.equal(JSON.stringify(payload).includes('StrongPass123'), false);
    assert.equal(payload.MatKhau, undefined);
});

test('middleware uses current DB role, not the administrative role from an older JWT', async () => {
    const token = tokens.generateToken(account);
    authRepo.findAuthenticatedAccount = async () => ({ ...account, MaVaiTro: 1, TenVaiTro: 'Người dân' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response(); let called = false;
    await authenticate(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.user.tenVaiTro, 'Người dân');
    assert.equal(req.user.MatKhau, undefined);
    authorizeRoles('Quản trị viên')(req, res, () => assert.fail('stale admin privilege must not pass'));
    assert.equal(res.statusCode, 403);
});

test('middleware rejects locked account/role, missing account and rotated password', async () => {
    const token = tokens.generateToken(account);
    for (const [state, expected] of [[{ ...account, TrangThai: false }, 403], [{ ...account, VaiTroHoatDong: false }, 403],
        [null, 401], [{ ...account, MatKhau: 'new-password-hash' }, 401]]) {
        authRepo.findAuthenticatedAccount = async () => state;
        const res = response();
        await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail('must be rejected'));
        assert.equal(res.statusCode, expected);
    }
});

test('middleware distinguishes a DB outage from invalid credentials and rejects unsupported JWT algorithms', async () => {
    authRepo.findAuthenticatedAccount = async () => { throw new Error('database unavailable'); };
    const res = response();
    await authenticate({ headers: { authorization: `Bearer ${tokens.generateToken(account)}` } }, res, () => assert.fail());
    assert.equal(res.statusCode, 503);
    assert.doesNotMatch(res.body.message, /database unavailable/);
    const invalidAlgorithm = jwt.sign({ maTaiKhoan: 3 }, process.env.JWT_SECRET, { algorithm: 'HS384' });
    assert.throws(() => tokens.verifyToken(invalidAlgorithm));
});

test('password rotation verifies current bcrypt password and supplies optimistic concurrency guard', async () => {
    const hash = await bcrypt.hash('OldPassword123', 4);
    authRepo.findAccountById = async () => ({ ...account, MatKhau: hash });
    let updated;
    authRepo.updatePassword = async (...args) => { updated = args; };
    await assert.rejects(authService.changePassword(3, 'incorrect', 'NewPassword123'), { statusCode: 400 });
    await authService.changePassword(3, 'OldPassword123', 'NewPassword123');
    assert.equal(updated[0], 3);
    assert.equal(updated[2], hash);
    assert.equal(await bcrypt.compare('NewPassword123', updated[1]), true);
});

test('account mutation rejects malformed IDs, self lock, self demotion and unknown role names', async () => {
    userRepo.findById = async () => account;
    userRepo.findRoleById = async () => ({ MaVaiTro: 2, TenVaiTro: 'Nhân viên' });
    userRepo.updateRole = userRepo.updateStatus = async () => assert.fail('invalid mutation reached repository');
    await assert.rejects(userService.getUserById('3 OR 1=1'), { statusCode: 400 });
    await assert.rejects(userService.changeStatus(3, false, 3), { statusCode: 400 });
    await assert.rejects(userService.changeRole(3, 2, 3), { statusCode: 400 });
    await assert.rejects(userService.changeStatus(3, 'false', 4), { statusCode: 400 });
    userRepo.findRoleById = async () => ({ MaVaiTro: 9, TenVaiTro: 'Superuser' });
    await assert.rejects(userService.changeRole(3, 9, 4), { statusCode: 404 });
});

test('self profile mutation uses authenticated account and only allows contact/address fields', async () => {
    citizenRepo.findByAccountId = async (id) => ({ MaTaiKhoan: id, MaNguoiDan: 30 });
    let received;
    citizenRepo.updateOwnProfile = async (id, data) => { received = { id, data }; return data; };
    await citizenService.updateMyProfile(12, { maTaiKhoan: 1, maNguoiDan: 1, trangThai: false, hoTen: 'forged',
        email: 'NEW@example.test', diaChi: '' });
    assert.deepEqual(received, { id: 12, data: { email: 'new@example.test', diaChi: '' } });
    await assert.rejects(citizenService.updateMyProfile(12, { maTaiKhoan: 1 }), { statusCode: 400 });
});

test('unexpected server errors do not expose SQL or credentials to clients', () => {
    const res = response();
    v.respondError(res, new Error('SELECT MatKhau FROM TAIKHOAN password=secret'));
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body.message, /SELECT|MatKhau|secret/);
});
