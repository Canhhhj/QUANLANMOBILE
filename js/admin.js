var TONGTIEN = 0;

/* START ADMIN COMMERCIAL AUDIT - UX HELPERS */
function showLoading(text = 'Đang xử lý dữ liệu...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('.loading-text').textContent = text;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function checkAdminSecurity() {
    const isChanged = localStorage.getItem('AdminPasswordChanged');
    const warning = document.getElementById('adminWarning');
    if (!warning) return;
    
    // Nếu chưa đổi mk (flag false) hoặc chưa có flag (lần đầu)
    if (isChanged !== 'true') {
        warning.style.display = 'flex';
    } else {
        warning.style.display = 'none';
    }
}
/* END ADMIN COMMERCIAL AUDIT - UX HELPERS */

window.onload = function () {
    // get data từ localstorage
    list_products = getListProducts() || list_products;
    adminInfo = getListAdmin() || adminInfo;

    addEventChangeTab();
    addEventCloseAlertButton && addEventCloseAlertButton();

    if (window.localStorage.getItem('admin')) {
        migrateDaGiaoHangToDaNhanHang(); // Đơn cũ "Đã giao hàng" → "Đã nhận hàng"
        addTableProducts();
        addTableDonHang();
        capNhatBadgeDonHang();
        showThongBaoDonChuaXuLy();
        addTableKhachHang();
        addThongKe();
        fillYearDoanhThuSelect();
        renderDoanhThuTheoThang();
        fillMonthYearDoanhThuNgaySelect();
        renderDoanhThuTheoNgay();
        addTableBanner();
        addTableTopSanPham();
        fillTopProductGroupSelect();
        renderQuanLyLoaiNhom();
        fillAddFormProductGroups();
        
        checkAdminSecurity();
        openTab('Trang Chủ')
    } else {
        document.body.innerHTML = `<h1 style="color:red; with:100%; text-align:center; margin: 50px;"> Truy cập bị từ chối.. </h1>`;
    }
}

function logOutAdmin() {
    window.localStorage.removeItem('admin');
}

/* START HIGH PRIORITY IMPLEMENT - ADMIN MOBILE TOGGLE */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('show');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('show')) {
        if (!sidebar.contains(event.target) && (!toggleBtn || !toggleBtn.contains(event.target))) {
            sidebar.classList.remove('show');
        }
    }
});
/* END HIGH PRIORITY IMPLEMENT - ADMIN MOBILE TOGGLE */

// Chuyển đơn cũ từ "Đã giao hàng" sang "Đã nhận hàng" (đồng bộ với quy trình mới)
function migrateDaGiaoHangToDaNhanHang() {
    var users = getListUser();
    var changed = false;
    for (var i = 0; i < users.length; i++) {
        if (!users[i].donhang) continue;
        for (var j = 0; j < users[i].donhang.length; j++) {
            if (users[i].donhang[j].tinhTrang === 'Đã giao hàng') {
                users[i].donhang[j].tinhTrang = 'Đã nhận hàng';
                changed = true;
            }
        }
    }
    if (changed) setListUser(users);
}

function getListRandomColor(length) {
    let result = [];
    for(let i = length; i--;) {
        result.push(getRandomColor());
    }
    return result;
}

var adminCharts = {}; // Lưu instance để hủy khi vẽ lại

function addChart(id, chartOption) {
    if (adminCharts[id]) {
        adminCharts[id].destroy();
        adminCharts[id] = null;
    }
    var el = document.getElementById(id);
    if (!el) return;
    var ctx = el.getContext('2d');
    adminCharts[id] = new Chart(ctx, chartOption);
}

function createChartConfig(title, chartType, labels, data, colors) {
    if (!labels || !labels.length) labels = ['Chưa có dữ liệu'];
    if (!data || !data.length) data = [0];
    if (!colors || !colors.length) colors = ['#90a4ae'];
    var options = {
        responsive: true,
        maintainAspectRatio: true,
        title: {
            display: true,
            text: title,
            fontSize: 16,
            fontColor: '#16324f'
        },
        legend: { display: chartType === 'bar' ? false : true }
    };
    if (chartType === 'bar' || chartType === 'line') {
        options.scales = {
            yAxes: [{ ticks: { beginAtZero: true } }],
            xAxes: [{ ticks: { maxRotation: 45 } }]
        };
    }
    return {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: options
    };
}

function addThongKe() {
    var listAll = getListDonHang(true);
    var now = new Date();
    var thangHienTai = now.getMonth();
    var namHienTai = now.getFullYear();
    // Chỉ lấy đơn trong tháng hiện tại (hết tháng tự quay về từ đầu)
    // Dùng _ngayMuaTime để tránh parse chuỗi ngày sai, đảm bảo đúng tháng/năm
    var danhSachDonHang = listAll.filter(function(d) {
        var t = d._ngayMuaTime;
        if (t == null || typeof t !== 'number' || !isFinite(t)) {
            var date = new Date(d.ma);
            if (isNaN(date.getTime())) return false;
            t = date.getTime();
        }
        var date = new Date(t);
        return date.getMonth() === thangHienTai && date.getFullYear() === namHienTai;
    });

    // --- Biểu đồ 1 & 2: Theo hãng (chỉ đơn đã nhận hàng, tháng này) ---
    var thongKeHang = {};
    danhSachDonHang.forEach(function(donHang) {
        if (donHang.tinhTrang !== 'Đã nhận hàng') return;
        donHang.sp.forEach(function(item) {
            var p = item.sanPham;
            if (!p) return;
            var donGia = (p.promo && p.promo.name === 'giareonline') ? stringToNum(p.promo.value) : stringToNum(p.price);
            var tenHang = p.company || 'Khác';
            if (!thongKeHang[tenHang]) {
                thongKeHang[tenHang] = { soLuongBanRa: 0, doanhThu: 0 };
            }
            thongKeHang[tenHang].soLuongBanRa += item.soLuong;
            thongKeHang[tenHang].doanhThu += item.soLuong * donGia;
        });
    });

    var hangLabels = Object.keys(thongKeHang);
    var hangColors = getListRandomColor(Math.max(1, hangLabels.length));
    if (!hangLabels.length) {
        hangLabels = ['Chưa có đơn trong tháng này'];
        hangColors = ['#90a4ae'];
    }

    addChart('myChart1', createChartConfig(
        'Số lượng bán ra theo hãng (tháng ' + (thangHienTai + 1) + '/' + namHienTai + ')',
        'bar',
        hangLabels,
        hangLabels.map(function(h) { return thongKeHang[h].soLuongBanRa; }),
        hangColors
    ));

    addChart('myChart2', createChartConfig(
        'Doanh thu theo hãng (tháng ' + (thangHienTai + 1) + '/' + namHienTai + ')',
        'doughnut',
        hangLabels,
        hangLabels.map(function(h) { return thongKeHang[h].doanhThu; }),
        hangColors
    ));

    // --- Biểu đồ 3: Đơn hàng theo trạng thái ---
    var theoTrangThai = {};
    danhSachDonHang.forEach(function(d) {
        var t = d.tinhTrang || 'Khác';
        theoTrangThai[t] = (theoTrangThai[t] || 0) + 1;
    });
    var ttLabels = Object.keys(theoTrangThai);
    var ttColors = ['#1e88e5', '#43a047', '#fb8c00', '#e53935', '#7b1fa2'];
    if (!ttLabels.length) {
        ttLabels = ['Chưa có đơn'];
        theoTrangThai['Chưa có đơn'] = 0;
        ttColors = ['#90a4ae'];
    }
    addChart('myChart3', createChartConfig(
        'Đơn hàng theo trạng thái (tháng ' + (thangHienTai + 1) + '/' + namHienTai + ')',
        'doughnut',
        ttLabels,
        ttLabels.map(function(l) { return theoTrangThai[l]; }),
        ttColors.slice(0, ttLabels.length)
    ));

    // --- Biểu đồ 4: Top 5 sản phẩm bán chạy (đơn đã nhận hàng) ---
    var spBanChay = {};
    danhSachDonHang.forEach(function(donHang) {
        if (donHang.tinhTrang !== 'Đã nhận hàng') return;
        donHang.sp.forEach(function(item) {
            var p = item.sanPham;
            if (!p) return;
            var key = p.masp || p.name;
            if (!spBanChay[key]) spBanChay[key] = { name: p.name, soLuong: 0 };
            spBanChay[key].soLuong += item.soLuong;
        });
    });
    var topSp = Object.keys(spBanChay)
        .map(function(k) { return { key: k, name: spBanChay[k].name, soLuong: spBanChay[k].soLuong }; })
        .sort(function(a, b) { return b.soLuong - a.soLuong; })
        .slice(0, 5);
    var topLabels = topSp.length ? topSp.map(function(x) { return x.name.length > 20 ? x.name.substring(0, 20) + '…' : x.name; }) : ['Chưa có dữ liệu'];
    var topData = topSp.length ? topSp.map(function(x) { return x.soLuong; }) : [0];
    addChart('myChart4', createChartConfig(
        'Top 5 sản phẩm bán chạy (tháng ' + (thangHienTai + 1) + '/' + namHienTai + ')',
        'bar',
        topLabels,
        topData,
        getListRandomColor(Math.max(1, topLabels.length))
    ));
}

// Doanh thu theo tháng (chỉ đơn "Đã nhận hàng"), trả về mảng 12 tháng + tổng năm. Dùng _ngayMuaTime để đúng ngày tháng.
function getDoanhThuTheoThang(nam) {
    var list = getListDonHang();
    var thang = [0,0,0,0,0,0,0,0,0,0,0,0];
    for (var i = 0; i < list.length; i++) {
        var d = list[i];
        if (d.tinhTrang !== 'Đã nhận hàng') continue;
        var t = d._ngayMuaTime;
        var date;
        if (t != null && typeof t === 'number' && isFinite(t)) {
            date = new Date(t);
        } else {
            date = new Date(d.ma);
        }
        if (isNaN(date.getTime())) continue;
        if (date.getFullYear() !== nam) continue;
        var m = date.getMonth();
        if (m >= 0 && m < 12) thang[m] += stringToNum(d.tongtien);
    }
    var tongNam = thang.reduce(function(a, b) { return a + b; }, 0);
    return { thang: thang, tongNam: tongNam };
}

// Doanh thu tháng hiện tại (reset mỗi tháng)
function getDoanhThuThangHienTai() {
    var d = getDoanhThuTheoThang(new Date().getFullYear());
    return d.thang[new Date().getMonth()];
}

// Doanh thu theo từng ngày trong tháng (chỉ đơn "Đã nhận hàng"). thang 0-11, nam số năm.
function getDoanhThuTheoNgay(thang, nam) {
    var list = getListDonHang();
    var soNgay = new Date(nam, thang + 1, 0).getDate();
    var ngay = [];
    for (var i = 0; i < soNgay; i++) ngay.push(0);
    for (var i = 0; i < list.length; i++) {
        var d = list[i];
        if (d.tinhTrang !== 'Đã nhận hàng') continue;
        var t = d._ngayMuaTime;
        var date;
        if (t != null && typeof t === 'number' && isFinite(t)) {
            date = new Date(t);
        } else {
            date = new Date(d.ma);
        }
        if (isNaN(date.getTime())) continue;
        if (date.getFullYear() !== nam || date.getMonth() !== thang) continue;
        var ngayTrongThang = date.getDate();
        if (ngayTrongThang >= 1 && ngayTrongThang <= soNgay) {
            ngay[ngayTrongThang - 1] += stringToNum(d.tongtien);
        }
    }
    var tongThang = ngay.reduce(function(a, b) { return a + b; }, 0);
    return { ngay: ngay, tongThang: tongThang };
}

function fillMonthYearDoanhThuNgaySelect() {
    var selThang = document.getElementById('monthDoanhThuNgay');
    var selNam = document.getElementById('yearDoanhThuNgay');
    if (!selThang || !selNam) return;
    var now = new Date();
    var thangHienTai = now.getMonth();
    var namHienTai = now.getFullYear();
    selThang.innerHTML = '';
    for (var m = 0; m < 12; m++) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.textContent = 'Tháng ' + (m + 1);
        if (m === thangHienTai) opt.selected = true;
        selThang.appendChild(opt);
    }
    selNam.innerHTML = '';
    for (var y = namHienTai; y >= namHienTai - 5; y--) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === namHienTai) opt.selected = true;
        selNam.appendChild(opt);
    }
}

function renderDoanhThuTheoNgay() {
    var selThang = document.getElementById('monthDoanhThuNgay');
    var selNam = document.getElementById('yearDoanhThuNgay');
    var tbody = document.getElementById('tbodyDoanhThuTheoNgay');
    var elTongThang = document.getElementById('tongThangDoanhThuNgay');
    if (!selThang || !selNam || !tbody) return;
    var thang = parseInt(selThang.value, 10);
    if (isNaN(thang) || thang < 0 || thang > 11) thang = new Date().getMonth();
    var nam = parseInt(selNam.value, 10) || new Date().getFullYear();
    var data = getDoanhThuTheoNgay(thang, nam);
    var html = '';
    for (var i = 0; i < data.ngay.length; i++) {
        html += '<tr><td>Ngày ' + (i + 1) + '</td><td class="alignRight">' + numToString(data.ngay[i]) + '₫</td></tr>';
    }
    tbody.innerHTML = html;
    if (elTongThang) elTongThang.textContent = numToString(data.tongThang) + '₫';
    var labels = data.ngay.map(function(_, i) { return 'Ngày ' + (i + 1); });
    addChart('myChart6', createChartConfig(
        'Doanh thu từng ngày (Tháng ' + (thang + 1) + '/' + nam + ')',
        'bar',
        labels,
        data.ngay,
        getListRandomColor(data.ngay.length)
    ));
}

