const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const load = (file,mocks) => {
    const filename=path.join(__dirname,'..',file), unit=new Module(filename,module);
    unit.filename=filename;unit.paths=Module._nodeModulePaths(path.dirname(filename));
    const actualRequire=Module.createRequire(filename);
    unit.require=name=>Object.hasOwn(mocks,name)?mocks[name]:actualRequire(name);
    unit._compile(fs.readFileSync(filename,'utf8'),filename);return unit.exports;
};
const error=statusCode=>Object.assign(new Error('Không thuộc phạm vi được giao'),{statusCode});
const future=()=>new Date(Date.now()+86400000).toISOString();
const past=()=>new Date(Date.now()-60000).toISOString();
const citizen={MaNguoiDan:12,MaTaiKhoan:4,TrangThai:true};
const staff=8;
function setup(overrides={}) {
    const calls=[],denied=overrides.denied || {};
    const scope={
        async assertFacility(actor,facility) {calls.push(['facility',actor,facility]);if(denied.facility)throw error(403);return{MaCoSoTiem:facility};},
        async assertCitizen(actor,id) {calls.push(['citizen',actor,id]);if(denied.citizen)throw error(404);return citizen;},
    };
    const current={MaLichTiem:5,MaNguoiDan:12,MaVaccine:3,MaCoSoTiem:2,MaLoDuKien:41,
        MuiSo:1,NgayDuKien:future(),TrangThai:'Đã xác nhận'};
    const schedules={findAvailableFacility:async(...args)=>{calls.push(['available',...args]);return overrides.unavailable?null:{MaCoSoTiem:2};},
        findById:async(...args)=>{calls.push(['readSchedule',...args]);return overrides.hidden?null:current;},
        create:async(...args)=>{calls.push(['createSchedule',...args]);return{MaLichTiem:5};},
        createByCitizen:async(...args)=>{calls.push(['createOwn',...args]);return{MaLichTiem:5};},
        update:async(...args)=>{calls.push(['updateSchedule',...args]);return current;},
        updateStatus:async(...args)=>{calls.push(['statusSchedule',...args]);return current;}};
    const schedule=load('services/scheduleService.js',{
        '../repositories/scheduleRepository':schedules,
        '../repositories/citizenRepository':{findByAccountId:async()=>citizen,findById:async()=>citizen},
        '../repositories/vaccineRepository':{findById:async()=>({MaVaccine:3,TrangThai:true})},
        '../utils/facilityScope':scope,
    });
    const vaccination=load('services/vaccinationService.js',{
        '../repositories/vaccinationRepository':{
            findById:async(...args)=>{calls.push(['readDose',...args]);return overrides.hidden?null:{MaMuiTiem:50};},
            create:async(...args)=>{calls.push(['createDose',...args]);return{MaMuiTiem:50};},
        },'../utils/facilityScope':scope,
    });
    const batchRow={MaLo:41,MaCoSoTiem:2,MaVaccine:3,MaLoVaccine:'SITE-2-LOT',SoLuongNhap:100,SoLuongCon:100,
        NgaySanXuat:new Date('2020-01-01'),HanSuDung:new Date('2099-12-31'),TrangThai:'Đang sử dụng'};
    const batch=load('services/batchService.js',{
        '../repositories/batchRepository':{
            findById:async(...args)=>{calls.push(['readBatch',...args]);return overrides.hidden?null:batchRow;},
            findByCode:async()=>null,
            create:async(...args)=>{calls.push(['createBatch',...args]);return batchRow;},
            update:async(...args)=>{calls.push(['updateBatch',...args]);return batchRow;},
        },'../repositories/vaccineRepository':{findById:async()=>({MaVaccine:3,TrangThai:true})},
        '../utils/facilityScope':scope,
    });
    return{schedule,vaccination,batch,calls};
}
const scheduleInput=()=>({maNguoiDan:12,maVaccine:3,maCoSoTiem:2,muiSo:1,ngayDuKien:future()});
const doseInput=()=>({maNguoiDan:12,maVaccine:3,maCoSoTiem:2,maLo:41,muiSo:1,ngayTiem:past()});

