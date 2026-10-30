// Opt-in tests against a real SQL Server. Only uniquely named temporary databases
// are created/dropped. HTTP checks use the actual Express application and SQL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { sql, databaseConfig, validateDatabaseConfig } = require('../config/database');
const { executeFile } = require('../scripts/sql-files');
const sqlNumber = error => error.number ?? error.originalError?.info?.number;
const forbidden = error => sqlNumber(error) === 51002;
const conflict = error => [51000,51003,51004].includes(sqlNumber(error));

test('real SQL Server: additive migration, facility isolation, inventory concurrency and post-vaccination workflow', {
    skip: process.env.RUN_SQL_INTEGRATION !== '1', timeout: 300000,
}, async t => {
    validateDatabaseConfig();
    process.env.JWT_SECRET ||= 'isolated-integration-test-secret-not-for-production-123456';
    const suffix = randomBytes(6).toString('hex');
    const database = `VaccinationCommunity_Test_${suffix}`;
    const legacyDatabase = `VaccinationCommunity_Legacy_${suffix}`;
    const master = await new sql.ConnectionPool({ ...databaseConfig, database:'master', requestTimeout:120000 }).connect();
    const created = [];
    let pool, legacyPool, server;
    try {
        await t.test('upgrading legacy records preserves clinical snapshots and immutable history; rerunning is additive', async () => {
            await master.request().batch(`CREATE DATABASE [${legacyDatabase}];`); created.push(legacyDatabase);
            legacyPool = await new sql.ConnectionPool({ ...databaseConfig,database:legacyDatabase,requestTimeout:120000 }).connect();
            // 01 is the pre-facility schema: no new columns/defaults/functions yet.
            await executeFile(legacyPool,'01-schema.sql',{databaseName:legacyDatabase});
            await legacyPool.request().batch(`
                INSERT dbo.TAIKHOAN(TenDangNhap,MatKhau,Email,MaVaiTro)
                    SELECT 'legacy.fixture','not-a-login-hash','legacy@example.invalid',MaVaiTro FROM dbo.VAITRO WHERE TenVaiTro=N'Quản trị viên';
                DECLARE @Staff int=CONVERT(int,SCOPE_IDENTITY());
                INSERT dbo.NGUOIDAN(HoTen,DiaChi) VALUES(N'Hồ sơ chuyển đổi thử nghiệm',N'Địa chỉ lịch sử chưa xác minh');
                DECLARE @Citizen int=CONVERT(int,SCOPE_IDENTITY());
                INSERT dbo.VACCINE(TenVaccine) VALUES(N'Legacy fixture');
                DECLARE @Vaccine int=CONVERT(int,SCOPE_IDENTITY());
                INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,HanSuDung,SoLuongNhap,SoLuongCon)
                    VALUES('LEGACY-FIXTURE',@Vaccine,DATEADD(year,1,CAST(SYSUTCDATETIME() AS date)),10,9);
                DECLARE @Batch int=CONVERT(int,SCOPE_IDENTITY());
                INSERT dbo.MUITIEM(MaNguoiDan,MaVaccine,MaLo,MuiSo,CoSoTiem,MaNhanVien,GhiChu)
                    VALUES(@Citizen,@Vaccine,@Batch,1,N'Tên cơ sở lịch sử chưa xác minh',@Staff,N'Phải giữ nguyên khi nâng cấp');
                INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuMoi,MaTaiKhoan)
                    VALUES('MUITIEM',SCOPE_IDENTITY(),N'Fixture cũ',N'{"preserve":true}',@Staff);`);
            await legacyPool.request().batch(`CREATE TRIGGER dbo.trg_TestLegacyMedicalImmutable ON dbo.MUITIEM
                AFTER UPDATE,DELETE AS BEGIN THROW 51003,N'Không được sửa hồ sơ y tế lịch sử.',1; END;`);
            const snapshotQuery = `SELECT MaMuiTiem,MaNguoiDan,MaVaccine,MaLo,MuiSo,NgayTiem,CoSoTiem,MaNhanVien,GhiChu FROM dbo.MUITIEM;
                SELECT MaLichSu,TenBang,MaBanGhi,HanhDong,DuLieuMoi,MaTaiKhoan,NgayThucHien FROM dbo.LICHSUHIEUCHINH;`;
            const before = (await legacyPool.request().query(snapshotQuery)).recordsets;
            await executeFile(legacyPool,'VaccinationCommunity_HCM_Upgrade.sql',{databaseName:legacyDatabase});
            await executeFile(legacyPool,'VaccinationCommunity_HCM_Upgrade.sql',{databaseName:legacyDatabase});
            assert.deepEqual((await legacyPool.request().query(snapshotQuery)).recordsets,before);
            const mapped = (await legacyPool.request().query(`SELECT c.TrangThai,c.TenCoSo FROM dbo.MUITIEM m
                JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=m.MaCoSoTiem;`)).recordset[0];
            assert.equal(mapped.TrangThai,false); assert.match(mapped.TenCoSo,/đối soát/);
            assert.equal((await legacyPool.request().query(`SELECT is_disabled FROM sys.triggers WHERE name='trg_TestLegacyMedicalImmutable'`)).recordset[0].is_disabled,false);
            await assert.rejects(legacyPool.request().query('UPDATE dbo.MUITIEM SET GhiChu=GhiChu'), error => sqlNumber(error) === 51003);
            await legacyPool.close(); legacyPool = null;
        });
        await master.request().batch(`CREATE DATABASE [${database}];`); created.push(database);
        pool = await sql.connect({ ...databaseConfig,database,requestTimeout:120000 });
        await executeFile(pool,'VaccinationCommunity_Demo.sql',{databaseName:database});
        await pool.request().input('ConfirmDemo',sql.Bit,true).execute('dbo.usp_SeedDemo');
        await t.test('fresh demo is consistent; seed and upgrade can be rerun without duplicating records', async () => {
            const query = `SELECT COUNT(*) n FROM dbo.TAIKHOAN; SELECT COUNT(*) n FROM dbo.MUITIEM;
                SELECT COUNT(*) n FROM dbo.THEODOISAUTIEM; SELECT COUNT(*) n FROM dbo.COSOTIEM;
                SELECT COUNT(*) n FROM dbo.PHANCONG_COSOTIEM; SELECT COUNT(*) n FROM dbo.LOVACCINE;`;
            const before = (await pool.request().query(query)).recordsets.map(rows => rows[0].n);
            assert.deepEqual(before.slice(0,3),[213,300,90]);
            assert.equal(before[3],13); assert.equal(before[4],24); assert.equal(before[5],198);
            await executeFile(pool,'VaccinationCommunity_Demo.sql',{databaseName:database});
            await pool.request().input('ConfirmDemo',sql.Bit,true).execute('dbo.usp_SeedDemo');
            assert.deepEqual((await pool.request().query(query)).recordsets.map(rows => rows[0].n),before);
            const invalid = (await pool.request().query(`SELECT COUNT(*) n FROM dbo.LOVACCINE WHERE SoLuongCon<0 OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon;
                SELECT COUNT(*) n FROM dbo.MUITIEM m JOIN dbo.LOVACCINE l ON l.MaLo=m.MaLo WHERE m.MaCoSoTiem<>l.MaCoSoTiem;
                SELECT COUNT(*) n FROM dbo.LICHTIEM s JOIN dbo.LOVACCINE l ON l.MaLo=s.MaLoDuKien WHERE s.MaCoSoTiem<>l.MaCoSoTiem;`)).recordsets;
            assert.deepEqual(invalid.map(rows => rows[0].n),[0,0,0]);
        });
        const identities = (await pool.request().query(`SELECT t.MaTaiKhoan,t.TenDangNhap,n.MaNguoiDan
            FROM dbo.TAIKHOAN t LEFT JOIN dbo.NGUOIDAN n ON n.MaTaiKhoan=t.MaTaiKhoan
            WHERE t.TenDangNhap IN('nd101','nd102','nv01','nv02','admin.demo');`)).recordset;
        const citizens = identities.filter(row => row.MaNguoiDan);
        const staff = identities.find(row => row.TenDangNhap==='nv01');
        const otherStaff = identities.find(row => row.TenDangNhap==='nv02');
        const admin = identities.find(row => row.TenDangNhap==='admin.demo');
        const fixture = (await pool.request().input('StaffA',sql.Int,staff.MaTaiKhoan)
            .input('StaffB',sql.Int,otherStaff.MaTaiKhoan).input('Admin',sql.Int,admin.MaTaiKhoan).batch(`
            DECLARE @Area int=(SELECT TOP(1) MaKhuVuc FROM dbo.KHUVUCTIEM WHERE TrangThai=1 ORDER BY MaKhuVuc);
            INSERT dbo.COSOTIEM(MaKhuVuc,TenCoSo,DiaChi,PhuongXa) VALUES(@Area,N'Integration site A (demo)',N'Địa chỉ thử nghiệm A',N'Bến Thành');
            DECLARE @A int=CONVERT(int,SCOPE_IDENTITY());
            INSERT dbo.COSOTIEM(MaKhuVuc,TenCoSo,DiaChi,PhuongXa) VALUES(@Area,N'Integration site B (demo)',N'Địa chỉ thử nghiệm B',N'Thủ Đức');
            DECLARE @B int=CONVERT(int,SCOPE_IDENTITY());
            DELETE dbo.PHANCONG_COSOTIEM WHERE MaTaiKhoan IN(@StaffA,@StaffB);
            INSERT dbo.PHANCONG_COSOTIEM(MaTaiKhoan,MaCoSoTiem,MaNguoiPhanCong) VALUES(@StaffA,@A,@Admin),(@StaffB,@B,@Admin);
            INSERT dbo.VACCINE(TenVaccine,SoMuiKhuyenNghi,KhoangCachMui) VALUES(N'Integration fixture',5,0);
            DECLARE @V int=CONVERT(int,SCOPE_IDENTITY());
            INSERT dbo.COSOTIEM_VACCINE(MaCoSoTiem,MaVaccine) VALUES(@A,@V),(@B,@V);
            INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon,MaCoSoTiem)
                VALUES('TEST-LAST-DOSE',@V,DATEADD(day,-30,CAST(SYSUTCDATETIME() AS date)),DATEADD(day,365,CAST(SYSUTCDATETIME() AS date)),1,1,@A);
            DECLARE @BatchA int=CONVERT(int,SCOPE_IDENTITY());
            INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon,MaCoSoTiem)
                VALUES('TEST-FOREIGN-EARLIER',@V,DATEADD(day,-30,CAST(SYSUTCDATETIME() AS date)),DATEADD(day,180,CAST(SYSUTCDATETIME() AS date)),10,10,@B);
            SELECT @V AS vaccineId,@BatchA AS batchId,CONVERT(int,SCOPE_IDENTITY()) AS foreignBatchId,@A AS siteA,@B AS siteB;`)).recordset[0];
        const {vaccineId,batchId,foreignBatchId,siteA,siteB} = fixture;
        const booking = (citizen, site=siteA, extra={}) => {
            const req = pool.request().input('MaNguoiDan',sql.Int,citizen.MaNguoiDan).input('MaVaccine',sql.Int,vaccineId)
                .input('MuiSo',sql.Int,1).input('NgayDuKien',sql.DateTime2,new Date(Date.now()+86400000))
                .input('MaCoSoTiem',sql.Int,site).input('CoSoTiem',sql.NVarChar(255),'Untrusted text must be ignored');
            if (extra.actor) req.input('MaNhanVienTao',sql.Int,extra.actor);
            else req.input('MaTaiKhoanNguoiDan',sql.Int,citizen.MaTaiKhoan);
            if (extra.batch) req.input('MaLoDuKien',sql.Int,extra.batch);
            return req.execute('dbo.usp_LuuLichTiem');
        };
        const stock = async batch => (await pool.request().input('Id',sql.Int,batch)
            .query('SELECT SoLuongCon,SoLuongDatTruoc FROM dbo.LOVACCINE WHERE MaLo=@Id')).recordset[0];
        await t.test('HCM is enforced in SQL; cross-site actors, foreign stock and disabled offerings cannot book',async () => {
            await assert.rejects(pool.request().query(`INSERT dbo.KHUVUCTIEM(TenKhuVuc,TinhThanh) VALUES(N'Outside fixture',N'Hà Nội')`),error => sqlNumber(error)===547);
            await assert.rejects(booking(citizens[0],siteB,{actor:staff.MaTaiKhoan}),forbidden);
            await assert.rejects(booking(citizens[0],siteA,{batch:foreignBatchId}),conflict);
            await pool.request().input('Site',sql.Int,siteA).input('Vaccine',sql.Int,vaccineId)
                .query('UPDATE dbo.COSOTIEM_VACCINE SET TrangThai=0 WHERE MaCoSoTiem=@Site AND MaVaccine=@Vaccine');
            await assert.rejects(booking(citizens[0]),error => sqlNumber(error)===51003);
            await pool.request().input('Site',sql.Int,siteA).input('Vaccine',sql.Int,vaccineId)
                .query('UPDATE dbo.COSOTIEM_VACCINE SET TrangThai=1 WHERE MaCoSoTiem=@Site AND MaVaccine=@Vaccine');
            assert.deepEqual(await stock(batchId),{SoLuongCon:1,SoLuongDatTruoc:0});
            assert.deepEqual(await stock(foreignBatchId),{SoLuongCon:10,SoLuongDatTruoc:0});
        });
        let winner,loser,schedule,foreignSchedule;
        await t.test('two concurrent bookings reserve the final LOCAL dose only; FEFO never borrows another site',async () => {
            const results = await Promise.allSettled(citizens.map(c => booking(c)));
            assert.equal(results.filter(r => r.status==='fulfilled').length,1);
            assert.equal(sqlNumber(results.find(r => r.status==='rejected').reason),51004);
            winner = citizens[results.findIndex(r => r.status==='fulfilled')]; loser=citizens.find(c=>c!==winner);
            schedule=results.find(r=>r.status==='fulfilled').value.recordset[0];
            assert.equal(schedule.MaLoDuKien,batchId); assert.equal(schedule.MaCoSoTiem,siteA);
            assert.equal(schedule.CoSoTiem,'Integration site A (demo)');
            assert.deepEqual(await stock(batchId),{SoLuongCon:1,SoLuongDatTruoc:1});
            assert.deepEqual(await stock(foreignBatchId),{SoLuongCon:10,SoLuongDatTruoc:0});
            foreignSchedule=(await booking(loser,siteB)).recordset[0];
        });
        const changeStatus = (actor,status='Đã hủy',row=schedule) => pool.request().input('MaLichTiem',sql.Int,row.MaLichTiem)
            .input('TrangThai',sql.NVarChar(50),status).input('MaTaiKhoan',sql.Int,actor.MaTaiKhoan).execute('dbo.usp_DoiTrangThaiLichTiem');
        await t.test('another citizen or a foreign-site employee cannot cancel; only owner releases the reservation',async () => {
            await assert.rejects(changeStatus(loser),forbidden);
            await assert.rejects(changeStatus(otherStaff),forbidden);
            assert.deepEqual(await stock(batchId),{SoLuongCon:1,SoLuongDatTruoc:1});
            await changeStatus(winner);
            assert.deepEqual(await stock(batchId),{SoLuongCon:1,SoLuongDatTruoc:0});
        });
        const vaccinate = (actor=staff,site=siteA,batch=batchId) => pool.request()
            .input('MaNguoiDan',sql.Int,winner.MaNguoiDan).input('MaVaccine',sql.Int,vaccineId)
            .input('MaLo',sql.Int,batch).input('MuiSo',sql.Int,1).input('MaCoSoTiem',sql.Int,site)
            .input('MaNhanVien',sql.Int,actor.MaTaiKhoan).execute('dbo.usp_GhiNhanMuiTiem');
        let vaccinationId;
        await t.test('mixed-site batch or employee cannot administer; exact retry consumes stock just once',async () => {
            await assert.rejects(vaccinate(otherStaff),forbidden);
            await assert.rejects(vaccinate(staff,siteA,foreignBatchId),conflict);
            assert.deepEqual(await stock(batchId),{SoLuongCon:1,SoLuongDatTruoc:0});
            const [first,second]=await Promise.all([vaccinate(),vaccinate()]);
            vaccinationId=first.recordset[0].MaMuiTiem;
            assert.equal(second.recordset[0].MaMuiTiem,vaccinationId);
            assert.equal(first.recordset[0].MaCoSoTiem,siteA);
            assert.deepEqual(await stock(batchId),{SoLuongCon:0,SoLuongDatTruoc:0});
            assert.deepEqual(await stock(foreignBatchId),{SoLuongCon:10,SoLuongDatTruoc:1});
        });
        const app=require('../app');
        server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
        const base=`http://127.0.0.1:${server.address().port}/api`;
        const call=async(url,body,token,method='POST')=>{
            const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
                ...(body===undefined?{}:{body:JSON.stringify(body)})});
            return {status:response.status,body:await response.json()};
        };
        const login=async name=>{
            const result=await call('/auth/login',{tenDangNhap:name,matKhau:'Demo@123456'});
            assert.equal(result.status,200);assert.ok(result.body.token);return result.body.token;
        };
        const citizenToken=await login(winner.TenDangNhap),otherToken=await login(loser.TenDangNhap);
        const staffToken=await login('nv01'),foreignStaffToken=await login('nv02'),adminToken=await login('admin.demo');
        await t.test('actual HTTP lists and details are scoped, including citizen search, history and trace',async()=>{
            const schedules=await call('/schedules',undefined,staffToken,'GET');assert.equal(schedules.status,200);
            assert.ok(schedules.body.data.every(row=>row.MaCoSoTiem===siteA));
            assert.equal((await call(`/schedules/${foreignSchedule.MaLichTiem}`,undefined,staffToken,'GET')).status,404);
            const patients=await call('/citizens',undefined,staffToken,'GET');assert.equal(patients.status,200);
            assert.ok(patients.body.data.some(row=>row.MaNguoiDan===winner.MaNguoiDan));
            assert.ok(!patients.body.data.some(row=>row.MaNguoiDan===loser.MaNguoiDan));
            assert.equal((await call(`/citizens/${loser.MaNguoiDan}`,undefined,staffToken,'GET')).status,404);
            assert.equal((await call(`/vaccinations/${vaccinationId}`,undefined,foreignStaffToken,'GET')).status,404);
            assert.equal((await call(`/trace/vaccination/${vaccinationId}`,undefined,foreignStaffToken,'GET')).status,404);
            assert.equal((await call(`/trace/batch/${foreignBatchId}`,undefined,staffToken,'GET')).status,404);
            assert.equal((await call('/trace/batch-code/TEST-FOREIGN-EARLIER',undefined,staffToken,'GET')).status,404);
            assert.equal((await call(`/history/citizen/${loser.MaNguoiDan}`,undefined,staffToken,'GET')).status,404);
            assert.equal((await call(`/history/detail/${vaccinationId}`,undefined,foreignStaffToken,'GET')).status,404);
            const scopedHistory=await call(`/history/citizen/${winner.MaNguoiDan}`,undefined,staffToken,'GET');
            assert.equal(scopedHistory.status,200); assert.equal(scopedHistory.body.data.length,1);
            assert.equal(scopedHistory.body.data[0].MaCoSoTiem,siteA);
            const ownHistory=await call('/history/me',undefined,citizenToken,'GET');
            assert.equal(ownHistory.status,200); assert.ok(ownHistory.body.data.length>=2);
            const batches=await call('/batches',undefined,staffToken,'GET');assert.equal(batches.status,200);
            assert.ok(batches.body.data.every(row=>row.MaCoSoTiem===siteA));
            assert.equal((await call(`/batches/${foreignBatchId}`,undefined,staffToken,'GET')).status,404);
            const injected=await call('/schedules/me',{maVaccine:vaccineId,muiSo:2,ngayDuKien:new Date(Date.now()+86400000).toISOString(),maCoSoTiem:siteB,coSoTiem:'Địa chỉ tự nhập'},otherToken);
            assert.equal(injected.status,400);
            const deniedCity=await call('/facilities/areas',{tenKhuVuc:'Ngoài phạm vi',tinhThanh:'Hà Nội'},adminToken);
            assert.equal(deniedCity.status,400);
            const choices=await call(`/facilities?maVaccine=${vaccineId}`,undefined,citizenToken,'GET');assert.equal(choices.status,200);
            assert.ok(!choices.body.data.some(row=>row.MaCoSoTiem===siteA));
            assert.ok(choices.body.data.some(row=>row.MaCoSoTiem===siteB));
        });
        await t.test('admin manages HCM areas/facilities; offerings require assignment and inventory before public selection',async()=>{
            const area=await call('/facilities/areas',{tenKhuVuc:'Khu vực thử nghiệm nội bộ',trangThai:true},adminToken);
            assert.equal(area.status,201);assert.equal(area.body.data.TinhThanh,'Thành phố Hồ Chí Minh');
            const facilityBody={maKhuVuc:area.body.data.MaKhuVuc,tenCoSo:'Cơ sở tích hợp mới (demo)',diaChi:'Địa chỉ mô phỏng',
                phuongXa:'Bến Thành',soDienThoai:'0900000999',trangThai:true,ghiChu:'Dữ liệu thử nghiệm, không phải cơ sở thực.'};
            assert.equal((await call('/facilities',facilityBody,staffToken)).status,403);
            const facility=await call('/facilities',facilityBody,adminToken);assert.equal(facility.status,201);
            const site=facility.body.data.MaCoSoTiem;assert.equal(facility.body.data.TinhThanh,'Thành phố Hồ Chí Minh');
            assert.equal((await call(`/facilities/${site}`,{...facilityBody,soDienThoai:'0900000998'},adminToken,'PUT')).status,200);
            assert.equal((await call(`/facilities/${siteB}/vaccines/${vaccineId}`,{trangThai:false},staffToken,'PUT')).status,403);
            assert.equal((await call(`/facilities/${siteB}/vaccines/${vaccineId}`,{trangThai:false},foreignStaffToken,'PUT')).status,409);
            assert.equal((await call(`/facilities/${site}/vaccines/${vaccineId}`,{trangThai:true},adminToken,'PUT')).status,200);
            assert.equal((await call(`/facilities/${site}/vaccines`,undefined,staffToken,'GET')).status,403);
            const selectable=await call(`/facilities?maVaccine=${vaccineId}`,undefined,citizenToken,'GET');
            assert.equal(selectable.status,200);assert.ok(!selectable.body.data.some(row=>row.MaCoSoTiem===site));
            assert.equal((await call(`/facilities/${siteB}`,{
                maKhuVuc:(await pool.request().input('Id',sql.Int,siteB).query('SELECT MaKhuVuc FROM dbo.COSOTIEM WHERE MaCoSoTiem=@Id')).recordset[0].MaKhuVuc,
                tenCoSo:'Integration site B (demo)',diaChi:'Địa chỉ thử nghiệm B',phuongXa:'Thủ Đức',trangThai:false,
            },adminToken,'PUT')).status,409);
        });
        let reportId;
        await t.test('HTTP follow-up derives red priority, rejects foreign ownership/site and detects concurrent stale revisions',async()=>{
            const symptom=(await pool.request().query('SELECT TOP(1) MaTrieuChung FROM dbo.DANHMUCTRIEUCHUNG WHERE LaDauHieuCanhBao=1 AND DangHoatDong=1')).recordset[0].MaTrieuChung;
            assert.equal((await call('/followups/mine',{vaccinationId,symptoms:[symptom],severity:'none'},citizenToken)).status,400);
            const submitted=await call('/followups/mine',{vaccinationId,symptoms:[symptom],description:'Tình huống thử nghiệm phần mềm, không phải hồ sơ thật.'},citizenToken);
            assert.equal(submitted.status,201);assert.equal(submitted.body.data.severity,'emergency');assert.equal(submitted.body.data.status,'escalated');
            assert.match(submitted.body.data.advice.message,/115/);reportId=submitted.body.data.id;
            assert.equal((await call(`/followups/${reportId}`,undefined,otherToken,'GET')).status,404);
            assert.equal((await call(`/followups/${reportId}`,undefined,foreignStaffToken,'GET')).status,404);
            const foreignQueue=await call('/followups',undefined,foreignStaffToken,'GET');assert.equal(foreignQueue.status,200);
            assert.equal(foreignQueue.body.data.total,0);assert.deepEqual(foreignQueue.body.data.items,[]);
            const review={status:'monitoring',staffAdvice:'Đã liên hệ và xử lý theo quy trình thử nghiệm.',expectedRevision:1,nextFollowupAt:new Date(Date.now()+86400000).toISOString()};
            assert.equal((await call(`/followups/${reportId}/review`,review,foreignStaffToken,'PATCH')).status,404);
            assert.equal((await call(`/followups/${reportId}/review`,review,staffToken,'PATCH')).status,200);
            assert.equal((await call(`/followups/${reportId}/review`,review,staffToken,'PATCH')).status,409);
            const rows=(await pool.request().input('Id',sql.Int,reportId).query('SELECT LanCapNhat FROM dbo.THEODOISAUTIEM WHERE MaTheoDoi=@Id; SELECT COUNT(*) n FROM dbo.THEODOI_LICHSU WHERE MaTheoDoi=@Id;')).recordsets;
            assert.equal(rows[0][0].LanCapNhat,2);assert.equal(rows[1][0].n,2);
            await assert.rejects(pool.request().input('Id',sql.Int,reportId).query('DELETE dbo.THEODOI_LICHSU WHERE MaTheoDoi=@Id'));
        });
        await t.test('admin multi-facility assignments take effect immediately; revoked scope also blocks direct SQL review',async()=>{
            const assign=await call(`/facilities/assignments/${staff.MaTaiKhoan}`,{maCoSoTiemIds:[siteA,siteB]},adminToken,'PUT');
            assert.equal(assign.status,200);
            const all=await call('/schedules',undefined,staffToken,'GET');assert.ok(all.body.data.some(row=>row.MaCoSoTiem===siteB));
            const revoke=await call(`/facilities/assignments/${staff.MaTaiKhoan}`,{maCoSoTiemIds:[siteB]},adminToken,'PUT');assert.equal(revoke.status,200);
            assert.equal((await call(`/vaccinations/${vaccinationId}`,undefined,staffToken,'GET')).status,404);
            await assert.rejects(pool.request().input('MaTaiKhoan',sql.Int,staff.MaTaiKhoan).input('MaTheoDoi',sql.Int,reportId)
                .input('TrangThai',sql.VarChar(16),'resolved').input('HuongXuLy',sql.NVarChar(2000),'Denied revoked assignment')
                .input('LanCapNhatMongDoi',sql.Int,2).execute('dbo.usp_XuLyTheoDoi'),forbidden);
            assert.equal((await call(`/facilities/assignments/${staff.MaTaiKhoan}`,{maCoSoTiemIds:[siteA]},adminToken,'PUT')).status,200);
            assert.equal((await call(`/facilities/assignments/${staff.MaTaiKhoan}`,{maCoSoTiemIds:[siteA]},staffToken,'PUT')).status,403);
        });
        await t.test('reminders are idempotent and medical/audit records remain immutable',async()=>{
            await pool.request().input('DaysAhead',sql.Int,3).execute('dbo.usp_TaoNhacLich');
            assert.equal((await pool.request().input('DaysAhead',sql.Int,3).execute('dbo.usp_TaoNhacLich')).recordset[0].created,0);
            await assert.rejects(pool.request().input('Id',sql.Int,vaccinationId).query('DELETE dbo.MUITIEM WHERE MaMuiTiem=@Id'));
            await assert.rejects(pool.request().query('DELETE TOP(1) dbo.LICHSUHIEUCHINH'));
            assert.deepEqual(await stock(batchId),{SoLuongCon:0,SoLuongDatTruoc:0});
        });
    } finally {
        if(server) await new Promise(resolve=>server.close(resolve));
        if(legacyPool) await legacyPool.close();
        if(pool) await sql.close();
        for(const name of created.reverse()) await master.request().batch(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}];`);
        await master.close();
    }
});
