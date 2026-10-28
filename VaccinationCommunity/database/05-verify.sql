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
UNION ALL SELECT N'THEODOI_LICHSU',COUNT_BIG(*) FROM dbo.THEODOI_LICHSU;
SELECT TrangThai,COUNT(*) AS SoLich FROM dbo.LICHTIEM GROUP BY TrangThai;
SELECT MucDo,TrangThai,COUNT(*) AS SoBaoCao FROM dbo.THEODOISAUTIEM GROUP BY MucDo,TrangThai ORDER BY MucDo,TrangThai;
/* The following anomaly checks must all return zero rows. */
SELECT N'Reservation mismatch' AS Problem,b.MaLo,b.SoLuongDatTruoc,COUNT(l.MaLichTiem) AS ActualReservations
FROM dbo.LOVACCINE b LEFT JOIN dbo.LICHTIEM l ON l.MaLoDuKien=b.MaLo AND l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận')
GROUP BY b.MaLo,b.SoLuongDatTruoc HAVING b.SoLuongDatTruoc<>COUNT(l.MaLichTiem);
SELECT N'Invalid inventory' AS Problem,* FROM dbo.LOVACCINE
WHERE SoLuongCon<0 OR SoLuongCon>SoLuongNhap OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon;
SELECT N'Invalid dose/batch relationship' AS Problem,m.MaMuiTiem FROM dbo.MUITIEM m JOIN dbo.LOVACCINE b ON b.MaLo=m.MaLo WHERE m.MaVaccine<>b.MaVaccine;
SELECT N'Invalid follow-up ownership' AS Problem,d.MaTheoDoi FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem WHERE d.MaNguoiDan<>m.MaNguoiDan;
SELECT N'Duplicate dose' AS Problem,MaNguoiDan,MaVaccine,MuiSo,COUNT(*) AS n FROM dbo.MUITIEM GROUP BY MaNguoiDan,MaVaccine,MuiSo HAVING COUNT(*)>1;
SELECT N'Duplicate active appointment' AS Problem,MaNguoiDan,MaVaccine,COUNT(*) AS n FROM dbo.LICHTIEM WHERE TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') GROUP BY MaNguoiDan,MaVaccine HAVING COUNT(*)>1;
SELECT N'Revision missing audit' AS Problem,d.MaTheoDoi,d.LanCapNhat FROM dbo.THEODOISAUTIEM d
WHERE NOT EXISTS(SELECT 1 FROM dbo.THEODOI_LICHSU h WHERE h.MaTheoDoi=d.MaTheoDoi AND h.LanCapNhat=d.LanCapNhat);
/* Only demo batches have known opening balances. These should match exactly. */
SELECT N'Demo stock ledger mismatch' AS Problem,b.MaLo,b.SoLuongNhap,b.SoLuongCon,COUNT(m.MaMuiTiem) AS Administrations
FROM dbo.LOVACCINE b LEFT JOIN dbo.MUITIEM m ON m.MaLo=b.MaLo WHERE b.MaLoVaccine LIKE 'DEMO-%'
GROUP BY b.MaLo,b.SoLuongNhap,b.SoLuongCon HAVING b.SoLuongNhap-b.SoLuongCon<>COUNT(m.MaMuiTiem);
SELECT name,type_desc FROM sys.objects WHERE schema_id=SCHEMA_ID(N'dbo') AND type IN('P','V','TR') ORDER BY type,name;
GO