function fillYearDoanhThuSelect() {
    var sel = document.getElementById('yearDoanhThu');
    if (!sel) return;
    var year = new Date().getFullYear();
    sel.innerHTML = '';
    for (var y = year; y >= year - 5; y--) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === year) opt.selected = true;
        sel.appendChild(opt);
    }
}

function renderDoanhThuTheoThang() {
    var sel = document.getElementById('yearDoanhThu');
    var tbody = document.getElementById('tbodyDoanhThuTheoThang');
    var elTongNam = document.getElementById('tongNamDoanhThu');
    if (!sel || !tbody) return;

    var nam = parseInt(sel.value, 10) || new Date().getFullYear();
    var data = getDoanhThuTheoThang(nam);

    var thangNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    var html = '';
    for (var i = 0; i < 12; i++) {
        html += '<tr><td>' + thangNames[i] + '</td><td class="alignRight">' + numToString(data.thang[i]) + '₫</td></tr>';
    }
    tbody.innerHTML = html;
    if (elTongNam) elTongNam.textContent = numToString(data.tongNam) + '₫';

    // Biểu đồ doanh thu theo tháng
    addChart('myChart5', createChartConfig(
        'Doanh thu từng tháng (năm ' + nam + ')',
        'bar',
        thangNames,
        data.thang,
        getListRandomColor(12)
    ));
}

/* START ADMIN PRODUCTION - DASHBOARD LOGIC */
// Số đơn hàng trong tháng hiện tại (dùng _ngayMuaTime để đúng ngày tháng)
function getSoDonTrongThang() {
    var list = getListDonHang();
    var now = new Date();
    var thang = now.getMonth();
    var nam = now.getFullYear();
    var count = 0;
    for (var i = 0; i < list.length; i++) {
        var d = new Date(list[i]._ngayMuaTime);
        if (!isNaN(d.getTime()) && d.getMonth() === thang && d.getFullYear() === nam) count++;
    }
    return count;
}

// Doanh thu hôm nay (chỉ đơn "Đã nhận hàng")
function getDoanhThuNgayHienTai() {
    var list = getListDonHang();
    var now = new Date();
    var ngay = now.getDate();
    var thang = now.getMonth();
    var nam = now.getFullYear();
    var total = 0;
    for (var i = 0; i < list.length; i++) {
        var d = list[i];
        if (d.tinhTrang !== 'Đã nhận hàng') continue;
        var date = new Date(d._ngayMuaTime);
        if (date.getDate() === ngay && date.getMonth() === thang && date.getFullYear() === nam) {
            total += stringToNum(d.tongtien);
        }
    }
    return total;
}

// Cập nhật số liệu thống kê cho trang chủ admin
function capNhatHomeStats() {
    var totalProducts = list_products ? list_products.length : 0;
    var totalCustomers = getListUser().length;
    
    var newOrders = demDonChuaXuLy();
    var revenueToday = getDoanhThuNgayHienTai();
    var revenueMonth = getDoanhThuThangHienTai();
    var newMessages = demTinNhanChuaDoc();

    var elProducts = document.getElementById('statTotalProducts');
    var elNewOrders = document.getElementById('statNewOrders');
    var elRevToday = document.getElementById('statRevenueToday');
    var elRevMonth = document.getElementById('statRevenueMonth');
    var elMessages = document.getElementById('statNewMessages');
    var elCustomers = document.getElementById('statTotalCustomers');

    if (elProducts) elProducts.innerHTML = totalProducts;
    if (elNewOrders) elNewOrders.innerHTML = newOrders;
    if (elRevToday) elRevToday.innerHTML = numToString(revenueToday) + '₫';
    if (elRevMonth) elRevMonth.innerHTML = numToString(revenueMonth) + '₫';
    if (elMessages) elMessages.innerHTML = newMessages;
    if (elCustomers) elCustomers.innerHTML = totalCustomers;
}

// Render Top 5 Sản phẩm bán chạy & 5 Đơn hàng mới nhất trên Dashboard
function renderDashboardHighlights() {
    // 1. Top 5 Sản phẩm bán chạy (tháng này)
    var listAll = getListDonHang(true);
    var now = new Date();
    var spThongKe = {};
    listAll.filter(d => {
        var dt = new Date(d._ngayMuaTime);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear() && d.tinhTrang === 'Đã nhận hàng';
    }).forEach(don => {
        don.sp.forEach(item => {
            var masp = item.sanPham.masp;
            if (!spThongKe[masp]) spThongKe[masp] = { name: item.sanPham.name, soLuong: 0, img: item.sanPham.img };
            spThongKe[masp].soLuong += item.soLuong;
        });
    });

    var top5 = Object.keys(spThongKe).map(k => spThongKe[k])
        .sort((a,b) => b.soLuong - a.soLuong).slice(0, 5);

    var htmlTop = '<table class="table-outline"><thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Đã bán</th></tr></thead><tbody>';
    if (top5.length === 0) htmlTop += '<tr><td colspan="3" style="text-align:center; padding:10px;">Chưa có dữ liệu bán hàng tháng này</td></tr>';
    top5.forEach(s => {
        htmlTop += `<tr>
            <td><img src="${fixImagePath(s.img)}" style="width:30px;height:30px;object-fit:contain;"></td>
            <td style="font-size:13px;">${s.name}</td>
            <td style="text-align:center; font-weight:bold; color:var(--primary);">${s.soLuong}</td>
        </tr>`;
    });
    htmlTop += '</tbody></table>';
    var elTop = document.getElementById('dashboardTopProducts');
    if (elTop) elTop.innerHTML = htmlTop;

    // 2. 5 Đơn hàng gần nhất
    var orders = getListDonHang().slice(0, 5);
    var htmlOrders = '<table class="table-outline"><thead><tr><th>Khách</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>';
    if (orders.length === 0) htmlOrders += '<tr><td colspan="3" style="text-align:center; padding:10px;">Chưa có đơn hàng nào</td></tr>';
    orders.forEach(d => {
        var color = d.tinhTrang === 'Đã hủy' ? 'red' : (d.tinhTrang === 'Đã nhận hàng' ? 'green' : 'orange');
        htmlOrders += `<tr>
            <td style="font-size:13px;">${d.khach}</td>
            <td style="font-size:13px; font-weight:600;">${d.tongtien}</td>
            <td style="font-size:11px; color:${color}; font-weight:600;">${d.tinhTrang}</td>
        </tr>`;
    });
    htmlOrders += '</tbody></table>';
    var elOrders = document.getElementById('dashboardRecentOrders');
    if (elOrders) elOrders.innerHTML = htmlOrders;
}

// Cập nhật lại Trang Chủ (biểu đồ + số liệu) khi mở tab Trang Chủ
function refreshTrangChu() {
    capNhatHomeStats();
    renderDashboardHighlights();
    addThongKe();
    fillYearDoanhThuSelect();
    renderDoanhThuTheoThang();
    fillMonthYearDoanhThuNgaySelect();
    renderDoanhThuTheoNgay();
}
/* END ADMIN PRODUCTION - DASHBOARD LOGIC */

// ======================= Banner trang chủ =========================
var editingBannerIndex = -1; // đang sửa banner nào (-1 = không)

function addTableBanner() {
    var container = document.getElementsByClassName('banner-admin')[0]
        .getElementsByClassName('table-content')[0];
    var list = getListBanners();

    // Seed banner mặc định (giống trang chủ) nếu chưa có
    if (!list || list.length === 0) {
        list = [
            { img: 'assets/img/banners/banner0.gif', link: 'assets/img/banners/banner0.gif' }
        ];
        for (var i = 1; i <= 9; i++) {
            var path = 'assets/img/banners/banner' + i + '.png';
            list.push({ img: path, link: path });
        }
        setListBanners(list);
    }

    var s = `<table class="table-outline">`;
    for (var i = 0; i < list.length; i++) {
        var b = list[i];
        s += `<tr>
            <td style="width: 5%">` + (i + 1) + `</td>
            <td style="width: 25%">
                <img src="` + fixImagePath(b.img) + `" style="max-width: 100%; max-height: 80px;" onerror="this.style.background='#eee';this.alt='Lỗi ảnh';">
            </td>
            <td style="width: 30%">` + (b.img || '') + `</td>
            <td style="width: 30%">` + (b.link || '') + `</td>
            <td style="width: 10%">
                <div class="tooltip" style="display:inline-block; margin-right:8px;">
                    <i class="fa fa-pencil" onclick="suaBanner(` + i + `)" style="cursor:pointer; color:#1e88e5;"></i>
                    <span class="tooltiptext">Sửa</span>
                </div>
                <div class="tooltip" style="display:inline-block;">
                    <i class="fa fa-trash" onclick="xoaBanner(` + i + `)" style="cursor:pointer; color:#c62828;"></i>
                    <span class="tooltiptext">Xóa</span>
                </div>
            </td>
        </tr>`;
    }
    s += `</table>`;
    container.innerHTML = s;
    capNhatNutBanner();
}

function capNhatNutBanner() {
    var btn = document.getElementById('bannerSubmitBtn');
    if (!btn) return;
    if (editingBannerIndex >= 0) {
        btn.innerHTML = '<i class="fa fa-check"></i> Cập nhật';
        btn.onclick = function() { capNhatBanner(); };
    } else {
        btn.innerHTML = '<i class="fa fa-plus-square"></i> Thêm banner';
        btn.onclick = function() { themBanner(); };
    }
}

function suaBanner(index) {
    var list = getListBanners();
    if (index < 0 || index >= list.length) return;
    var b = list[index];
    var imgInput = document.getElementById('bannerImgInput');
    var linkInput = document.getElementById('bannerLinkInput');
    if (imgInput) imgInput.value = b.img || '';
    if (linkInput) linkInput.value = b.link || '';
    editingBannerIndex = index;
    capNhatNutBanner();
}

function capNhatBanner() {
    var imgInput = document.getElementById('bannerImgInput');
    var linkInput = document.getElementById('bannerLinkInput');
    var img = imgInput ? imgInput.value.trim() : '';
    var link = linkInput ? linkInput.value.trim() : '';
    if (!img) {
        alert('Vui lòng nhập đường dẫn ảnh banner!');
        return;
    }
    var list = getListBanners();
    if (editingBannerIndex >= 0 && editingBannerIndex < list.length) {
        list[editingBannerIndex] = { img: img, link: link };
        setListBanners(list);
        editingBannerIndex = -1;
        imgInput.value = '';
        linkInput.value = '';
        capNhatNutBanner();
        addTableBanner();
    }
}

function themBanner() {
    var imgInput = document.getElementById('bannerImgInput');
    var linkInput = document.getElementById('bannerLinkInput');
    var img = imgInput ? imgInput.value.trim() : '';
    var link = linkInput ? linkInput.value.trim() : '';

    if (!img) {
        alert('Vui lòng nhập đường dẫn ảnh banner!');
        if (imgInput) imgInput.focus();
        return;
    }

    var list = getListBanners();
    list.push({ img: img, link: link });
    setListBanners(list);
    addTableBanner();
    imgInput.value = '';
    linkInput.value = '';
}

function xoaBanner(index) {
    var list = getListBanners();
    if (index < 0 || index >= list.length) return;

    if (window.confirm('Bạn có chắc muốn xóa banner này?')) {
        list.splice(index, 1);
        setListBanners(list);
        if (editingBannerIndex === index) {
            editingBannerIndex = -1;
            var imgInput = document.getElementById('bannerImgInput');
            var linkInput = document.getElementById('bannerLinkInput');
            if (imgInput) imgInput.value = '';
            if (linkInput) linkInput.value = '';
        } else if (editingBannerIndex > index) {
            editingBannerIndex--;
        }
        capNhatNutBanner();
        addTableBanner();
    }
}

// ======================= Top sản phẩm theo nhóm =========================
function getProductGroupName(id) {
    var list = getListProductGroups();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i].name;
    }
    return id;
}

function fillTopProductGroupSelect() {
    var sel = document.getElementById('topGroupSelect');
    if (!sel) return;
    var list = getListProductGroups();
    var cur = sel.value;
    sel.innerHTML = '';
    for (var i = 0; i < list.length; i++) {
        var opt = document.createElement('option');
        opt.value = list[i].id;
        opt.textContent = list[i].name;
        sel.appendChild(opt);
    }
    if (list.length && (cur === '' || !list.find(function(g) { return g.id === cur; }))) {
        sel.selectedIndex = 0;
    } else if (cur) {
        sel.value = cur;
    }
}

function renderQuanLyLoaiNhom() {
    var tbody = document.getElementById('quanLyLoaiNhomContent');
    if (!tbody) return;
    var list = getListProductGroups();
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var g = list[i];
        html += '<tr><td>' + (i + 1) + '</td><td>' + g.id + '</td>' +
            '<td><input type="text" id="groupName_' + g.id + '" value="' + (g.name || '').replace(/"/g, '&quot;') + '" style="width:100%"></td>' +
            '<td><button type="button" onclick="suaTenLoaiNhom(\'' + g.id + '\')">Sửa tên</button> ' +
            '<button type="button" onclick="xoaLoaiNhom(\'' + g.id + '\')">Xóa</button></td></tr>';
    }
    tbody.innerHTML = html || '<tr><td colspan="4">Chưa có loại nhóm.</td></tr>';
}

