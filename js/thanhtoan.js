var ttCurrentUser;
var ttCurrentTransferOrderId = null;

window.onload = function () {
    khoiTao();

    // autocomplete cho khung tim kiem
    if (document.getElementById('search-box')) {
        autocomplete(document.getElementById('search-box'), list_products);
    }

    // thêm tags (từ khóa) vào khung tìm kiếm
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    for (var t of tags) addTags(t, "index.html?search=" + t);

    ttCurrentUser = getCurrentUser();
    renderOrderSummary(ttCurrentUser);
};

function renderOrderSummary(user) {
    var table = document.getElementsByClassName('tt-table')[0];
    if (!table) return;

    var s = `
        <tbody>
            <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
            </tr>`;

    if (!user) {
        s += `
            <tr>
                <td colspan="4">
                    <h3 style="color:red; text-align:center; padding: 12px 0;">
                        Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục thanh toán.
                    </h3>
                </td>
            </tr>`;
        table.innerHTML = s;
        return;
    }

    if (!user.products || !user.products.length) {
        s += `
            <tr>
                <td colspan="4">
                    <h3 style="color:green; text-align:center; padding: 12px 0;">
                        Giỏ hàng trống. Vui lòng quay lại trang giỏ hàng.
                    </h3>
                </td>
            </tr>`;
        table.innerHTML = s;
        return;
    }

    var totalPrice = 0;
    for (var i = 0; i < user.products.length; i++) {
        var masp = user.products[i].ma;
        var soluongSp = user.products[i].soluong;
        var p = timKiemTheoMa(list_products, masp);
        if (!p) continue;
        var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
        var thanhtien = stringToNum(price) * soluongSp;
        totalPrice += thanhtien;

        s += `
            <tr>
                <td>`+ (i + 1) + `</td>
                <td>`+ p.name + `</td>
                <td style="text-align:center">`+ soluongSp + `</td>
                <td class="alignRight">`+ numToString(thanhtien) + ` ₫</td>
            </tr>`;
    }

    s += `
            <tr class="tt-total-row" style="font-weight:bold; text-align:center">
                <td colspan="3">TỔNG TIỀN</td>
                <td class="alignRight">`+ numToString(totalPrice) + ` ₫</td>
            </tr>
        </tbody>`;

    table.innerHTML = s;
}

