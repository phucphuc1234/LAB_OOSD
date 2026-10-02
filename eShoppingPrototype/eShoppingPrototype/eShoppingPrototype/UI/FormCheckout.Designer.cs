namespace eShoppingPrototype.UI
{
    partial class FormCheckout
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblMaKH = new System.Windows.Forms.Label();
            this.txtMaKH = new System.Windows.Forms.TextBox();
            this.lblNguoiNhanHoTen = new System.Windows.Forms.Label();
            this.txtNguoiNhanHoTen = new System.Windows.Forms.TextBox();
            this.lblNguoiNhanDiaChi = new System.Windows.Forms.Label();
            this.txtNguoiNhanDiaChi = new System.Windows.Forms.TextBox();
            this.lblNguoiNhanDienThoai = new System.Windows.Forms.Label();
            this.txtNguoiNhanDienThoai = new System.Windows.Forms.TextBox();
            this.lblSoThe = new System.Windows.Forms.Label();
            this.txtSoThe = new System.Windows.Forms.TextBox();
            this.lblHinhThucGiaoHang = new System.Windows.Forms.Label();
            this.cboHinhThucGiaoHang = new System.Windows.Forms.ComboBox();
            this.dgvCart = new System.Windows.Forms.DataGridView();
            this.btnDatHang = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.dgvCart)).BeginInit();
            this.SuspendLayout();

            // lblTitle
            this.lblTitle.AutoSize = true;
            this.lblTitle.Font = new System.Drawing.Font("Microsoft Sans Serif", 14F, System.Drawing.FontStyle.Bold);
            this.lblTitle.Location = new System.Drawing.Point(20, 15);
            this.lblTitle.Name = "lblTitle";
            this.lblTitle.Size = new System.Drawing.Size(260, 24);
            this.lblTitle.Text = "ĐẶT HÀNG & THANH TOÁN";

            // lblMaKH
            this.lblMaKH.Location = new System.Drawing.Point(20, 60);
            this.lblMaKH.Text = "Mã Khách Hàng:";
            this.txtMaKH.Location = new System.Drawing.Point(140, 57);
            this.txtMaKH.Size = new System.Drawing.Size(200, 20);
            this.txtMaKH.Text = "KH01";

            // NguoiNhanHoTen
            this.lblNguoiNhanHoTen.Location = new System.Drawing.Point(20, 95);
            this.lblNguoiNhanHoTen.Text = "Họ Tên Người Nhận:";
            this.txtNguoiNhanHoTen.Location = new System.Drawing.Point(140, 92);
            this.txtNguoiNhanHoTen.Size = new System.Drawing.Size(200, 20);
            this.txtNguoiNhanHoTen.Text = "Nguyễn Văn An";

            // NguoiNhanDiaChi
            this.lblNguoiNhanDiaChi.Location = new System.Drawing.Point(20, 130);
            this.lblNguoiNhanDiaChi.Text = "Địa Chỉ Giao Hàng:";
            this.txtNguoiNhanDiaChi.Location = new System.Drawing.Point(140, 127);
            this.txtNguoiNhanDiaChi.Size = new System.Drawing.Size(200, 20);
            this.txtNguoiNhanDiaChi.Text = "123 Lê Lợi, Quận 1, TP.HCM";

            // NguoiNhanDienThoai
            this.lblNguoiNhanDienThoai.Location = new System.Drawing.Point(20, 165);
            this.lblNguoiNhanDienThoai.Text = "Số Điện Thoại:";
            this.txtNguoiNhanDienThoai.Location = new System.Drawing.Point(140, 162);
            this.txtNguoiNhanDienThoai.Size = new System.Drawing.Size(200, 20);
            this.txtNguoiNhanDienThoai.Text = "0901234567";

            // SoThe
            this.lblSoThe.Location = new System.Drawing.Point(20, 200);
            this.lblSoThe.Text = "Số Thẻ Tín Dụng:";
            this.txtSoThe.Location = new System.Drawing.Point(140, 197);
            this.txtSoThe.Size = new System.Drawing.Size(200, 20);
            this.txtSoThe.Text = "4111222233334444";

            // HinhThucGiaoHang
            this.lblHinhThucGiaoHang.Location = new System.Drawing.Point(20, 235);
            this.lblHinhThucGiaoHang.Text = "Hình Thức Giao:";
            this.cboHinhThucGiaoHang.Location = new System.Drawing.Point(140, 232);
            this.cboHinhThucGiaoHang.Size = new System.Drawing.Size(200, 21);

            // dgvCart
            this.dgvCart.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dgvCart.Location = new System.Drawing.Point(360, 57);
            this.dgvCart.Name = "dgvCart";
            this.dgvCart.Size = new System.Drawing.Size(400, 196);

            // btnDatHang
            this.btnDatHang.Font = new System.Drawing.Font("Microsoft Sans Serif", 10F, System.Drawing.FontStyle.Bold);
            this.btnDatHang.Location = new System.Drawing.Point(140, 275);
            this.btnDatHang.Name = "btnDatHang";
            this.btnDatHang.Size = new System.Drawing.Size(200, 40);
            this.btnDatHang.Text = "XÁC NHẬN ĐẶT HÀNG";
            this.btnDatHang.UseVisualStyleBackColor = true;
            this.btnDatHang.Click += new System.EventHandler(this.btnDatHang_Click);

            // FormCheckout
            this.ClientSize = new System.Drawing.Size(780, 335);
            this.Controls.Add(this.lblTitle);
            this.Controls.Add(this.lblMaKH);
            this.Controls.Add(this.txtMaKH);
            this.Controls.Add(this.lblNguoiNhanHoTen);
            this.Controls.Add(this.txtNguoiNhanHoTen);
            this.Controls.Add(this.lblNguoiNhanDiaChi);
            this.Controls.Add(this.txtNguoiNhanDiaChi);
            this.Controls.Add(this.lblNguoiNhanDienThoai);
            this.Controls.Add(this.txtNguoiNhanDienThoai);
            this.Controls.Add(this.lblSoThe);
            this.Controls.Add(this.txtSoThe);
            this.Controls.Add(this.lblHinhThucGiaoHang);
            this.Controls.Add(this.cboHinhThucGiaoHang);
            this.Controls.Add(this.dgvCart);
            this.Controls.Add(this.btnDatHang);
            this.Name = "FormCheckout";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "e-Shopping - Đặt Hàng";
            ((System.ComponentModel.ISupportInitialize)(this.dgvCart)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        #endregion

        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblMaKH;
        private System.Windows.Forms.TextBox txtMaKH;
        private System.Windows.Forms.Label lblNguoiNhanHoTen;
        private System.Windows.Forms.TextBox txtNguoiNhanHoTen;
        private System.Windows.Forms.Label lblNguoiNhanDiaChi;
        private System.Windows.Forms.TextBox txtNguoiNhanDiaChi;
        private System.Windows.Forms.Label lblNguoiNhanDienThoai;
        private System.Windows.Forms.TextBox txtNguoiNhanDienThoai;
        private System.Windows.Forms.Label lblSoThe;
        private System.Windows.Forms.TextBox txtSoThe;
        private System.Windows.Forms.Label lblHinhThucGiaoHang;
        private System.Windows.Forms.ComboBox cboHinhThucGiaoHang;
        private System.Windows.Forms.DataGridView dgvCart;
        private System.Windows.Forms.Button btnDatHang;
    }
}