function themLoaiNhom() {
    var idEl = document.getElementById('newGroupId');
    var nameEl = document.getElementById('newGroupName');
    if (!idEl || !nameEl) return;
    var id = (idEl.value || '').trim().replace(/\s+/g, '_');
    var name = (nameEl.value || '').trim();
    if (!id) {
        alert('Vui lòng nhập mã nhóm (vd: gia_re).');
        return;
    }
    if (!name) {
        alert('Vui lòng nhập tên hiển thị.');
        return;
    }
    var list = getListProductGroups();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            alert('Mã nhóm đã tồn tại.');
            return;
        }
    }
    list.push({ id: id, name: name });
    setListProductGroups(list);
    idEl.value = '';
    nameEl.value = '';
    fillTopProductGroupSelect();
    renderQuanLyLoaiNhom();
    fillAddFormProductGroups();
    addTableTopSanPham();
}

function suaTenLoaiNhom(id) {
    var input = document.getElementById('groupName_' + id);
    if (!input) return;
    var name = (input.value || '').trim();
    if (!name) {
        alert('Tên hiển thị không được để trống.');
        return;
    }
    var list = getListProductGroups();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            list[i].name = name;
            break;
        }
    }
    setListProductGroups(list);
    fillTopProductGroupSelect();
    renderQuanLyLoaiNhom();
    fillAddFormProductGroups();
    addTableTopSanPham();
}

function xoaLoaiNhom(id) {
    if (!confirm('Xóa loại nhóm này? Sản phẩm thuộc nhóm sẽ được gỡ khỏi nhóm.')) return;
    var list = getListProductGroups();
    list = list.filter(function(g) { return g.id !== id; });
    setListProductGroups(list);
    for (var i = 0; i < list_products.length; i++) {
        if (list_products[i].groups && list_products[i].groups[id]) {
            delete list_products[i].groups[id];
        }
    }
    setListProducts(list_products);
    fillTopProductGroupSelect();
    renderQuanLyLoaiNhom();
    fillAddFormProductGroups();
    addTableTopSanPham();
    addTableProducts();
}

function fillAddFormProductGroups() {
    var container = document.getElementById('addFormProductGroups');
    if (!container) return;
    var list = getListProductGroups();
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var g = list[i];
        html += '<label><input type="checkbox" value="' + g.id + '"> ' + (g.name || g.id) + '</label><br>';
    }
    container.innerHTML = html || '';
}

function addTableTopSanPham() {
    var wrapper = document.getElementsByClassName('topsanpham')[0];
    if (!wrapper) return;

    var container = wrapper.getElementsByClassName('table-content')[0];
    var groupSelect = document.getElementById('topGroupSelect');
    var productSelect = document.getElementById('topProductSelect');
    var list = getListProductGroups();
    var currentGroup = (groupSelect && groupSelect.options.length) ? groupSelect.value : (list[0] ? list[0].id : 'gia_re');

    var inGroup = [];
    var notInGroup = [];

    for (var i = 0; i < list_products.length; i++) {
        var p = list_products[i];
        var groups = p.groups || {};
        if (groups[currentGroup]) inGroup.push(p);
        else notInGroup.push(p);
    }

    var groupLabel = getProductGroupName(currentGroup);
    var s = `<table class="table-outline">`;
    for (var j = 0; j < inGroup.length; j++) {
        var p2 = inGroup[j];
        s += `<tr>
            <td style="width: 5%">` + (j + 1) + `</td>
            <td style="width: 10%">` + p2.masp + `</td>
            <td style="width: 40%">
                <a title="Xem chi tiết" target="_blank" href="chitietsanpham.html?` + p2.name.split(' ').join('-') + `">` + p2.name + `</a>
            </td>
            <td style="width: 20%">` + groupLabel + `</td>
            <td style="width: 25%">
                <div class="tooltip">
                    <i class="fa fa-wrench" onclick="addKhungSuaSanPham('` + p2.masp + `')"></i>
                    <span class="tooltiptext">Sửa sản phẩm</span>
                </div>
                <div class="tooltip">
                    <i class="fa fa-remove" onclick="goKhoiNhom('` + p2.masp + `', '` + currentGroup + `')"></i>
                    <span class="tooltiptext">Gỡ khỏi nhóm</span>
                </div>
            </td>
        </tr>`;
    }
    s += `</table>`;
    container.innerHTML = s;

    if (productSelect) {
        var options = `<option value="">-- Chọn sản phẩm để thêm --</option>`;
        for (var k = 0; k < notInGroup.length; k++) {
            options += `<option value="` + notInGroup[k].masp + `">` + notInGroup[k].masp + ' - ' + notInGroup[k].name + `</option>`;
        }
        productSelect.innerHTML = options;
    }
}

function themSanPhamVaoNhom() {
    var groupSelect = document.getElementById('topGroupSelect');
    var productSelect = document.getElementById('topProductSelect');
    if (!groupSelect || !productSelect) return;

    var groupKey = groupSelect.value;
    var masp = productSelect.value;
    if (!masp) {
        alert('Vui lòng chọn sản phẩm để thêm vào nhóm.');
        return;
    }

    for (var i = 0; i < list_products.length; i++) {
        if (list_products[i].masp === masp) {
            if (!list_products[i].groups) list_products[i].groups = {};
            list_products[i].groups[groupKey] = true;
            break;
        }
    }

    setListProducts(list_products);
    addTableTopSanPham();
    addTableProducts();
}

function goKhoiNhom(masp, groupKey) {
    for (var i = 0; i < list_products.length; i++) {
        if (list_products[i].masp === masp) {
            if (list_products[i].groups && list_products[i].groups[groupKey]) {
                delete list_products[i].groups[groupKey];
            }
            break;
        }
    }

    setListProducts(list_products);
    addTableTopSanPham();
    addTableProducts();
}

// ======================= Các Tab =========================
function addEventChangeTab() {
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var list_a = sidebar.getElementsByTagName('a');
    for(var a of list_a) {
        var tab = a.getAttribute('data-tab');
        if (!tab) continue;
        a.addEventListener('click', function() {
            turnOff_Active();
            this.classList.add('active');
            openTab(this.getAttribute('data-tab'));
        });
    }
}

function turnOff_Active() {
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var list_a = sidebar.getElementsByTagName('a');
    for(var a of list_a) {
        a.classList.remove('active');
    }
}

function openTab(nameTab) {
    // ẩn hết
    var main = document.getElementsByClassName('main')[0].children;
    for(var e of main) {
        e.style.display = 'none';
    }

    // mở tab và tải lại dữ liệu để luôn hiện danh sách (sửa / xóa / thêm)
    switch(nameTab) {
        case 'Trang Chủ':
            document.getElementsByClassName('home')[0].style.display = 'block';
            refreshTrangChu();
            break;
        case 'Banner':
            document.getElementsByClassName('banner-admin')[0].style.display = 'block';
            addTableBanner();
            break;
        case 'Sản Phẩm': document.getElementsByClassName('sanpham')[0].style.display = 'block'; break;
        case 'Đơn Hàng': document.getElementsByClassName('donhang')[0].style.display = 'block'; break;
        case 'Khách Hàng': document.getElementsByClassName('khachhang')[0].style.display = 'block'; break;
        case 'Top Sản Phẩm':
            document.getElementsByClassName('topsanpham')[0].style.display = 'block';
            addTableTopSanPham();
            break;
        case 'Tin Nhắn':
            document.getElementsByClassName('khach-hang-nhan-tin')[0].style.display = 'block';
            addTableMessages();
            break;
    }
}

// ========================== Sản Phẩm ========================
/* START ADMIN PRODUCTION - PRODUCT LOGIC */
// Vẽ bảng danh sách sản phẩm (với trạng thái tồn kho)
function addTableProducts(list = list_products) {
    var tc = document.getElementsByClassName('sanpham')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline">`;

    for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var soLuong = p.soluong || 0;
        var statusHtml = soLuong > 0 
            ? `<span style="color:green; font-weight:bold;">Còn hàng (${soLuong})</span>` 
            : `<span style="color:red; font-weight:bold;">Hết hàng</span>`;

        s += `<tr>
            <td data-label="STT" style="width: 5%">` + (i + 1) + `</td>
            <td data-label="Mã" style="width: 10%">` + p.masp + `</td>
            <td data-label="Sản phẩm" style="width: 35%">
                <a title="Xem chi tiết" target="_blank" href="chitietsanpham.html?` + p.name.split(' ').join('-') + `">` + p.name + `</a>
                <img src="` + fixImagePath(p.img) + `" style="width:50px;height:50px;object-fit:contain;margin-top:5px;display:block;">
            </td>
            <td data-label="Giá" style="width: 15%">` + p.price + `</td>
            <td data-label="Trạng thái" style="width: 15%">` + statusHtml + `</td>
            <td data-label="Hành động" style="width: 20%">
                <div class="tooltip">
                    <i class="fa fa-wrench" onclick="addKhungSuaSanPham('` + p.masp + `')"></i>
                    <span class="tooltiptext">Sửa</span>
                </div>
                <div class="tooltip">
                    <i class="fa fa-trash" onclick="xoaSanPham('` + p.masp + `', '`+p.name+`')"></i>
                    <span class="tooltiptext">Xóa</span>
                </div>
            </td>
        </tr>`;
    }

    s += `</table>`;
    tc.innerHTML = s;
}

// Bộ lọc đa điều kiện chuẩn doanh nghiệp
function locSanPham() {
    var brand = document.getElementById('filterCompany').value;
    var priceRange = document.getElementById('filterPrice').value;
    var stock = document.getElementById('filterStock').value;
    var sort = document.getElementById('sortProduct').value;
    var searchType = document.getElementById('kieuTimSanPham').value;
    var searchText = document.getElementById('inputTimSanPham').value.toLowerCase();

    var result = list_products.filter(p => {
        // Lọc theo hãng
        if (brand && p.company !== brand) return false;

        // Lọc theo giá
        if (priceRange) {
            var [min, max] = priceRange.split('-').map(Number);
            var pPrice = stringToNum(p.price);
            if (max === 0) { // Trên x triệu
                if (pPrice < min) return false;
            } else {
                if (pPrice < min || pPrice > max) return false;
            }
        }

        // Lọc theo tồn kho
        if (stock) {
            var sl = p.soluong || 0;
            if (stock === 'con_hang' && sl <= 0) return false;
            if (stock === 'het_hang' && sl > 0) return false;
        }

        // Lọc theo tìm kiếm
        if (searchText) {
            if (searchType === 'ma') {
                if (p.masp.toLowerCase().indexOf(searchText) < 0) return false;
            } else {
                if (p.name.toLowerCase().indexOf(searchText) < 0) return false;
            }
        }

        return true;
    });

    // Sắp xếp
    if (sort === 'price_asc') result.sort((a,b) => stringToNum(a.price) - stringToNum(b.price));
    else if (sort === 'price_desc') result.sort((a,b) => stringToNum(b.price) - stringToNum(a.price));
    else if (sort === 'stt_desc') result.reverse();

    addTableProducts(result);
}
/* END ADMIN PRODUCTION - PRODUCT LOGIC */

// Thêm
let previewSrc; // biến toàn cục lưu file ảnh đang thêm
function layThongTinSanPhamTuTable(id) {
    var khung = document.getElementById(id);
    var tr = khung.getElementsByTagName('tr');

    var masp = tr[1].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var name = tr[2].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var company = tr[3].getElementsByTagName('td')[1].getElementsByTagName('select')[0].value;
    var img = tr[4].getElementsByTagName('td')[1].getElementsByTagName('img')[0].src;
    var price = tr[5].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var star = tr[6].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var rateCount = tr[7].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var promoName = tr[8].getElementsByTagName('td')[1].getElementsByTagName('select')[0].value;
    var promoValue = tr[9].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    
    // START ADMIN PRODUCTION - QUANTITY HANDLING
    var soluong = tr[10].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    // END ADMIN PRODUCTION - QUANTITY HANDLING

    // Nhóm hiển thị
    var groupInputs = tr[11].getElementsByTagName('td')[1].getElementsByTagName('input');
    var groups = {};
    for (var i = 0; i < groupInputs.length; i++) {
        if (groupInputs[i].checked) {
            groups[groupInputs[i].value] = true;
        }
    }

    var screen = tr[13].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var os = tr[14].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var camara = tr[15].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var camaraFront = tr[16].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var cpu = tr[17].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var ram = tr[18].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var rom = tr[19].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var microUSB = tr[20].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var battery = tr[21].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;

    if(isNaN(price)) {
        alert('Giá phải là số nguyên');
        return false;
    }

    if(isNaN(star)) {
        alert('Số sao phải là số nguyên');
        return false;
    }

    if(isNaN(rateCount)) {
        alert('Số đánh giá phải là số nguyên');
        return false;
    }

    try {
        return {
            "name": name,
            "company": company,
            "img": previewSrc || img,
            "price": numToString(Number.parseInt(price, 10)),
            "star": Number.parseInt(star, 10),
            "rateCount": Number.parseInt(rateCount, 10),
            "promo": {
                "name": promoName,
                "value": promoValue
            },
            "soluong": Number.parseInt(soluong || 0, 10),
            "groups": groups,
            "detail": {
                "screen": screen,
                "os": os,
                "camara": camara,
                "camaraFront": camaraFront,
                "cpu": cpu,
                "ram": ram,
                "rom": rom,
                "microUSB": microUSB,
                "battery": battery
            },
            "masp" : masp
        }
    } catch(e) {
        alert('Lỗi: ' + e.toString());
        return false;
    }
}
function themSanPham() {
    var newSp = layThongTinSanPhamTuTable('khungThemSanPham');
    if(!newSp) return;

    for(var p of list_products) {
        if(p.masp == newSp.masp) {
            alert('Mã sản phẩm bị trùng !!');
            return false;
        }

        if(p.name == newSp.name) {
            alert('Tên sản phẩm bị trùng !!');
            return false;
        }
    }
     // Them san pham vao list_products
     list_products.push(newSp);

     // Lưu vào localstorage
     setListProducts(list_products);
 
     // Vẽ lại table
     addTableProducts();

    alert('Thêm sản phẩm "' + newSp.name + '" thành công.');
    document.getElementById('khungThemSanPham').style.transform = 'scale(0)';
}
function autoMaSanPham(company) {
    // hàm tự tạo mã cho sản phẩm mới
    if(!company) company = document.getElementsByName('chonCompany')[0].value;
    var index = 0;
    for (var i = 0; i < list_products.length; i++) {
        if (list_products[i].company == company) {
            index++;
        }
    }
    document.getElementById('maspThem').value = company.substring(0, 3) + index;
}

