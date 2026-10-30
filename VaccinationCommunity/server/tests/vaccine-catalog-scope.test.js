const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
function load(file,mocks) {
    const filename=path.join(__dirname,'..',file),unit=new Module(filename,module),actual=Module.createRequire(filename);
    unit.filename=filename;unit.paths=Module._nodeModulePaths(path.dirname(filename));
    unit.require=name=>Object.hasOwn(mocks,name)?mocks[name]:actual(name);
    unit._compile(fs.readFileSync(filename,'utf8'),filename);return unit.exports;
}
const payload={tenVaccine:'Vaccine mới',loaiVaccine:'Vaccine',nhaSanXuat:'Demo',moTa:'Mô tả',soMuiKhuyenNghi:2,khoangCachMui:28};
function setup(overrides={}) {
    const state={row:{MaVaccine:3,TenVaccine:'Vaccine hiện tại',LoaiVaccine:'Vaccine',NhaSanXuat:'Demo',MoTa:'Mô tả',
        SoMuiKhuyenNghi:2,KhoangCachMui:28,TrangThai:true},role:'Quản trị viên',actorActive:true,appointments:0,
        audit:[],writes:0,queries:[],...overrides};
    class Transaction {
        async begin(level) {state.level=level;this.snapshot=structuredClone({row:state.row,audit:state.audit});state.onBegin?.();}
        async commit() {state.committed=true;}
        async rollback() {state.rolledBack=true;Object.assign(state,this.snapshot);}
    }
    class Request {
        constructor(transaction) {this.transaction=transaction;this.parameters={};}
        input(name,_type,value) {this.parameters[name]=value;return this;}
        async query(query) {
            const p=this.parameters;state.queries.push({query,params:{...p},transactional:!!this.transaction});
            if(query.includes('sp_getapplock')) return{recordset:[]};
            if(query.includes('JOIN dbo.VAITRO r WITH(HOLDLOCK)')) {
                if(state.role!=='Quản trị viên' || !state.actorActive) throw Object.assign(new Error('admin required'),{number:51002});
                return{recordset:[]};
            }
            if(query.includes('FROM dbo.VACCINE WITH(UPDLOCK,HOLDLOCK)')) return{recordset:state.row?[structuredClone(state.row)]:[]};
            if(query.includes('FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK)')) {
                if(state.appointments) throw Object.assign(new Error('active appointments'),{number:51003});
                return{recordset:[]};
            }
            if(query.includes('INSERT dbo.LICHSUHIEUCHINH')) {
                if(state.failAudit) throw state.failAudit;
                state.audit.push({id:p.Id,actor:p.ActorId,before:p.Before?JSON.parse(p.Before):null,after:JSON.parse(p.After)});
                return{recordset:[]};
            }
            if(query.includes('INSERT dbo.VACCINE')) {
                state.writes++;state.row={MaVaccine:4,TenVaccine:p.TenVaccine,LoaiVaccine:p.LoaiVaccine,NhaSanXuat:p.NhaSanXuat,
                    MoTa:p.MoTa,SoMuiKhuyenNghi:p.SoMuiKhuyenNghi,KhoangCachMui:p.KhoangCachMui,TrangThai:true};
                return{recordset:[structuredClone(state.row)]};
            }
            if(query.includes('UPDATE dbo.VACCINE SET TrangThai')) {
                state.writes++;state.row.TrangThai=p.TrangThai;return{recordset:[structuredClone(state.row)]};
            }
            if(query.includes('UPDATE dbo.VACCINE SET TenVaccine')) {
                state.writes++;Object.assign(state.row,{TenVaccine:p.TenVaccine,LoaiVaccine:p.LoaiVaccine,NhaSanXuat:p.NhaSanXuat,
                    MoTa:p.MoTa,SoMuiKhuyenNghi:p.SoMuiKhuyenNghi,KhoangCachMui:p.KhoangCachMui});
                return{recordset:[structuredClone(state.row)]};
            }
            if(query.includes('WHERE TenVaccine = @TenVaccine')) return{recordset:state.row?.TenVaccine===p.TenVaccine?[{MaVaccine:3,TenVaccine:p.TenVaccine}]:[]};
            if(query.includes('WHERE MaVaccine = @MaVaccine')) return{recordset:state.row?[structuredClone(state.row)]:[]};
            throw new Error('Unexpected catalog query');
        }
    }
    const sql={connect:async()=>({request:()=>new Request()}),Transaction,Request,ISOLATION_LEVEL:{SERIALIZABLE:'serializable'},
        Int:'int',Bit:'bit',MAX:'max',NVarChar:n=>n};
    const repository=load('repositories/vaccineRepository.js',{'../config/database':{sql}});
    const service=load('services/vaccineService.js',{'../repositories/vaccineRepository':repository});
    return{state,repository,service};
}