function xacNhanThanhToan(form) {
    var user = getCurrentUser();
    if (!user) {
        alert('Bạn cần đăng nhập để thanh toán !');
        showTaiKhoan(true);
        return false;
    }

    if (user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return false;
    }

    if (!user.products || !user.products.length) {
        addAlertBox('Giỏ hàng trống, không có sản phẩm để thanh toán.', '#ffb400', '#fff', 2500);
        return false;
    }

    var hoten = form.hoten.value.trim();
    var sdt = form.sdt.value.trim();
    var diachi = form.diachi.value.trim();
    var pttt = form.pttt.value;
    var ghichu = form.ghichu.value.trim();

    if (!hoten || !sdt || !diachi) {
        addAlertBox('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.', '#ff4d4d', '#fff', 3000);
        return false;
    }

    if (!/^[0-9\s+]{9,15}$/.test(sdt)) {
        addAlertBox('Số điện thoại không hợp lệ.', '#ff4d4d', '#fff', 3000);
        return false;
    }

    if (!Array.isArray(user.donhang)) {
        user.donhang = [];
    }

    // Tạo id đơn hàng từ thời gian hiện tại (ISO để parse đúng ngày tháng mọi nơi)
    var now = new Date();
    var orderId = now.toISOString();
    var idShort = 'QL' + Date.now(); // Mã tra cứu đơn (không cần đăng nhập)

    var order = {
        idShort: idShort,
        sp: user.products,
        ngaymua: orderId,
        tinhTrang: pttt === 'Chuyển khoản'
            ? 'Chờ thanh toán (Chuyển khoản)'
            : 'Đang chờ xử lý',
        thongTinGiaoHang: {
            hoTen: hoten,
            sdt: sdt,
            diaChi: diachi,
            phuongThucThanhToan: pttt,
            ghiChu: ghichu
        },
        thanhToan: {
            phuongThucThanhToan: pttt,
            trangThaiThanhToan: pttt === 'Chuyển khoản'
                ? 'Chờ khách chuyển khoản'
                : 'Thanh toán khi nhận hàng (COD)',
            billImage: '',
            daGuiBill: false
        }
    };

    user.donhang.push(order);

    // Lưu vào ListOrders để tra cứu theo mã (không cần đăng nhập)
    var listOrders = getListOrders();
    listOrders.push({
        idShort: idShort,
        orderId: orderId,
        username: user.username,
        hoTen: hoten,
        sdt: sdt,
        tinhTrang: order.tinhTrang,
        ngaymua: orderId,
        sp: user.products.slice()
    });
    setListOrders(listOrders);
    user.products = [];

    setCurrentUser(user);
    updateListUser(user);
    capNhat_ThongTin_CurrentUser();

    if (pttt === 'Chuyển khoản') {
        ttCurrentTransferOrderId = orderId;
        addAlertBox('Đơn hàng đã tạo. Mã đơn: ' + idShort + ' — Vui lòng quét mã QR và tải lên bill chuyển khoản.', '#1e88e5', '#fff', 6000);
        var modal = document.getElementById('tt-qrcode-modal');
        if (modal) modal.classList.add('show');
    } else {
        addAlertBox('Đặt hàng thành công! Mã đơn: ' + idShort + ' — Đang chuyển về giỏ hàng...', '#17c671', '#fff', 3500);
        setTimeout(function () {
            window.location.assign('giohang.html?pending=1');
        }, 1200);
    }

    return false;
}

function handleUploadBill(files) {
    if (!files || !files[0]) return;
    if (!ttCurrentTransferOrderId) {
        addAlertBox('Không tìm thấy đơn chuyển khoản tương ứng.', '#ff4d4d', '#fff', 3000);
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var imgData = e.target.result;
        var users = getListUser();
        var updatedUser = null;

        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            if (!u.donhang) continue;
            for (var j = 0; j < u.donhang.length; j++) {
                var dh = u.donhang[j];
                if (dh.ngaymua == ttCurrentTransferOrderId) {
                    if (!dh.thanhToan) dh.thanhToan = {};
                    dh.thanhToan.billImage = imgData;
                    dh.thanhToan.daGuiBill = true;
                    dh.thanhToan.trangThaiThanhToan = 'Đã gửi bill - Chờ admin xác nhận';
                    dh.tinhTrang = 'Chờ xác nhận chuyển khoản';
                    users[i] = u;
                    updatedUser = u;
                    break;
                }
            }
        }

        if (updatedUser) {
            setListUser(users);
            // nếu đây là current user thì cập nhật lại
            var cu = getCurrentUser();
            if (cu && cu.username === updatedUser.username) {
                setCurrentUser(updatedUser);
                capNhat_ThongTin_CurrentUser();
            }

            addAlertBox('Đã gửi bill. Đang chuyển về giỏ hàng...', '#17c671', '#fff', 2000);
            var modal = document.getElementById('tt-qrcode-modal');
            if (modal) modal.classList.remove('show');
            ttCurrentTransferOrderId = null;
            setTimeout(function () {
                window.location.assign('giohang.html?pending=1');
            }, 1500);
        } else {
            addAlertBox('Không tìm thấy đơn chuyển khoản để lưu bill.', '#ff4d4d', '#fff', 3000);
        }
    };

    reader.readAsDataURL(files[0]);
}

function dongQrModal() {
    var modal = document.getElementById('tt-qrcode-modal');
    if (modal) modal.classList.remove('show');
}