// Xóa
function xoaSanPham(masp, tensp) {
    var msg = 'Bạn có chắc muốn xóa sản phẩm "' + tensp + '"?\n\nLưu ý: Sản phẩm có thể đang nằm trong đơn hàng hoặc giỏ hàng của khách. Sau khi xóa, sản phẩm sẽ không hiển thị ở trang web nhưng đơn hàng cũ vẫn giữ nguyên.';
    if (window.confirm(msg)) {
        // Xóa
        for(var i = 0; i < list_products.length; i++) {
            if(list_products[i].masp == masp) {
                list_products.splice(i, 1);
            }
        }

        // Lưu vào localstorage
        setListProducts(list_products);

        // Vẽ lại table 
        addTableProducts();
    }
}

// Sửa
function suaSanPham(masp) {
    var sp = layThongTinSanPhamTuTable('khungSuaSanPham');
    if(!sp) return;
    
    for(var p of list_products) {
        if(p.masp == masp && p.masp != sp.masp) {
            alert('Mã sản phẩm bị trùng !!');
            return false;
        }

        if(p.name == sp.name && p.masp != sp.masp) {
            alert('Tên sản phẩm bị trùng !!');
            return false;
        }
    }
    // Sửa
    for(var i = 0; i < list_products.length; i++) {
        if(list_products[i].masp == masp) {
            list_products[i] = sp;
        }
    }

    // Lưu vào localstorage
    setListProducts(list_products);

    // Vẽ lại table
    addTableProducts();

    alert('Sửa ' + sp.name + ' thành công');

    document.getElementById('khungSuaSanPham').style.transform = 'scale(0)';
}

function addKhungSuaSanPham(masp) {
    var sp;
    for(var p of list_products) {
        if(p.masp == masp) {
            sp = p;
        }
    }

    var s = `<span class="close" onclick="this.parentElement.style.transform = 'scale(0)';">&times;</span>
    <table class="overlayTable table-outline table-content table-header">
        <tr>
            <th colspan="2">`+sp.name+`</th>
        </tr>
        <tr>
            <td>Mã sản phẩm:</td>
            <td><input type="text" value="`+sp.masp+`"></td>
        </tr>
        <tr>
            <td>Tên sẩn phẩm:</td>
            <td><input type="text" value="`+sp.name+`"></td>
        </tr>
        <tr>
            <td>Hãng:</td>
            <td>
                <select>`
                    
    var company = ["Apple", "Samsung", "Oppo", "Nokia", "Huawei", "Xiaomi","Realme", "Vivo", "Philips", "Mobell", "Mobiistar", "Itel","Coolpad", "HTC", "Motorola"];
    for(var c of company) {
        if(sp.company == c)
            s += (`<option value="`+c+`" selected>`+c+`</option>`);
        else s += (`<option value="`+c+`">`+c+`</option>`);
    }

    s += `
                </select>
            </td>
        </tr>
        <tr>
            <td>Hình:</td>
            <td>
                <img class="hinhDaiDien" id="anhDaiDienSanPhamSua" src="` + fixImagePath(sp.img) + `">
                <input type="file" accept="image/*" onchange="capNhatAnhSanPham(this.files, 'anhDaiDienSanPhamSua')">
            </td>
        </tr>
        <tr>
            <td>Giá tiền (số nguyên):</td>
            <td><input type="text" value="`+stringToNum(sp.price)+`"></td>
        </tr>
        <tr>
            <td>Số sao (số nguyên 0->5):</td>
            <td><input type="text" value="`+sp.star+`"></td>
        </tr>
        <tr>
            <td>Đánh giá (số nguyên):</td>
            <td><input type="text" value="`+sp.rateCount+`"></td>
        </tr>
        <tr>
            <td>Khuyến mãi:</td>
            <td>
                <select>
                    <option value="">Không</option>
                    <option value="tragop" `+(sp.promo.name == 'tragop'?'selected':'')+`>Trả góp</option>
                    <option value="giamgia" `+(sp.promo.name == 'giamgia'?'selected':'')+`>Giảm giá</option>
                    <option value="giareonline" `+(sp.promo.name == 'giareonline'?'selected':'')+`>Giá rẻ online</option>
                    <option value="moiramat" `+(sp.promo.name == 'moiramat'?'selected':'')+`>Mới ra mắt</option>
                </select>
            </td>
        </tr>
        <tr>
            <td>Giá trị khuyến mãi:</td>
            <td><input type="text" value="`+sp.promo.value+`"></td>
        </tr>
        <tr>
            <td>Số lượng còn:</td>
            <td><input type="number" value="`+(sp.soluong || 0)+`"></td>
        </tr>
        <tr>
            <td>Nhóm hiển thị:</td>
            <td class="product-groups">` + (function(){
                var list = getListProductGroups();
                var h = '';
                for (var i = 0; i < list.length; i++) {
                    var g = list[i];
                    var checked = (sp.groups && sp.groups[g.id]) ? 'checked' : '';
                    h += '<label><input type="checkbox" value="' + g.id + '" ' + checked + '> ' + (g.name || g.id) + '</label><br>';
                }
                return h;
            })() + `
            </td>
        </tr>
        <tr>
            <th colspan="2">Thông số kĩ thuật</th>
        </tr>
        <tr>
            <td>Màn hình:</td>
            <td><input type="text" value="`+sp.detail.screen+`"></td>
        </tr>
        <tr>
            <td>Hệ điều hành:</td>
            <td><input type="text" value="`+sp.detail.os+`"></td>
        </tr>
        <tr>
            <td>Camara sau:</td>
            <td><input type="text" value="`+sp.detail.camara+`"></td>
        </tr>
        <tr>
            <td>Camara trước:</td>
            <td><input type="text" value="`+sp.detail.camaraFront+`"></td>
        </tr>
        <tr>
            <td>CPU:</td>
            <td><input type="text" value="`+sp.detail.cpu+`"></td>
        </tr>
        <tr>
            <td>RAM:</td>
            <td><input type="text" value="`+sp.detail.ram+`"></td>
        </tr>
        <tr>
            <td>Bộ nhớ trong:</td>
            <td><input type="text" value="`+sp.detail.rom+`"></td>
        </tr>
        <tr>
            <td>Thẻ nhớ:</td>
            <td><input type="text" value="`+sp.detail.microUSB+`"></td>
        </tr>
        <tr>
            <td>Dung lượng Pin:</td>
            <td><input type="text" value="`+sp.detail.battery+`"></td>
        </tr>
        <tr>
            <td colspan="2"  class="table-footer"> <button onclick="suaSanPham('`+sp.masp+`')">SỬA</button> </td>
        </tr>
    </table>`
    var khung = document.getElementById('khungSuaSanPham');
    khung.innerHTML = s;
    khung.style.transform = 'scale(1)';
}

// Cập nhật ảnh sản phẩm
function capNhatAnhSanPham(files, id) {
    // var url = '';
    // if(files.length) url = window.URL.createObjectURL(files[0]);
    
    // document.getElementById(id).src = url;

    const reader = new FileReader();
    reader.addEventListener("load", function () {
        // convert image file to base64 string
        previewSrc = reader.result;
        document.getElementById(id).src = previewSrc;
    }, false);

    if (files[0]) {
        reader.readAsDataURL(files[0]);
    }
} 

// Sắp Xếp sản phẩm
function sortProductsTable(loai) {
    var list = document.getElementsByClassName('sanpham')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_SanPham); // type cho phép lựa chọn sort theo mã hoặc tên hoặc giá ... 
    decrease = !decrease;
}

// Lấy giá trị của loại(cột) dữ liệu nào đó trong bảng
function getValueOfTypeInTable_SanPham(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt' : return Number(td[0].innerHTML);
        case 'masp' : return td[1].innerHTML.toLowerCase();
        case 'ten' : return td[2].innerHTML.toLowerCase();
        case 'gia' : return stringToNum(td[3].innerHTML);
        case 'khuyenmai' : return td[4].innerHTML.toLowerCase();
    }
    return false;
}

// Trạng thái đơn: chỉ tiến theo thứ tự (Chờ → Đang đi giao → Đã nhận hàng), không quay lại
function isTrangThaiCho(d) {
    var t = d.tinhTrang;
    return t === 'Đang chờ xử lý' || t === 'Chờ thanh toán (Chuyển khoản)' || t === 'Chờ xác nhận chuyển khoản';
}

function demDonChuaXuLy() {
    var list = getListDonHang();
    var count = 0;
    for (var i = 0; i < list.length; i++) {
        if (isTrangThaiCho(list[i])) count++;
    }
    return count;
}

/* START ADMIN PRODUCTION - MESSAGE CRM LOGIC */
function demTinNhanChuaDoc() {
    const messages = JSON.parse(localStorage.getItem('ListCustomerMessages')) || [];
    return messages.filter(m => !m.status || m.status === 'unread').length;
}

function addTableMessages() {
    const tbody = document.getElementById('listMessages');
    if (!tbody) return;

    const messages = JSON.parse(localStorage.getItem('ListCustomerMessages')) || [];
    const filterStatus = document.getElementById('filterMessageStatus') ? document.getElementById('filterMessageStatus').value : '';

    let list = messages;
    if (filterStatus) {
        list = messages.filter(m => m.status === filterStatus || (!m.status && filterStatus === 'unread'));
    }

    // Sắp xếp: unread -> consulting -> closed -> spam (theo thời gian mới nhất)
    const orderMap = { 'unread': 0, 'consulting': 1, 'closed': 2, 'spam': 3 };
    list.sort((a, b) => {
        const sA = a.status || 'unread';
        const sB = b.status || 'unread';
        if (orderMap[sA] !== orderMap[sB]) return orderMap[sA] - orderMap[sB];
        return new Date(b.date) - new Date(a.date);
    });

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Không tìm thấy tin nhắn nào khớp.</td></tr>';
        return;
    }

    let html = '';
    list.forEach((m, index) => {
        const dateStr = new Date(m.date).toLocaleString('vi-VN');
        const statusObj = getMessageStatusUI(m.status || 'unread');

        html += `
            <tr class="msg-row ${m.status === 'unread' ? 'msg-unread' : ''}">
                <td data-label="STT" style="text-align:center">${index + 1}</td>
                <td data-label="Khách hàng">
                    <strong>${m.name}</strong><br>
                    <small>${m.phone}</small><br>
                </td>
                <td data-label="Thông tin">
                    <div style="font-size:12px; font-weight:600; color:var(--primary);">${m.productName || 'Trang chủ'}</div>
                    <span style="display:inline-block; margin-top:5px; background:${statusObj.color}; color:#fff; font-size:10px; padding:2px 8px; border-radius:10px;">${statusObj.text}</span>
                </td>
                <td data-label="Nội dung"><div style="font-size:13px;">${m.content}</div></td>
                <td data-label="Ngày gửi" style="text-align:center; font-size:12px;">${dateStr}</td>
                <td data-label="Hành động" style="text-align:center">
                    <div class="msg-actions">
                        <i class="fa fa-edit" onclick="openMessageCRM('${m.id}')" title="Chỉnh sửa CRM" style="color:#ff9800"></i>
                        <i class="fa fa-envelope-open-o" onclick="changeMessageStatus('${m.id}', 'consulting')" title="Đang tư vấn" style="color:#2196f3"></i>
                        <i class="fa fa-check-circle" onclick="changeMessageStatus('${m.id}', 'closed')" title="Đã chốt" style="color:#4caf50"></i>
                        <i class="fa fa-ban" onclick="changeMessageStatus('${m.id}', 'spam')" title="Spam" style="color:#9e9e9e"></i>
                        <i class="fa fa-trash" onclick="xoaTinNhan('${m.id}')" title="Xoá" style="color:#f44336"></i>
                    </div>
                </td>
            </tr>`;
    });

    tbody.innerHTML = html;
    capNhatHomeStats();
}

function getMessageStatusUI(status) {
    switch(status) {
        case 'consulting': return { text: 'ĐANG TƯ VẤN', color: '#2196f3' };
        case 'closed': return { text: 'ĐÃ CHỐT', color: '#4caf50' };
        case 'spam': return { text: 'SPAM', color: '#9e9e9e' };
        default: return { text: 'MỚI', color: '#e91e63' };
    }
}

function changeMessageStatus(id, newStatus) {
    let messages = JSON.parse(localStorage.getItem('ListCustomerMessages')) || [];
    for (var m of messages) {
        if (m.id == id) {
            m.status = newStatus;
            break;
        }
    }
    localStorage.setItem('ListCustomerMessages', JSON.stringify(messages));
    addTableMessages();
}
/* END ADMIN PRODUCTION - MESSAGE CRM LOGIC */