test('staff and inactive admins cannot modify the shared catalog even when middleware previously allowed a request',async()=>{
    for(const overrides of [{role:'Nhân viên'},{actorActive:false}]) {
        for(const operation of [s=>s.createVaccine(payload,8),s=>s.updateVaccine(3,payload,8),s=>s.changeStatus(3,false,8)]) {
            const{service,state}=setup(overrides);
            await assert.rejects(operation(service),e=>e.number===51002);
            assert.equal(state.writes,0);assert.equal(state.audit.length,0);assert.equal(state.committed,undefined);
            assert.equal(state.rolledBack,true);assert.equal(state.level,'serializable');
        }
    }
});
test('a role revoked after the service read but before the write transaction cannot retain catalog rights',async()=>{
    const{service,state}=setup();state.onBegin=()=>{state.role='Người dân';};
    await assert.rejects(service.updateVaccine(3,payload,8),e=>e.number===51002);
    assert.equal(state.writes,0);assert.equal(state.audit.length,0);
});
test('global vaccine deactivation is blocked while any site has an active appointment',async()=>{
    const{service,state}=setup({appointments:2});
    await assert.rejects(service.changeStatus(3,false,8),e=>e.number===51003);
    assert.equal(state.row.TrangThai,true);assert.equal(state.writes,0);assert.equal(state.audit.length,0);
});
test('valid catalog mutations save the actor and before/after audit in the same transaction',async()=>{
    for(const operation of [s=>s.createVaccine(payload,8),s=>s.updateVaccine(3,payload,8),s=>s.changeStatus(3,false,8)]) {
        const{service,state}=setup();await operation(service);
        assert.equal(state.writes,1);assert.equal(state.committed,true);assert.equal(state.audit.length,1);
        assert.equal(state.audit[0].actor,8);assert.equal(state.audit[0].after.MaVaccine,state.row.MaVaccine);
        assert.equal(JSON.stringify(state.audit).includes('MatKhau'),false);
        assert.equal(state.queries.filter(q=>q.transactional).every(q=>q.params.ActorId===8),true);
    }
});
test('a failed audit rolls back a catalog change and returns the original failure',async()=>{
    const failure=new Error('audit unavailable'),{service,state}=setup({failAudit:failure});
    await assert.rejects(service.changeStatus(3,false,8),e=>e===failure);
    assert.equal(state.row.TrangThai,true);assert.equal(state.audit.length,0);assert.equal(state.rolledBack,true);
    assert.equal(state.committed,undefined);
});
test('catalog writes reject a missing actor and preserve unique-name and status validation',async()=>{
    const{service,state}=setup();
    await assert.rejects(service.createVaccine(payload),{statusCode:400});
    await assert.rejects(service.updateVaccine(3,payload),{statusCode:400});
    await assert.rejects(service.changeStatus(3,false),{statusCode:400});
    await assert.rejects(service.createVaccine({...payload,tenVaccine:state.row.TenVaccine},8),{statusCode:409});
    await assert.rejects(service.changeStatus(3,'false',8),{statusCode:400});
    assert.equal(state.writes,0);assert.equal(state.audit.length,0);
});
