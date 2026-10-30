USE [VaccinationCommunity_Demo];
GO
SET NOCOUNT ON;
SELECT N'TAIKHOAN' AS Entity,COUNT_BIG(*) AS Records FROM dbo.TAIKHOAN
UNION ALL SELECT N'NGUOIDAN',COUNT_BIG(*) FROM dbo.NGUOIDAN
UNION ALL SELECT N'VACCINE',COUNT_BIG(*) FROM dbo.VACCINE
UNION ALL SELECT N'LOVACCINE',COUNT_BIG(*) FROM dbo.LOVACCINE
UNION ALL SELECT N'LICHTIEM',COUNT_BIG(*) FROM dbo.LICHTIEM
UNION ALL SELECT N'MUITIEM',COUNT_BIG(*) FROM dbo.MUITIEM
UNION ALL SELECT N'CHONGCHIDINH',COUNT_BIG(*) FROM dbo.CHONGCHIDINH
UNION ALL SELECT N'THONGBAO',COUNT_BIG(*) FROM dbo.THONGBAO
UNION ALL SELECT N'THEODOISAUTIEM',COUNT_BIG(*) FROM dbo.THEODOISAUTIEM
UNION ALL SELECT N'THEODOI_TRIEUCHUNG',COUNT_BIG(*) FROM dbo.THEODOI_TRIEUCHUNG
UNION ALL SELECT N'THEODOI_LICHSU',COUNT_BIG(*) FROM dbo.THEODOI_LICHSU
UNION ALL SELECT N'KHUVUCTIEM',COUNT_BIG(*) FROM dbo.KHUVUCTIEM
UNION ALL SELECT N'COSOTIEM',COUNT_BIG(*) FROM dbo.COSOTIEM
UNION ALL SELECT N'PHANCONG_COSOTIEM',COUNT_BIG(*) FROM dbo.PHANCONG_COSOTIEM
UNION ALL SELECT N'COSOTIEM_VACCINE',COUNT_BIG(*) FROM dbo.COSOTIEM_VACCINE;
SELECT TrangThai,COUNT(*) AS SoLich FROM dbo.LICHTIEM GROUP BY TrangThai;
SELECT MucDo,TrangThai,COUNT(*) AS SoBaoCao FROM dbo.THEODOISAUTIEM GROUP BY MucDo,TrangThai ORDER BY MucDo,TrangThai;
/* The following anomaly checks must all return zero rows. */
SELECT N'Reservation mismatch' AS Problem,b.MaLo,b.SoLuongDatTruoc,COUNT(l.MaLichTiem) AS ActualReservations
FROM dbo.LOVACCINE b LEFT JOIN dbo.LICHTIEM l ON l.MaLoDuKien=b.MaLo AND l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận')
GROUP BY b.MaLo,b.SoLuongDatTruoc HAVING b.SoLuongDatTruoc<>COUNT(l.MaLichTiem);
SELECT N'Invalid inventory' AS Problem,* FROM dbo.LOVACCINE
WHERE SoLuongCon<0 OR SoLuongCon>SoLuongNhap OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon;
SELECT N'Invalid dose/batch relationship' AS Problem,m.MaMuiTiem FROM dbo.MUITIEM m JOIN dbo.LOVACCINE b ON b.MaLo=m.MaLo WHERE m.MaVaccine<>b.MaVaccine OR m.MaCoSoTiem<>b.MaCoSoTiem;
SELECT N'Invalid follow-up ownership' AS Problem,d.MaTheoDoi FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem WHERE d.MaNguoiDan<>m.MaNguoiDan;
SELECT N'Duplicate dose' AS Problem,MaNguoiDan,MaVaccine,MuiSo,COUNT(*) AS n FROM dbo.MUITIEM GROUP BY MaNguoiDan,MaVaccine,MuiSo HAVING COUNT(*)>1;
SELECT N'Duplicate active appointment' AS Problem,MaNguoiDan,MaVaccine,COUNT(*) AS n FROM dbo.LICHTIEM WHERE TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') GROUP BY MaNguoiDan,MaVaccine HAVING COUNT(*)>1;
SELECT N'Revision missing audit' AS Problem,d.MaTheoDoi,d.LanCapNhat FROM dbo.THEODOISAUTIEM d
WHERE NOT EXISTS(SELECT 1 FROM dbo.THEODOI_LICHSU h WHERE h.MaTheoDoi=d.MaTheoDoi AND h.LanCapNhat=d.LanCapNhat);
/* Only demo batches have known opening balances. These should match exactly. */
SELECT N'Demo stock ledger mismatch' AS Problem,b.MaLo,b.SoLuongNhap,b.SoLuongCon,COUNT(m.MaMuiTiem) AS Administrations
FROM dbo.LOVACCINE b LEFT JOIN dbo.MUITIEM m ON m.MaLo=b.MaLo WHERE b.MaLoVaccine LIKE 'DEMO-%'
GROUP BY b.MaLo,b.SoLuongNhap,b.SoLuongCon HAVING b.SoLuongNhap-b.SoLuongCon<>COUNT(m.MaMuiTiem);
SELECT N'Appointment/batch facility mismatch' AS Problem,l.MaLichTiem FROM dbo.LICHTIEM l JOIN dbo.LOVACCINE b ON b.MaLo=l.MaLoDuKien WHERE l.MaCoSoTiem<>b.MaCoSoTiem;
SELECT N'Dose/appointment facility mismatch' AS Problem,m.MaMuiTiem FROM dbo.MUITIEM m JOIN dbo.LICHTIEM l ON l.MaLichTiem=m.MaLichTiem WHERE m.MaCoSoTiem<>l.MaCoSoTiem;
SELECT N'Non-HCM facility' AS Problem,c.MaCoSoTiem FROM dbo.COSOTIEM c WHERE c.TinhThanh<>N'Thành phố Hồ Chí Minh';
SELECT N'Non-HCM area' AS Problem,k.MaKhuVuc FROM dbo.KHUVUCTIEM k WHERE k.TinhThanh<>N'Thành phố Hồ Chí Minh';
/* Legacy free text was not verified by migration: an inactive holding facility
   is intentional, not an anomaly. Admin reviews it before enabling bookings. */
SELECT c.MaCoSoTiem,c.TenCoSo,c.TrangThai,COUNT_BIG(m.MaMuiTiem) AS MuiLichSuCanDoiSoat
FROM dbo.COSOTIEM c LEFT JOIN dbo.MUITIEM m ON m.MaCoSoTiem=c.MaCoSoTiem
WHERE c.TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát' GROUP BY c.MaCoSoTiem,c.TenCoSo,c.TrangThai;
SELECT * FROM dbo.vw_CoSoTiemTongQuan ORDER BY MaCoSoTiem;
SELECT name,type_desc FROM sys.objects WHERE schema_id=SCHEMA_ID(N'dbo') AND type IN('P','V','TR','FN') ORDER BY type,name;
GO