function xoaTinNhan(id) {
    if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
        let messages = JSON.parse(localStorage.getItem('ListCustomerMessages')) || [];
        messages = messages.filter(m => m.id !== id);
        localStorage.setItem('ListCustomerMessages', JSON.stringify(messages));
        addTableMessages();
    }
}

function capNhatBadgeDonHang() {
    // Badge đơn hàng
    var orderBadge = document.getElementById('donHangBadge');
    if (orderBadge) {
        var nOrders = demDonChuaXuLy();
        if (nOrders > 0) {
            orderBadge.textContent = nOrders;
            orderBadge.style.display = 'inline';
            orderBadge.title = nOrders + ' đơn hàng chưa xử lý';
        } else {
            orderBadge.textContent = '';
            orderBadge.style.display = 'none';
        }
    }

    // Badge tin nhắn
    var msgBadge = document.getElementById('message-badge');
    if (msgBadge) {
        var nMsgs = demTinNhanChuaDoc();
        if (nMsgs > 0) {
            msgBadge.textContent = nMsgs;
            msgBadge.style.display = 'inline';
            msgBadge.title = nMsgs + ' tin nhắn mới';
        } else {
            msgBadge.textContent = '';
            msgBadge.style.display = 'none';
        }
    }
}

function showThongBaoDonChuaXuLy() {
    var n = demDonChuaXuLy();
    if (n <= 0) return;
    var el = document.getElementById('thongBaoDonHang');
    if (!el) return;
    el.innerHTML = '<span>Bạn có <strong>' + n + '</strong> đơn hàng chưa xử lý.</span> <a href="javascript:void(0)" id="linkVaoDonHang">Vào Đơn Hàng</a> <span class="thongbao-close">×</span>';
    el.querySelector('#linkVaoDonHang').onclick = function() { openTab('Đơn Hàng'); el.style.display = 'none'; };
    el.querySelector('.thongbao-close').onclick = function() { el.style.display = 'none'; };
    el.style.display = 'block';
}
function isTrangThaiDangGiao(d) {
    var t = d.tinhTrang;
    return t === 'Đang đi giao' || t === 'Đã nhận tiền - Đang giao hàng';
}

