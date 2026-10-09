USE QuanLyCongTyDuLich;
-- TC-DB-01: Mỗi booking có tour đúng và thanh toán liên quan
SELECT p.MaPhieu,k.TenKH,t.TenTour,p.LoaiDangKy,p.SoNguoi,p.TongTien,p.TrangThai
FROM PhieuDangKy p JOIN Tour t ON p.MaTour=t.MaTour JOIN KhachHang k ON p.MaKH=k.MaKH ORDER BY p.MaPhieu;
-- TC-DB-02: Công nợ đoàn
SELECT * FROM v_CongNoDoan;
-- TC-DB-03: Không phân công trùng khung ngày (mỗi bản ghi kết quả là lỗi)
SELECT a1.MaNV,a1.MaPhieu AS Phieu1,a2.MaPhieu AS Phieu2 FROM PhanCong a1 JOIN PhanCong a2 ON a1.MaNV=a2.MaNV AND a1.MaPhanCong<a2.MaPhanCong JOIN PhieuDangKy p1 ON p1.MaPhieu=a1.MaPhieu JOIN Tour t1 ON t1.MaTour=p1.MaTour JOIN PhieuDangKy p2 ON p2.MaPhieu=a2.MaPhieu JOIN Tour t2 ON t2.MaTour=p2.MaTour WHERE p1.TrangThai<>'HUY' AND p2.TrangThai<>'HUY' AND p1.NgayDi<DATEADD(DAY,t2.SoNgay,p2.NgayDi) AND p2.NgayDi<DATEADD(DAY,t1.SoNgay,p1.NgayDi);
-- TC-DB-04: Tổng số khách không vượt số chỗ (mỗi dòng vượt là lỗi)
SELECT c.MaChuyen,c.SoCho,SUM(p.SoNguoi) DaDangKy FROM ChuyenDi c JOIN PhieuDangKy p ON p.MaChuyen=c.MaChuyen AND p.TrangThai<>'HUY' GROUP BY c.MaChuyen,c.SoCho HAVING SUM(p.SoNguoi)>c.SoCho;
-- TC-DB-05: Thông tin đoàn và bảo hiểm
SELECT p.MaPhieu,d.TenCoQuan,p.CoBaoHiem,COUNT(n.MaNguoi) AS SoNguoiTrongDS FROM PhieuDangKy p JOIN KhachDoan d ON p.MaPhieu=d.MaPhieu LEFT JOIN NguoiDuLich n ON p.MaPhieu=n.MaPhieu GROUP BY p.MaPhieu,d.TenCoQuan,p.CoBaoHiem;