test('staff cannot create a schedule or dose in a facility outside their assignment',async()=>{
    const {schedule,vaccination,calls}=setup({denied:{facility:true}});
    await assert.rejects(schedule.createSchedule(scheduleInput(),staff),{statusCode:403});
    await assert.rejects(vaccination.createVaccination(doseInput(),staff),{statusCode:403});
    assert.equal(calls.filter(c=>c[0].startsWith('create')).length,0);
});
test('a selected assigned facility does not grant access to an arbitrary citizen',async()=>{
    const {schedule,vaccination,calls}=setup({denied:{citizen:true}});
    await assert.rejects(schedule.createSchedule(scheduleInput(),staff),{statusCode:404});
    await assert.rejects(vaccination.createVaccination(doseInput(),staff),{statusCode:404});
    assert.equal(calls.filter(c=>c[0].startsWith('create')).length,0);
});
test('unscoped detail identifiers cannot be used to update schedules or retrieve doses/batches',async()=>{
    const {schedule,vaccination,batch,calls}=setup({hidden:true});
    await assert.rejects(schedule.updateSchedule(5,{ghiChu:'forged'},staff),{statusCode:404});
    await assert.rejects(schedule.changeStatus(5,'Đã xác nhận',staff),{statusCode:404});
    await assert.rejects(vaccination.getVaccinationById(50,staff),{statusCode:404});
    await assert.rejects(batch.getBatchById(41,staff),{statusCode:404});
    assert.deepEqual(calls.filter(c=>c[0].startsWith('read')).map(c=>c.slice(1)),[[5,staff],[5,staff],[50,staff],[41,staff]]);
    assert.equal(calls.some(c=>c[0].startsWith('update') || c[0].startsWith('status')),false);
});
test('a facility must be selected by id; free-text facility snapshots are rejected',async()=>{
    const {schedule,vaccination,batch,calls}=setup();
    for(const input of [{...scheduleInput(),coSoTiem:'Cơ sở bất kỳ'}, {...scheduleInput(),maCoSoTiem:undefined}])
        await assert.rejects(schedule.createMySchedule(4,input),{statusCode:400});
    await assert.rejects(vaccination.createVaccination({...doseInput(),coSoTiem:'Hà Nội'},staff),{statusCode:400});
    await assert.rejects(batch.updateBatch(41,{coSoTiem:'Địa chỉ tự nhập'},staff),{statusCode:400});
    assert.equal(calls.filter(c=>c[0].startsWith('create') || c[0].startsWith('update')).length,0);
});
test('citizen booking cannot use an inactive, unsupported or unavailable facility',async()=>{
    const {schedule,calls}=setup({unavailable:true});
    await assert.rejects(schedule.createMySchedule(4,scheduleInput()),{statusCode:409});
    assert.equal(calls.some(c=>c[0]==='createOwn'),false);
});
test('citizen booking passes the own profile and authenticated actor to the atomic procedure',async()=>{
    const {schedule,calls}=setup();
    await schedule.createMySchedule(4,{...scheduleInput(),maNguoiDan:999,trangThai:'Đã tiêm'});
    const saved=calls.find(c=>c[0]==='createOwn');
    assert.equal(saved[1],12);assert.equal(saved[2].maNguoiDan,12);assert.equal(saved[2].trangThai,'Đã lên lịch');
    assert.equal(saved[2].maCoSoTiem,2);assert.equal(saved[3],4);
    assert.equal(calls.some(c=>c[0]==='facility' || c[0]==='citizen'),false);
});
test('moving an active schedule selects new FEFO stock rather than retaining a batch from the previous facility',async()=>{
    const {schedule,calls}=setup();
    await schedule.updateSchedule(5,{maCoSoTiem:3},staff);
    const saved=calls.find(c=>c[0]==='updateSchedule');
    assert.equal(saved[2].maCoSoTiem,3);assert.equal(saved[2].maLoDuKien,null);assert.equal(saved[3],staff);
});
test('an imported batch cannot be reassigned to another facility through metadata edit',async()=>{
    const {batch,calls}=setup();
    await assert.rejects(batch.updateBatch(41,{maCoSoTiem:3},staff),{statusCode:409});
    assert.equal(calls.some(c=>c[0]==='updateBatch'),false);
});
test('staff operations never silently use a missing actor',async()=>{
    const {schedule,vaccination,batch,calls}=setup();
    await assert.rejects(schedule.createSchedule(scheduleInput()),{statusCode:400});
    await assert.rejects(vaccination.getVaccinationById(50),{statusCode:400});
    await assert.rejects(batch.getBatchById(41),{statusCode:400});
    assert.equal(calls.length,0);
});

test('batch expiry uses the Vietnam calendar day after midnight in TP.HCM',async(t)=>{
    t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-30T18:00:00Z')});
    const {batch,calls}=setup();
    await assert.rejects(batch.createBatch({maLoVaccine:'MIDNIGHT-LOT',maVaccine:3,maCoSoTiem:2,
        ngaySanXuat:'2026-10-01',hanSuDung:'2026-10-30',soLuongNhap:10},staff),{statusCode:400});
    assert.equal(calls.some(c=>c[0]==='createBatch'),false);
    // Manufacture date is a calendar date: today's Vietnam date is not tomorrow.
    await batch.createBatch({maLoVaccine:'TODAY-LOT',maVaccine:3,maCoSoTiem:2,
        ngaySanXuat:'2026-10-31',hanSuDung:'2026-11-01',soLuongNhap:10},staff);
    assert.equal(calls.some(c=>c[0]==='createBatch'),true);
});