// ========================= Đơn Hàng ===========================
// Vẽ bảng
function addTableDonHang() {
    var tc = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline">`;

    var listDH = getListDonHang();

    TONGTIEN = 0;
    for (var i = 0; i < listDH.length; i++) {
        var d = listDH[i];
        // Chỉ cộng doanh thu khi khách đã nhận hàng
        if (d.tinhTrang === 'Đã nhận hàng') {
            TONGTIEN += stringToNum(d.tongtien);
        }

        var hoTen = (d.hoTen || '').trim() || '—';
        var sdt = (d.sdt || '').trim() || '—';
        var diaChi = (d.diaChi || '').trim() || '—';

        var nutHanhDong = `
                <div class="tooltip">
                    <i class="fa fa-eye" onclick="xemChiTietDonHang('`+d.ma+`')"></i>
                    <span class="tooltiptext">Chi tiết</span>
                </div>`;
        if (isTrangThaiCho(d)) {
            nutHanhDong += `
                <div class="tooltip">
                    <i class="fa fa-check" onclick="duyet('`+d.ma+`', true)"></i>
                    <span class="tooltiptext">Xác nhận đơn</span>
                </div>
                <div class="tooltip">
                    <i class="fa fa-remove" onclick="duyet('`+d.ma+`', false)"></i>
                    <span class="tooltiptext">Hủy</span>
                </div>`;
        } else if (isTrangThaiDangGiao(d)) {
            nutHanhDong += `
                <div class="tooltip">
                    <i class="fa fa-truck" onclick="xacNhanDaGiaoHang('`+d.ma+`')"></i>
                    <span class="tooltiptext">Xác nhận đã giao</span>
                </div>`;
        }

        s += `<tr data-ma="` + (d.ma || '').replace(/"/g, '&quot;') + `">
            <td data-label="STT" style="width: 4%">` + (i+1) + `</td>
            <td data-label="Tài khoản" style="width: 7%">` + d.khach + `</td>
            <td data-label="Họ tên" style="width: 11%">` + hoTen + `</td>
            <td data-label="SĐT" style="width: 9%">` + sdt + `</td>
            <td data-label="Địa chỉ" style="width: 15%">` + diaChi + `</td>
            <td data-label="Sản phẩm" style="width: 16%">` + d.sp + `</td>
            <td data-label="Tổng tiền" style="width: 9%">` + d.tongtien + `</td>
            <td data-label="Ngày giờ" style="width: 9%">` + d.ngaygio + `</td>
            <td data-label="Trạng thái" style="width: 11%">` + d.tinhTrang + `</td>
            <td data-label="Hành động" style="width: 9%">` + nutHanhDong + `</td>
        </tr>`;
    }

    s += `</table>`;
    tc.innerHTML = s;

    capNhatBadgeDonHang();
    capNhatHomeStats();
}

/* START ADMIN MASTER POLISH - DATA SAFETY & ANALYTICS */
function calculateGrowth(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    const growth = ((current - previous) / previous) * 100;
    return isNaN(growth) ? 0 : growth;
}
/* END ADMIN MASTER POLISH - DATA SAFETY & ANALYTICS */

/* START ADMIN BUSINESS INTELLIGENCE - DASHBOARD LOGIC */
function getDoanhThuCuaNgay(d, m, y) {
    var list = getListDonHang();
    var total = 0;
    for (var i = 0; i < list.length; i++) {
        var dh = list[i];
        if (dh.tinhTrang !== 'Đã nhận hàng' && dh.tinhTrang !== 'Hoàn thành') continue;
        var date = new Date(dh._ngayMuaTime || dh.ma);
        if (date.getDate() == d && date.getMonth() == m && date.getFullYear() == y) {
            total += stringToNum(dh.tongtien);
        }
    }
    return total;
}

function capNhatHomeStats() {
    var now = new Date();
    var d = now.getDate(), m = now.getMonth(), y = now.getFullYear();

    // 1. Doanh thu hôm nay vs hôm qua
    var todayRevenue = getDoanhThuCuaNgay(d, m, y);
    var yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    var yesterdayRevenue = getDoanhThuCuaNgay(yesterdayDate.getDate(), yesterdayDate.getMonth(), yesterdayDate.getFullYear());
    var dailyGrowth = calculateGrowth(todayRevenue, yesterdayRevenue);

    // 2. Doanh thu tháng này vs tháng trước
    var thisMonth = getDoanhThuTheoThang(y).thang[m];
    var lastMonthDate = new Date(y, m - 1, 1);
    var lastMonth = getDoanhThuTheoThang(lastMonthDate.getFullYear()).thang[lastMonthDate.getMonth()];
    var monthlyGrowth = calculateGrowth(thisMonth, lastMonth);

    // 3. Đơn hàng mới
    var newOrders = getListDonHang().filter(dh => dh.tinhTrang === 'Chờ xử lý' || dh.tinhTrang === 'Đang chờ xử lý').length;

    // 4. Tin nhắn & Khách hàng
    var newMsgs = JSON.parse(localStorage.getItem('ListCustomerMessages') || '[]').filter(msg => msg.status === 'unread').length;
    var totalCust = getListUser().length;

    // Cập nhật DOM
    setStatValue('statNewOrders', newOrders);
    setStatValue('statRevenueToday', numToString(todayRevenue) + '₫', dailyGrowth);
    setStatValue('statRevenueMonth', numToString(thisMonth) + '₫', monthlyGrowth);
    setStatValue('statNewMessages', newMsgs);
    setStatValue('statTotalCustomers', totalCust);

    // Thêm biểu đồ Intelligence (Tỷ lệ hoàn thành/hủy)
    updatePerformanceRatios();
    updateStockAlerts();
    updateCRMDashboard();
    calculateOrderEfficiency();
    updateExecutiveChecklist();
}

/* START ADMIN AUTOMATION - TODAY CHECKLIST ENGINE */
function updateExecutiveChecklist() {
    const listPro = getListProducts();
    const listOrd = getListDonHang(true);
    const listMsg = JSON.parse(localStorage.getItem('ListCustomerMessages') || '[]');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);

    const container = document.getElementById('executiveChecklist');
    if (!container) return;

    // 1. Sản phẩm sắp hết (< 5)
    const lowStockItems = listPro.filter(p => p.soluong < 5).slice(0, 5);
    const lowStockHtml = lowStockItems.length ? lowStockItems.map(p => `
        <li class="check-item" onclick="openTab('Sản Phẩm'); document.getElementById('inputTimSanPham').value='${p.name}'; locSanPham();">
            <span>${p.name}</span> <b style="color:#f44336">${p.soluong}</b>
        </li>`).join('') : '<li class="check-empty">Tất cả sản phẩm đủ hàng.</li>';

    // 2. Sản phẩm bán chạy (7 ngày qua)
    const recentOrders = listOrd.filter(d => (d._ngayMuaTime || new Date(d.ma).getTime()) > sevenDaysAgo);
    let topSellers = {};
    recentOrders.forEach(o => {
        o.sp.forEach(item => {
            topSellers[item.sanPham.name] = (topSellers[item.sanPham.name] || 0) + item.soLuong;
        });
    });
    const sortedSellers = Object.keys(topSellers).sort((a,b) => topSellers[b] - topSellers[a]).slice(0, 3);
    const fastMovingHtml = sortedSellers.length ? sortedSellers.map(name => `
        <li class="check-item" onclick="openTab('Top Sản Phẩm');">
            <span>${name}</span> <b style="color:#4caf50">+${topSellers[name]}</b>
        </li>`).join('') : '<li class="check-empty">Chưa có đơn hàng tuần này.</li>';

    // 3. Khách cần gọi lại hôm nay
    const callbacks = listMsg.filter(m => m.callbackDate === todayStr);
    const callHtml = callbacks.length ? callbacks.map(m => `
        <li class="check-item" onclick="openMessageCRM('${m.id}')">
            <span>${m.name} (${m.phone})</span> <i class="fa fa-phone" style="color:#2196f3"></i>
        </li>`).join('') : '<li class="check-empty">Không có lịch hẹn hôm nay.</li>';

    // 4. Đơn hàng chưa xử lý (> 24h)
    const urgentOrders = listOrd.filter(d => (d.tinhTrang === 'Chờ xử lý' || d.tinhTrang === 'Đang chờ xử lý') && (now.getTime() - (d._ngayMuaTime || new Date(d.ma).getTime())) > 86400000).slice(0, 3);
    const urgentHtml = urgentOrders.length ? urgentOrders.map(d => `
        <li class="check-item" onclick="openTab('Đơn Hàng');">
            <span>Đơn #${d.ma.toString().slice(-4)} (${d.khach})</span> <i class="fa fa-warning" style="color:#ff9800"></i>
        </li>`).join('') : '<li class="check-empty">Mọi đơn hàng đều đúng tiến độ.</li>';

    container.innerHTML = `
        <div class="check-card low-stock">
            <div class="check-title"><i class="fa fa-shopping-basket"></i> Sản phẩm sắp hết</div>
            <ul class="check-list">${lowStockHtml}</ul>
        </div>
        <div class="check-card fast-moving">
            <div class="check-title"><i class="fa fa-fire"></i> Bán chạy 7 ngày</div>
            <ul class="check-list">${fastMovingHtml}</ul>
        </div>
        <div class="check-card crm-recall">
            <div class="check-title"><i class="fa fa-calendar-check-o"></i> Khách cần gọi/Hẹn</div>
            <ul class="check-list">${callHtml}</ul>
        </div>
        <div class="check-card urgent-order">
            <div class="check-title"><i class="fa fa-clock-o"></i> Đơn chưa xử lý > 24h</div>
            <ul class="check-list">${urgentHtml}</ul>
        </div>
    `;
}
/* END ADMIN AUTOMATION - TODAY CHECKLIST ENGINE */

/* START ADMIN BUSINESS INTELLIGENCE - PERFORMANCE ANALYTICS */
function calculateOrderEfficiency() {
    var list = getListDonHang();
    var processingTimes = [];
    var deliveryTimes = [];

    list.forEach(d => {
        // Cần lấy data từ u.donhang[j] gốc vì getListDonHang() đã format lại
        // Để đơn giản, ta tìm đơn trong ListUser
        var users = getListUser();
        var dh = null;
        for(var u of users) {
            dh = u.donhang.find(od => od.ngaymua == d.ma);
            if(dh) break;
        }
        if(!dh || !dh.timeline) return;

        var start = dh.timeline.find(t => t.status === 'Đặt hàng mới');
        var shipping = dh.timeline.find(t => t.status === 'Đang giao');
        var completed = dh.timeline.find(t => t.status === 'Hoàn thành' || t.status === 'Đã nhận hàng');

        if(start && shipping) {
            processingTimes.push((shipping.time - start.time) / (1000 * 60 * 60)); // hours
        }
        if(shipping && completed) {
            deliveryTimes.push((completed.time - shipping.time) / (1000 * 60 * 60)); // hours
        }
    });

    var avgProc = processingTimes.length ? (processingTimes.reduce((a,b)=>a+b,0) / processingTimes.length).toFixed(1) : 0;
    var avgDeliv = deliveryTimes.length ? (deliveryTimes.reduce((a,b)=>a+b,0) / deliveryTimes.length).toFixed(1) : 0;

    addChart('myChart4', createChartConfig(
        'Thời gian xử lý & Giao hàng trung bình (Giờ)', 
        'bar', 
        ['Xử lý (Duyệt)', 'Giao hàng (Vận chuyển)'], 
        [avgProc, avgDeliv],
        ['#2196f3', '#4caf50']
    ));
}
/* END ADMIN BUSINESS INTELLIGENCE - PERFORMANCE ANALYTICS */

function updateCRMDashboard() {
    const messages = JSON.parse(localStorage.getItem('ListCustomerMessages') || '[]');
    const now = new Date().toISOString().split('T')[0];
    const callbacksToday = messages.filter(m => m.callbackDate === now);

    const container = document.getElementById('dashboardCallbacks');
    if (!container) return;

    if (callbacksToday.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#9e9e9e; padding:20px;">Không có lịch gọi lại hôm nay.</p>';
        return;
    }

    var html = `<ul style="list-style:none; padding:10px;">`;
    callbacksToday.forEach(m => {
        html += `<li style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="color:var(--primary);">${m.name}</strong><br>
                <small>${m.phone} | NV: ${m.assignedStaff || 'Chưa gán'}</small>
            </div>
            <button onclick="openMessageCRM('${m.id}')" style="padding:5px 10px; font-size:11px; background:#e3f2fd; color:#1976d2; border:none; border-radius:4px; cursor:pointer;">Xử lý</button>
        </li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}

function updateStockAlerts() {
    var list = getListProducts();
    var lowStockItems = list.filter(p => (p.soluong || 0) < 5);
    
    // 1. Cập nhật Badge bên Sidebar (nếu có element)
    var badge = document.getElementById('lowStockBadge');
    if (badge) {
        if (lowStockItems.length > 0) {
            badge.textContent = lowStockItems.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    // 2. Vẽ bảng cảnh báo trên Dashboard (vào 1 vùng mới)
    var container = document.getElementById('dashboardCriticalStock');
    if (!container) return;

    if (lowStockItems.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#9e9e9e; padding:20px;">Kho hàng ổn định. Không có sản phẩm sắp hết.</p>';
        return;
    }

    var html = `<table class="table-outline" style="width:100%; font-size:13px;">
        <tr style="background:#fff5f5; color:#c62828;">
            <th>Sản phẩm</th>
            <th>Tồn kho</th>
            <th>Tình trạng</th>
        </tr>`;
    
    lowStockItems.slice(0, 5).forEach(p => {
        var sl = p.soluong || 0;
        var status = sl === 0 ? 'Hết hàng' : 'Sắp hết';
        html += `<tr>
            <td>${p.name}</td>
            <td style="font-weight:700; color:${sl === 0 ? '#f44336' : '#ff9800'}">${sl}</td>
            <td><span style="font-size:10px; padding:2px 6px; border-radius:10px; background:${sl === 0 ? '#ffebee' : '#fff3e0'}; color:${sl === 0 ? '#c62828' : '#ef6c00'}">${status}</span></td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
}
/* END ADMIN BUSINESS INTELLIGENCE - DASHBOARD LOGIC */

function setStatValue(id, value, growth = null) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = value;
    
    if (growth !== null) {
        var card = el.parentElement;
        var existingBadge = card.querySelector('.growth-badge');
        if (existingBadge) existingBadge.remove();
        
        var icon = growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        var color = growth >= 0 ? '#4caf50' : '#f44336';
        var badge = `<div class="growth-badge" style="color:${color}; font-size:12px; font-weight:700; margin-top:5px;">
            <i class="fa ${icon}"></i> ${Math.abs(growth).toFixed(1)}%
        </div>`;
        el.insertAdjacentHTML('afterend', badge);
    }
}

function updatePerformanceRatios() {
    var list = getListDonHang();
    var success = list.filter(d => d.tinhTrang === 'Đã nhận hàng' || d.tinhTrang === 'Hoàn thành').length;
    var cancel = list.filter(d => d.tinhTrang === 'Đã hủy').length;

    addChart('myChart3', createChartConfig(
        'Hiệu suất đơn hàng (Tỷ lệ Hoàn thành/Hủy)', 
        'pie', 
        ['Hoàn thành', 'Đã hủy', 'Khác'], 
        [success, cancel, list.length - success - cancel],
        ['#4caf50', '#f44336', '#fb8c00']
    ));
}
/* END ADMIN BUSINESS INTELLIGENCE - DASHBOARD LOGIC */

function getListDonHang(traVeDanhSachSanPham = false) {
    var u = getListUser();
    var result = [];
    for(var i = 0; i < u.length; i++) {
        for(var j = 0; j < u[i].donhang.length; j++) {
            // Tổng tiền (đơn giá * số lượng)
            var tongtien = 0;
            for(var s of u[i].donhang[j].sp) {
                var timsp = timKiemTheoMa(list_products, s.ma);
                if (!timsp) continue;
                var donGia = (timsp.promo && timsp.promo.name == 'giareonline') ? stringToNum(timsp.promo.value) : stringToNum(timsp.price);
                tongtien += donGia * (s.soluong || 1);
            }

            // Ngày giờ
            var x = new Date(u[i].donhang[j].ngaymua).toLocaleString();

            // Các sản phẩm - dạng html
            var sps = '';
            for(var s of u[i].donhang[j].sp) {
                var p = timKiemTheoMa(list_products, s.ma);
                if (p) sps += `<p style="text-align: right">`+(p.name + ' [' + s.soluong + ']') + `</p>`;
            }

            // Các sản phẩm - dạng mảng
            var danhSachSanPham = [];
            for(var s of u[i].donhang[j].sp) {
                var p = timKiemTheoMa(list_products, s.ma);
                if (p) danhSachSanPham.push({ sanPham: p, soLuong: s.soluong });
            }

            var tt = u[i].donhang[j].thongTinGiaoHang || {};
            var ngayMua = u[i].donhang[j].ngaymua;
            var ngayMuaTime = (ngayMua instanceof Date) ? ngayMua.getTime() : (new Date(ngayMua)).getTime();
            result.push({
                "ma": ngayMua.toString(),
                "khach": u[i].username,
                "hoTen": tt.hoTen || '',
                "sdt": tt.sdt || '',
                "diaChi": tt.diaChi || '',
                "sp": traVeDanhSachSanPham ? danhSachSanPham : sps,
                "tongtien": numToString(tongtien),
                "ngaygio": x,
                "tinhTrang": u[i].donhang[j].tinhTrang,
                "_ngayMuaTime": ngayMuaTime
            });
        }
    }
    // Sắp xếp đúng thứ tự: mới nhất trước (theo ngày giờ đặt hàng)
    result.sort(function (a, b) {
        return (b._ngayMuaTime || 0) - (a._ngayMuaTime || 0);
    });
    return result;
}

// Xác nhận đơn (bước 1): Chờ → Đang đi giao (hoặc Đã nhận tiền - Đang giao hàng với CK). Không quay lại.
/* START ADMIN PRODUCTION - ORDER TIMELINE LOGIC */
function recordOrderEvent(order, status) {
    if (!order.timeline) {
        order.timeline = [];
        // Ghi lại mốc khởi tạo nếu chưa có
        order.timeline.push({
            status: 'Đặt hàng mới',
            time: new Date(order.ngaymua).getTime(),
            note: 'Khách hàng đã đặt đơn thành công'
        });
    }
    order.timeline.push({
        status: status,
        time: new Date().getTime(),
        note: 'Cập nhật bởi Admin'
    });
}

// Xác nhận đơn (bước 1): Chờ → Đang giao.
function duyet(maDonHang, duyetDon) {
    var u = getListUser();
    for (var i = 0; i < u.length; i++) {
        for (var j = 0; j < u[i].donhang.length; j++) {
            if (u[i].donhang[j].ngaymua != maDonHang) continue;
            var dh = u[i].donhang[j];

            if (duyetDon) {
                if (dh.tinhTrang === 'Đã hủy' || dh.tinhTrang === 'Hoàn thành') {
                    alert('Không thể duyệt đơn đã kết thúc.');
                    return;
                }
                
                dh.tinhTrang = 'Đang giao';
                recordOrderEvent(dh, 'Đang giao');
            } else {
                if (dh.tinhTrang === 'Đang giao' || dh.tinhTrang === 'Hoàn thành') {
                    alert('Đơn đã xử lý, không thể hủy.');
                    return;
                }
                if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
                dh.tinhTrang = 'Đã hủy';
                recordOrderEvent(dh, 'Đã hủy');
            }
            if (typeof updateListOrderStatus === 'function') updateListOrderStatus(dh.ngaymua, dh.tinhTrang);
            setListUser(u);
            addTableDonHang();
            return;
        }
    }
}

// Xác nhận đã giao (bước 2): Đang giao → Hoàn thành.
function xacNhanDaGiaoHang(maDonHang) {
    var u = getListUser();
    for (var i = 0; i < u.length; i++) {
        for (var j = 0; j < u[i].donhang.length; j++) {
            if (u[i].donhang[j].ngaymua != maDonHang) continue;
            var dh = u[i].donhang[j];
            if (dh.tinhTrang !== 'Đang giao') {
                alert('Chỉ xác nhận hoàn thành khi đơn đang ở trạng thái Đang giao.');
                return;
            }
            dh.tinhTrang = 'Hoàn thành';
            recordOrderEvent(dh, 'Hoàn thành');
            if (typeof updateListOrderStatus === 'function') updateListOrderStatus(dh.ngaymua, dh.tinhTrang);
            setListUser(u);
            addTableDonHang();
            return;
        }
    }
}
/* END ADMIN PRODUCTION - ORDER TIMELINE LOGIC */

/* START ADMIN PRODUCTION - ORDER VISUAL TIMELINE */
function renderOrderTimeline(timeline) {
    if (!timeline || timeline.length === 0) return '<p style="color:#999; font-size:12px; padding:10px; text-align:center;">Chưa có lịch sử trạng thái.</p>';
    var html = '<div class="order-timeline" style="margin-top:20px; padding:15px; border-left: 2px solid #eee; margin-left: 20px;">';
    timeline.forEach((item, index) => {
        var isLast = index === timeline.length - 1;
        html += `
            <div class="timeline-item" style="position:relative; margin-bottom:20px;">
                <div class="timeline-dot" style="position:absolute; left:-22px; top:2px; width:12px; height:12px; border-radius:50%; background:${isLast ? '#4caf50' : '#2196f3'}; border: 2px solid #fff; box-shadow: 0 0 0 2px ${isLast ? '#4caf50' : '#2196f3'};"></div>
                <div class="timeline-info">
                    <div style="font-size:14px; font-weight:700; color:${isLast ? '#2e7d32' : '#1565c0'}">${item.status}</div>
                    <div style="font-size:11px; color:#999; margin-bottom:4px;">${new Date(item.time).toLocaleString()}</div>
                    <div style="font-size:12px; color:#666; font-style:italic;">${item.note || ''}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function xemChiTietDonHang(maDonHang) {
    var users = getListUser();
    var donHang = null;
    var username = '';

    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (!u.donhang) continue;
        for (var j = 0; j < u.donhang.length; j++) {
            if (u.donhang[j].ngaymua == maDonHang) {
                donHang = u.donhang[j];
                username = u.username;
                break;
            }
        }
        if (donHang) break;
    }

    if (!donHang) {
        alert('Không tìm thấy đơn hàng.');
        return;
    }

    var tt = donHang.thongTinGiaoHang || {};
    var ttThanhToan = donHang.thanhToan || {};

    var s = `<span class="close" onclick="this.parentElement.style.transform='scale(0)'">&times;</span>
    <div style="padding:20px; max-height:85vh; overflow-y:auto; font-family: sans-serif;">
        <h2 style="margin-bottom:20px; color:var(--primary); text-align:center;">CHI TIẾT ĐƠN HÀNG</h2>
        
        <table class="table-outline" style="width:100%; border-collapse:collapse;">
            <tr style="background:#f4f4f4;"><th colspan="2" style="padding:10px; text-align:left;">Thông tin khách hàng</th></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee; width:40%;">Mã đơn:</td><td style="padding:8px; border-bottom:1px solid #eee;"><strong>`+ maDonHang +`</strong></td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;">Tài khoản:</td><td style="padding:8px; border-bottom:1px solid #eee;">`+ username +`</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;">Người nhận:</td><td style="padding:8px; border-bottom:1px solid #eee;">`+ (tt.hoTen || 'N/A') +`</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;">SĐT:</td><td style="padding:8px; border-bottom:1px solid #eee;">`+ (tt.sdt || 'N/A') +`</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;">Địa chỉ:</td><td style="padding:8px; border-bottom:1px solid #eee;">`+ (tt.diaChi || 'N/A') +`</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #eee;">Ghi chú:</td><td style="padding:8px; border-bottom:1px solid #eee;">`+ (donHang.ghiChu || 'Không có') +`</td></tr>
        </table>

        <table class="table-outline" style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr style="background:#f4f4f4;"><th colspan="2" style="padding:10px; text-align:left;">Sản phẩm đã đặt</th></tr>
            <tr>
                <td colspan="2" style="padding:10px;">`+ (function(){
                    var html = '';
                    for(var s of donHang.sp) {
                        var p = timKiemTheoMa(list_products, s.ma);
                        if (p) {
                            html += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f9f9f9;">
                                <span>${p.name} <small style="color:#666">x${s.soluong}</small></span>
                                <span style="font-weight:600;">${numToString(stringToNum(p.price) * s.soluong)}₫</span>
                            </div>`;
                        }
                    }
                    return html;
                })() +`</td>
            </tr>
            <tr>
                <td style="padding:8px;"><strong>HÌNH THỨC:</strong></td>
                <td style="padding:8px;">`+ (ttThanhToan.phuongThucThanhToan || 'COD') +`</td>
            </tr>
            <tr style="background:#fff9f9; font-size:18px;">
                <td style="padding:10px;"><strong>TỔNG TIỀN:</strong></td>
                <td style="padding:10px; color:#e53935; font-weight:700;">`+ getTongTienDonHang(donHang) +`₫</td>
            </tr>
        </table>

        <div style="margin-top:25px;">
            <h4 style="border-bottom:2px solid var(--primary); padding-bottom:5px; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                <i class="fa fa-truck"></i> TIMELINE ĐƠN HÀNG
            </h4>
            `+ renderOrderTimeline(donHang.timeline) +`
        </div>

        <button onclick="this.parentElement.parentElement.style.transform='scale(0)'" style="width:100%; margin-top:30px; padding:12px; background:#666; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer; transition: 0.2s;">ĐÓNG</button>
    </div>`;

    var khung = document.getElementById('khungChiTietDonHang');
    khung.innerHTML = s;
    khung.style.transform = 'scale(1)';
}

function getTongTienDonHang(dh) {
    var total = 0;
    for(var s of dh.sp) {
        var p = timKiemTheoMa(list_products, s.ma);
        if (p) total += stringToNum(p.price) * s.soluong;
    }
    return numToString(total);
}

function locDonHangTheoKhoangNgay() {
    var from = document.getElementById('fromDate').valueAsDate;
    var to = document.getElementById('toDate').valueAsDate;
    if (!from || !to) return;
    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    var sel = document.getElementById('filterTrangThaiDon');
    var status = sel ? sel.value.trim() : '';
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[7].innerHTML;  // cột Ngày giờ
        var d = new Date(td);
        var okDate = !isNaN(d.getTime()) && d >= from && d <= to;
        var tdTT = tr.getElementsByTagName('td')[8];  // cột Trạng thái
        var trangThai = tdTT ? (tdTT.textContent || tdTT.innerText || '').trim() : '';
        var okStatus = !status || trangThai === status;
        tr.style.display = (okDate && okStatus) ? '' : 'none';
    }
}

function locDonHangTheoTrangThai() {
    var sel = document.getElementById('filterTrangThaiDon');
    var status = sel ? sel.value.trim() : '';
    var from = document.getElementById('fromDate').valueAsDate;
    var to = document.getElementById('toDate').valueAsDate;
    var hasDate = from && to;
    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var tdTT = tr.getElementsByTagName('td')[8];  // cột Trạng thái
        var trangThai = tdTT ? (tdTT.textContent || tdTT.innerText || '').trim() : '';
        var okStatus = !status || trangThai === status;
        var okDate = true;
        if (hasDate) {
            var td = tr.getElementsByTagName('td')[7].innerHTML;  // cột Ngày giờ
            var d = new Date(td);
            okDate = !isNaN(d.getTime()) && d >= from && d <= to;
        }
        tr.style.display = (okStatus && okDate) ? '' : 'none';
    }
}

function timKiemDonHang(inp) {
    var kieuTim = document.getElementsByName('kieuTimDonHang')[0].value;
    var text = (inp.value || '').toLowerCase();

    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var cellText = '';
        if (kieuTim === 'ma') {
            cellText = (tr.getAttribute('data-ma') || '').toLowerCase();
        } else {
            var vitri = (kieuTim === 'khachhang') ? 1 : 8;  // Khách = cột 1, Trạng thái = cột 8
            var td = tr.getElementsByTagName('td')[vitri];
            cellText = td ? (td.textContent || td.innerText || '').toLowerCase() : '';
        }
        tr.style.display = cellText.indexOf(text) < 0 ? 'none' : '';
    }
}

// Sắp xếp
function sortDonHangTable(loai) {
    var list = document.getElementsByClassName('donhang')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_DonHang); 
    decrease = !decrease;
}

// Cột: 0 Stt, 1 Khách, 2 Họ tên, 3 SĐT, 4 Địa chỉ, 5 SP, 6 Tổng tiền, 7 Ngày giờ, 8 Trạng thái, 9 Hành động (mã đơn lưu trong data-ma)
function getValueOfTypeInTable_DonHang(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt': return Number(td[0].innerHTML);
        case 'ma' :
        case 'madon' : var ma = tr.getAttribute('data-ma'); return ma ? new Date(ma).getTime() : 0;
        case 'khach' : return td[1].innerHTML.toLowerCase();
        case 'sanpham' : return (td[5].children && td[5].children.length) ? td[5].children.length : 0;
        case 'tongtien' : return stringToNum(td[6].innerHTML);
        case 'ngaygio' : return new Date(td[7].innerHTML).getTime();
        case 'trangthai': return td[8].innerHTML.toLowerCase();
    }
    return false;
}

// ====================== Khách Hàng =============================
// Vẽ bảng
/* START ADMIN PRODUCTION - CUSTOMER CRM LOGIC */
// Phân loại khách hàng tự động
function getUserClassification(u) {
    if (!u.donhang || u.donhang.length === 0) return { text: 'Khách mới', color: '#9e9e9e' };
    if (u.donhang.length >= 3) return { text: 'Thân thiết', color: '#ff9800' };
    return { text: 'Đã mua hàng', color: '#4caf50' };
}

// Vẽ bảng khách hàng chuẩn CRM
function addTableKhachHang(list = getListUser()) {
    var tc = document.getElementsByClassName('khachhang')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline">`;

    for (var i = 0; i < list.length; i++) {
        var u = list[i];
        var cls = getUserClassification(u);

        s += `<tr>
            <td data-label="STT" style="width: 5%">` + (i+1) + `</td>
            <td data-label="Khách hàng" style="width: 15%">
                <strong>` + u.ho + ' ' + u.ten + `</strong><br>
                <span style="background:${cls.color}; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:600;">${cls.text}</span>
            </td>
            <td data-label="Email" style="width: 15%">` + u.email + `</td>
            <td data-label="Tài khoản" style="width: 10%">` + u.username + `</td>
            <td data-label="Nguồn" style="width: 15%">
                <span style="font-size:11px; color:#666;">${u.leadSource || 'Website'}</span>
            </td>
            <td data-label="Hành động" style="width: 25%">
                <div class="tooltip">
                    <i class="fa fa-history" onclick="xemLichSuMuaHang('`+u.username+`')" style="color:var(--primary); cursor:pointer;"></i>
                    <span class="tooltiptext">Lịch sử mua</span>
                </div>
                <div class="tooltip">
                    <label class="switch">
                        <input type="checkbox" `+(u.off?'':'checked')+` onclick="voHieuHoaNguoiDung(this, '`+u.username+`')">
                        <span class="slider round"></span>
                    </label>
                    <span class="tooltiptext">`+(u.off?'Mở':'Khóa')+`</span>
                </div>
                <div class="tooltip">
                    <i class="fa fa-remove" onclick="xoaNguoiDung('`+u.username+`')" style="color:#f44336; cursor:pointer;"></i>
                    <span class="tooltiptext">Xóa</span>
                </div>
            </td>
        </tr>`;
    }

    s += `</table>`;
    tc.innerHTML = s;
}

// Tìm kiếm người dùng chuẩn (Search name, email or username)
function timKiemNguoiDung(inp) {
    var text = inp.value.toLowerCase();
    var listUser = getListUser();
    var result = listUser.filter(u => {
        return (u.ho + ' ' + u.ten).toLowerCase().indexOf(text) >= 0 || 
               u.email.toLowerCase().indexOf(text) >= 0 || 
               u.username.toLowerCase().indexOf(text) >= 0;
    });
    addTableKhachHang(result);
}

// Xem lịch sử mua hàng chi tiết của 1 user
function xemLichSuMuaHang(username) {
    var allOrders = getListDonHang(true);
    var userOrders = allOrders.filter(d => d.khach === username);
    
    var html = `<div style="padding:20px;">
        <h3>Lịch sử mua hàng của: <span style="color:var(--primary)">${username}</span></h3>`;
    
    if (userOrders.length === 0) {
        html += '<p style="text-align:center; padding:20px;">Khách hàng này chưa có đơn hàng nào.</p>';
    } else {
        html += `<table class="table-outline">
            <thead>
                <tr>
                    <th>Ngày mua</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>`;
        userOrders.forEach(d => {
            html += `<tr>
                <td style="font-size:12px;">${d.ngaygio}</td>
                <td style="font-size:12px;">${renderOrderProducts(d.sp)}</td>
                <td style="font-size:12px; font-weight:600;">${d.tongtien}</td>
                <td style="font-size:11px; font-weight:600;">${d.tinhTrang}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }
    html += `<button onclick="this.parentElement.parentElement.style.transform='scale(0)'" style="margin-top:20px; width:100%; padding:10px; background:#666; color:#fff; border:none; cursor:pointer;">ĐÓNG</button></div>`;
    
    var modal = document.getElementById('khungChiTietKhachHang'); // Reuse or create
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'khungChiTietKhachHang';
        modal.className = 'overlay';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `<div style="background:#fff; width:90%; max-width:600px; margin:50px auto; border-radius:8px; overflow:hidden; position:relative;">${html}</div>`;
    modal.style.transform = 'scale(1)';
}

function renderOrderProducts(spList) {
    if (Array.isArray(spList)) {
        return spList.map(s => `${s.sanPham.name} [${s.soLuong}]`).join('<br>');
    }
    return spList;
}
/* END ADMIN PRODUCTION - CUSTOMER CRM LOGIC */

function openThemNguoiDung() {
    document.getElementById('newUserHo').value = '';
    document.getElementById('newUserTen').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserPass').value = '';
    document.getElementById('khungThemNguoiDung').style.transform = 'scale(1)';
}

function dongThemNguoiDung() {
    document.getElementById('khungThemNguoiDung').style.transform = 'scale(0)';
}

function themNguoiDungAdmin() {
    var ho = (document.getElementById('newUserHo').value || '').trim();
    var ten = (document.getElementById('newUserTen').value || '').trim();
    var email = (document.getElementById('newUserEmail').value || '').trim();
    var username = (document.getElementById('newUserUsername').value || '').trim();
    var pass = (document.getElementById('newUserPass').value || '').trim();
    if (!username || username.length < 3) {
        alert('Tên đăng nhập cần ít nhất 3 ký tự.');
        return;
    }
    if (!pass || pass.length < 6) {
        alert('Mật khẩu cần ít nhất 6 ký tự.');
        return;
    }
    if (!email) {
        alert('Vui lòng nhập Email.');
        return;
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
        alert('Email không đúng định dạng.');
        return;
    }
    var listUser = getListUser();
    for (var i = 0; i < listUser.length; i++) {
        if (listUser[i].username === username) {
            alert('Tên đăng nhập đã tồn tại.');
            return;
        }
    }
    for (var j = 0; j < adminInfo.length; j++) {
        if (adminInfo[j].username === username) {
            alert('Tên đăng nhập trùng với tài khoản admin.');
            return;
        }
    }
    var newUser = new User(username, pass, ho, ten, email, [], []);
    listUser.push(newUser);
    setListUser(listUser);
    addTableKhachHang();
    dongThemNguoiDung();
    alert('Đã thêm khách hàng "' + username + '" thành công.');
}

// vô hiệu hóa người dùng (tạm dừng, không cho đăng nhập vào)
function voHieuHoaNguoiDung(inp, taikhoan) {
    var listUser = getListUser();
    for(var u of listUser) {
        if(u.username == taikhoan) {
            let value = !inp.checked
            u.off = value;
            setListUser(listUser);
            
            setTimeout(() => alert(`${value ? 'Khoá' : 'Mở khoá'} tải khoản ${u.username} thành công.`), 500);
            break;
        }
    }
    var span = inp.parentElement.nextElementSibling;
        span.innerHTML = (inp.checked?'Khóa':'Mở');
}

// Xóa người dùng
function xoaNguoiDung(taikhoan) {
    if(window.confirm('Xác nhận xóa '+taikhoan+'? \nMọi dữ liệu về '+taikhoan+' sẽ mất! Bao gồm cả những đơn hàng của '+taikhoan)) {
        var listuser = getListUser();
        for(var i = 0; i < listuser.length; i++) {
            if(listuser[i].username == taikhoan) {
                listuser.splice(i, 1); // xóa
                setListUser(listuser); // lưu thay đổi
                localStorage.removeItem('CurrentUser'); // đăng xuất khỏi tài khoản hiện tại (current user)
                addTableKhachHang(); // vẽ lại bảng khách hàng
                addTableDonHang(); // vẽ lại bảng đơn hàng
                return;
            }
        }
    }
}

// Sắp xếp
function sortKhachHangTable(loai) {
    var list = document.getElementsByClassName('khachhang')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_KhachHang); 
    decrease = !decrease;
}

function getValueOfTypeInTable_KhachHang(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt': return Number(td[0].innerHTML);
        case 'hoten' : return td[1].innerHTML.toLowerCase();
        case 'email' : return td[2].innerHTML.toLowerCase();
        case 'taikhoan' : return td[3].innerHTML.toLowerCase();    
        case 'matkhau' : return td[4].innerHTML.toLowerCase(); 
    }
    return false;
}

// ================== Sort ====================
// https://github.com/HoangTran0410/First_html_css_js/blob/master/sketch.js
var decrease = true; // Sắp xếp giảm dần

// loại là tên cột, func là hàm giúp lấy giá trị từ cột loai
function quickSort(arr, left, right, loai, func) {
    var pivot,
        partitionIndex;

    if (left < right) {
        pivot = right;
        partitionIndex = partition(arr, pivot, left, right, loai, func);

        //sort left and right
        quickSort(arr, left, partitionIndex - 1, loai, func);
        quickSort(arr, partitionIndex + 1, right, loai, func);
    }
    return arr;
}

function partition(arr, pivot, left, right, loai, func) {
    var pivotValue =  func(arr[pivot], loai),
        partitionIndex = left;
    
    for (var i = left; i < right; i++) {
        if (decrease && func(arr[i], loai) > pivotValue
        || !decrease && func(arr[i], loai) < pivotValue) {
            swap(arr, i, partitionIndex);
            partitionIndex++;
        }
    }
    swap(arr, right, partitionIndex);
    return partitionIndex;
}

function swap(arr, i, j) {
    var tempi = arr[i].cloneNode(true);
    var tempj = arr[j].cloneNode(true);
    arr[i].parentNode.replaceChild(tempj, arr[i]);
    arr[j].parentNode.replaceChild(tempi, arr[j]);
}

// ================= các hàm thêm ====================
// Chuyển khuyến mãi vễ dạng chuỗi tiếng việt
function promoToStringValue(pr) {
    switch (pr.name) {
        case 'tragop':
            return 'Góp ' + pr.value + '%';
        case 'giamgia':
            return 'Giảm ' + pr.value;
        case 'giareonline':
            return 'Online (' + pr.value + ')';
        case 'moiramat':
            return 'Mới';
    }
    return '';
}

function progress(percent, bg, width, height) {

    return `<div class="progress" style="width: ` + width + `; height:` + height + `">
                <div class="progress-bar bg-info" style="width: ` + percent + `%; background-color:` + bg + `"></div>
            </div>`
}

/* END HIGH PRIORITY IMPLEMENT - ADMIN MESSAGES LOGIC */

/* START ADMIN COMMERCIAL AUDIT - DATA MANAGEMENT & DEMO */
function saoLuuDuLieu() {
    showLoading('Đang chuẩn bị bản sao lưu...');
    setTimeout(() => {
        const backupKeys = [
            'ListProducts', 'AdminInfo', 'ListUser', 'ListCustomerMessages', 
            'ListBanners', 'ListProductGroups', 'admin', 'AdminPasswordChanged'
        ];
        let data = {};
        backupKeys.forEach(key => {
            data[key] = localStorage.getItem(key);
        });

        const dataStr = JSON.stringify(data, null, 4);
        const date = new Date().toISOString().split('T')[0];
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `quanlan_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        hideLoading();
        addAlertBox('Sao lưu dữ liệu thành công!', '#4caf50', '#fff', 3000);
    }, 400);
}

function khoiPhucDuLieu(input) {
    const file = input.files[0];
    if (!file) return;

    if (!confirm('HÀNH ĐỘNG NÀY SẼ XÓA SẠCH DỮ LIỆU HIỆN TẠI. Bạn có chắc chắn muốn tiếp tục không?')) {
        input.value = '';
        return;
    }
    
    if (!confirm('XÁC NHẬN LẦN CUỐI: Toàn bộ đơn hàng và khách hàng hiện tại sẽ bị thay thế bằng bản sao lưu này. Đồng ý?')) {
        input.value = '';
        return;
    }

    showLoading('Đang khôi phục dữ liệu...');
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            Object.keys(data).forEach(key => {
                if (data[key] !== null) {
                    localStorage.setItem(key, data[key]);
                }
            });
            setTimeout(() => {
                hideLoading();
                addAlertBox('Khôi phục thành công! Trang sẽ tải lại...', '#4caf50', '#fff', 3000);
                setTimeout(() => location.reload(), 1200);
            }, 600);
        } catch (err) {
            hideLoading();
            addAlertBox('Lỗi: File sao lưu không hợp lệ!', '#f44336', '#fff', 3000);
        }
    };
    reader.readAsText(file);
}

function loadDemoData() {
    if (!confirm('Website sẽ nạp thêm các đơn hàng và tin nhắn mẫu để bạn dễ hình dung cách hoạt động. Tiếp tục?')) return;
    
    showLoading('Đang nạp dữ liệu mẫu...');
    setTimeout(() => {
        // Sample Messages
        let msgs = getListCustomerMessages();
        const demoMsgs = [
            { id: Date.now() + 1, name: "Nguyễn Văn Demo", phone: "0987654321", email: "demo@gmail.com", content: "Tôi cần tư vấn iPhone 15 Pro Max màu Titan.", date: new Date().toLocaleDateString(), status: "Đang đợi", isDemo: true },
            { id: Date.now() + 2, name: "Trần Thị Mẫu", phone: "0123456789", email: "mau@gmail.com", content: "Shop có sẵn pin dự phòng MagSafe không?", date: new Date().toLocaleDateString(), status: "Đã xong", isDemo: true }
        ];
        msgs = msgs.concat(demoMsgs);
        setListCustomerMessages(msgs);

        // Sample Orders
        let users = getListUser();
        let demoUser = users.find(u => u.username === 'demo_user');
        if (!demoUser) {
            demoUser = { username: 'demo_user', ho: 'Khách', ten: 'Demo', sdt: '09000000', email: 'demo@quanlan.vn', pass: 'demo123', donhang: [] };
            users.push(demoUser);
        }

        const demoOrder = {
            ma: Date.now(), khach: 'demo_user', hoTen: 'Khách Demo', sdt: '09000000', diaChi: '123 Đường Mẫu, TP.HCM',
            sp: [{ sanPham: list_products[0], soLuong: 1 }],
            tongtien: list_products[0].price, ngaygio: new Date().toLocaleString(), tinhTrang: 'Chờ duyệt', isDemo: true
        };
        demoUser.donhang.push(demoOrder);
        setListUser(users);

        hideLoading();
        addAlertBox('Đã nạp dữ liệu Demo thành công!', '#4caf50', '#fff', 2000);
        setTimeout(() => location.reload(), 800);
    }, 500);
}

function clearDemoData() {
    if (!confirm('Hệ thống sẽ xóa TẤT CẢ dữ liệu có gắn nhãn Demo. Dữ liệu thật của bạn vẫn được giữ lại. Xóa?')) return;
    
    showLoading('Đang dọn dẹp dữ liệu mẫu...');
    setTimeout(() => {
        // Clear Messages
        let msgs = getListCustomerMessages().filter(m => !m.isDemo);
        setListCustomerMessages(msgs);

        // Clear Orders from all users
        let users = getListUser();
        users.forEach(u => {
            if (u.donhang) u.donhang = u.donhang.filter(dh => !dh.isDemo);
        });
        setListUser(users);

        hideLoading();
        addAlertBox('Đã dọn dẹp dữ liệu Demo!', '#4caf50', '#fff', 2000);
        setTimeout(() => location.reload(), 800);
    }, 500);
}
/* END ADMIN COMMERCIAL AUDIT - DATA MANAGEMENT & DEMO */

// for(var i = 0; i < list_products.length; i++) {

//     list_products[i].masp = list_products[i].company.substring(0, 3) + vitriCompany(list_products[i], i);
// }

/* START ADMIN BUSINESS INTELLIGENCE - ADVANCED REPORTING */
function exportFilteredOrdersToCSV() {
    var from = document.getElementById('fromDate').valueAsDate;
    var to = document.getElementById('toDate').valueAsDate;
    
    let list = getListDonHang(true);
    if (from && to) {
        list = list.filter(d => {
            var date = new Date(d.ma);
            return !isNaN(date.getTime()) && date >= from && date <= to;
        });
    }

    if (list.length === 0) {
        addAlertBox('Không có dữ liệu trong khoảng ngày chọn!', '#ff9800', '#fff', 2000);
        return;
    }

    const formattedData = list.map(d => ({
        ma: d.ma,
        khach: d.khach,
        hoTen: d.hoTen,
        sdt: d.sdt,
        diaChi: d.diaChi,
        sp: (Array.isArray(d.sp) ? d.sp.map(s => `${s.sanPham.name} (x${s.soLuong})`).join('; ') : d.sp),
        tongtien: d.tongtien,
        ngaygio: d.ngaygio,
        tinhTrang: d.tinhTrang
    }));

    const headers = ['ma', 'khach', 'hoTen', 'sdt', 'diaChi', 'sp', 'tongtien', 'ngaygio', 'tinhTrang'];
    const labels = ['Mã đơn', 'Username', 'Họ tên', 'SĐT', 'Địa chỉ', 'Sản phẩm', 'Tổng tiền', 'Ngày giờ', 'Trạng thái'];
    exportToCSV('Bao_Cao_DonHang_Loc', formattedData, headers, labels);
}

function exportLoyaltyReportToCSV() {
    const users = getListUser();
    const list = users.map(u => {
        var totalSpent = (u.donhang || []).reduce((acc, dh) => {
            if (dh.tinhTrang === 'Đã nhận hàng' || dh.tinhTrang === 'Hoàn thành') {
                return acc + stringToNum(getTongTienDonHang(dh));
            }
            return acc;
        }, 0);

        return {
            username: u.username,
            name: (u.ho + ' ' + u.ten),
            ordersCount: (u.donhang || []).filter(dh => dh.tinhTrang !== 'Đã hủy').length,
            totalSpent: totalSpent,
            classification: getUserClassification(u).text
        };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    const headers = ['username', 'name', 'ordersCount', 'totalSpent', 'classification'];
    const labels = ['Tài khoản', 'Họ tên', 'Số đơn đã đặt', 'Tổng chi tiêu (₫)', 'Hạng khách hàng'];
    exportToCSV('Bao_Cao_Khach_Hang_Than_Thiet', list, headers, labels);
}

function exportBrandPerformanceToCSV() {
    var listAll = getListDonHang(true);
    var thongKeHang = {};
    listAll.forEach(function(donHang) {
        if (donHang.tinhTrang !== 'Đã nhận hàng' && donHang.tinhTrang !== 'Hoàn thành') return;
        donHang.sp.forEach(function(item) {
            var p = item.sanPham;
            if (!p) return;
            var donGia = (p.promo && p.promo.name === 'giareonline') ? stringToNum(p.promo.value) : stringToNum(p.price);
            var tenHang = p.company || 'Khác';
            if (!thongKeHang[tenHang]) thongKeHang[tenHang] = { sales: 0, revenue: 0 };
            thongKeHang[tenHang].sales += item.soLuong;
            thongKeHang[tenHang].revenue += item.soLuong * donGia;
        });
    });

    const data = Object.keys(thongKeHang).map(h => ({
        brand: h,
        sales: thongKeHang[h].sales,
        revenue: thongKeHang[h].revenue
    })).sort((a, b) => b.revenue - a.revenue);

    const headers = ['brand', 'sales', 'revenue'];
    const labels = ['Hãng sản xuất', 'Số lượng đã bán', 'Doanh thu tổng (₫)'];
    exportToCSV('Bao_Cao_Hieu_Suat_Hang', data, headers, labels);
}
/* END ADMIN BUSINESS INTELLIGENCE - ADVANCED REPORTING */

/* START ADMIN PRODUCTION - CSV EXPORT MODULE */
function exportToCSV(filename, data, headers, headerLabels) {
    const csvRows = [];
    // Thống nhất headerLabels hoặc headers
    csvRows.push(headerLabels.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header] === undefined || row[header] === null ? '' : row[header];
            const escaped = ('' + val).replace(/"/g, '""'); // Excel escape double quotes
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // UTF-8 BOM to fix Vietnamese display in Excel
    const BOM = '\uFEFF';
    const csvString = BOM + csvRows.join('\r\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const timestamp = new Date().toLocaleString('vi-VN').replace(/[/:]/g, '-').replace(/, /g, '_');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${timestamp}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportProductsToCSV() {
    const list = getListProducts();
    const headers = ['masp', 'name', 'company', 'price', 'soluong', 'star', 'rateCount'];
    const labels = ['Mã sản phẩm', 'Tên sản phẩm', 'Hãng', 'Giá (Chuỗi)', 'Số lượng', 'Số sao', 'Số đánh giá'];
    exportToCSV('Danh_Sach_SanPham', list, headers, labels);
}

function exportOrdersToCSV() {
    const list = getListDonHang(true); // Lấy cả list sản phẩm
    const formattedData = list.map(d => {
        return {
            ma: d.ma,
            khach: d.khach,
            hoTen: d.hoTen,
            sdt: d.sdt,
            diaChi: d.diaChi,
            sp: (Array.isArray(d.sp) ? d.sp.map(s => `${s.sanPham.name} (x${s.soLuong})`).join('; ') : d.sp),
            tongtien: d.tongtien,
            ngaygio: d.ngaygio,
            tinhTrang: d.tinhTrang
        };
    });
    const headers = ['ma', 'khach', 'hoTen', 'sdt', 'diaChi', 'sp', 'tongtien', 'ngaygio', 'tinhTrang'];
    const labels = ['Mã đơn (Ngày mua)', 'Username', 'Họ tên người nhận', 'Số điện thoại', 'Địa chỉ', 'Sản phẩm', 'Tổng tiền', 'Ngày giờ', 'Trạng thái'];
    exportToCSV('Danh_Sach_DonHang', formattedData, headers, labels);
}

function exportCustomersToCSV() {
    const list = getListUser();
    const formattedData = list.map(u => {
        const cls = getUserClassification(u);
        return {
            username: u.username,
            hoTen: u.ho + ' ' + u.ten,
            email: u.email,
            pass: u.pass,
            status: u.off ? 'Bị khoá' : 'Hoạt động',
            phanLoai: cls.text,
            soDon: u.donhang ? u.donhang.length : 0
        };
    });
    const headers = ['username', 'hoTen', 'email', 'pass', 'status', 'phanLoai', 'soDon'];
    const labels = ['Tài khoản', 'Họ tên', 'Email', 'Mật khẩu', 'Trạng thái', 'Phân loại khách', 'Số đơn đã đặt'];
    exportToCSV('Danh_Sach_KhachHang', formattedData, headers, labels);
}
/* END ADMIN PRODUCTION - CSV EXPORT MODULE */
