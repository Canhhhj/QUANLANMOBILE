var adminInfo = [{
    "username": "admin",
    "pass": "adadad"
}];

function getListAdmin() {
    return JSON.parse(window.localStorage.getItem('ListAdmin'));
}

function setListAdmin(l) {
    window.localStorage.setItem('ListAdmin', JSON.stringify(l));
}

// Hàm chuẩn hóa đường dẫn ảnh (dùng chung cho cả Admin và Trang chủ)
function fixImagePath(path) {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;

    // Nếu dữ liệu cũ chỉ có img/... thì tự thêm assets/ vào trước
    if (path.startsWith("img/")) {
        path = "assets/" + path;
    }
    
    // Nếu path bắt đầu bằng ../ (có thể do đã lưu sai trước đó), xóa đi để fix thống nhất
    if (path.startsWith("../")) {
        path = path.replace("../", "");
    }

    // Nếu đang ở trong thư mục admin (window.PATH_PREFIX có giá trị ../)
    var prefix = window.PATH_PREFIX || "";
    return prefix + path;
}


// Hàm khởi tạo, tất cả các trang đều cần
function khoiTao() {
    // get data từ localstorage
    list_products = getListProducts() || list_products;
    adminInfo = getListAdmin() || adminInfo;

    // Đồng bộ nhóm hiển thị (groups) cho toàn bộ sản phẩm cũ
    capNhatNhomChoTatCaSanPham();

    setupEventTaiKhoan();
    capNhat_ThongTin_CurrentUser();
    addEventCloseAlertButton();
}

// ========= Các hàm liên quan tới danh sách sản phẩm =========
// Localstorage cho dssp: 'ListProducts
function setListProducts(newList) {
    window.localStorage.setItem('ListProducts', JSON.stringify(newList));
}

function getListProducts() {
    return JSON.parse(window.localStorage.getItem('ListProducts'));
}

// Tự động cập nhật trường groups cho tất cả sản phẩm dựa theo luật cũ
function capNhatNhomChoTatCaSanPham() {
    if (!list_products || !list_products.length) return;

    var daCapNhat = false;

    for (var i = 0; i < list_products.length; i++) {
        var p = list_products[i];
        if (!p) continue;

        if (!p.groups) p.groups = {};
        var groups = p.groups;

        var gia = 0;
        try {
            gia = stringToNum(p.price || "0");
        } catch(e) {
            gia = 0;
        }

        // Giá rẻ cho mọi nhà
        if (gia <= 3000000) groups.gia_re = true;
        else if (groups.gia_re) delete groups.gia_re;

        // Giảm giá lớn
        if (p.promo && p.promo.name === 'giamgia') groups.giam_gia_lon = true;
        else if (groups.giam_gia_lon) delete groups.giam_gia_lon;

        // Giá sốc online
        if (p.promo && p.promo.name === 'giareonline') groups.gia_soc_online = true;
        else if (groups.gia_soc_online) delete groups.gia_soc_online;

        // Trả góp 0%
        if (p.promo && p.promo.name === 'tragop') groups.tra_gop_0 = true;
        else if (groups.tra_gop_0) delete groups.tra_gop_0;

        // Sản phẩm mới
        if (p.promo && p.promo.name === 'moiramat') groups.san_pham_moi = true;
        else if (groups.san_pham_moi) delete groups.san_pham_moi;

        // Nổi bật nhất
        if (p.star >= 3) groups.noi_bat_nhat = true;
        else if (groups.noi_bat_nhat) delete groups.noi_bat_nhat;

        daCapNhat = true;
    }

    if (daCapNhat) {
        setListProducts(list_products);
    }
}

// Localstorage cho danh sách loại nhóm sản phẩm (Top sản phẩm): 'ListProductGroups'
// Thứ tự hiển thị: 1 Sản phẩm mới, 2 Phụ kiện, 3 Phone cũ, 4...
var ORDER_PRODUCT_GROUP_IDS = ['san_pham_moi', 'noi_bat_nhat', 'gia_soc_online', 'gia_re', 'giam_gia_lon', 'tra_gop_0'];
var DEFAULT_PRODUCT_GROUPS = [
    { id: 'san_pham_moi', name: 'Sản phẩm mới' },
    { id: 'noi_bat_nhat', name: 'PHỤ KIỆN PHONE' },
    { id: 'gia_soc_online', name: 'PHONE CŨ (99%)' },
    { id: 'gia_re', name: 'Giá rẻ cho mọi nhà' },
    { id: 'giam_gia_lon', name: 'Giảm giá lớn' },
    { id: 'tra_gop_0', name: 'Trả góp 0%' }
];
function getListProductGroups() {
    var raw = window.localStorage.getItem('ListProductGroups');
    if (!raw || raw === '[]') {
        setListProductGroups(DEFAULT_PRODUCT_GROUPS);
        return DEFAULT_PRODUCT_GROUPS;
    }
    var list = JSON.parse(raw);
    var changed = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === 'gia_soc_online' && list[i].name === 'Giá sốc online') {
            list[i].name = 'PHONE CŨ (99%)';
            changed = true;
        }
        if (list[i].id === 'noi_bat_nhat' && list[i].name === 'Nổi bật nhất') {
            list[i].name = 'PHỤ KIỆN PHONE';
            changed = true;
        }
    }
    // Sắp xếp lại đúng thứ tự: 1 Sản phẩm mới, 2 Phụ kiện, 3 Phone cũ, 4...
    var order = ORDER_PRODUCT_GROUP_IDS;
    list.sort(function (a, b) {
        var ia = order.indexOf(a.id);
        var ib = order.indexOf(b.id);
        if (ia === -1) ia = 999;
        if (ib === -1) ib = 999;
        return ia - ib;
    });
    if (changed) setListProductGroups(list);
    return list;
}
function setListProductGroups(list) {
    window.localStorage.setItem('ListProductGroups', JSON.stringify(list));
}

// Localstorage cho danh sách banner trang chủ: 'ListBanners'
function getListBanners() {
    return JSON.parse(window.localStorage.getItem('ListBanners')) || [];
}

function setListBanners(list) {
    window.localStorage.setItem('ListBanners', JSON.stringify(list));
}

function timKiemTheoTen(list, ten, soluong) {
    var tempList = copyObject(list);
    var result = [];
    ten = ten.split(' ');

    for (var sp of tempList) {
        var correct = true;
        for (var t of ten) {
            if (sp.name.toUpperCase().indexOf(t.toUpperCase()) < 0) {
                correct = false;
                break;
            }
        }
        if (correct) {
            result.push(sp);
        }
    }

    return result;
}

function timKiemTheoMa(list, ma) {
    for (var l of list) {
        if (l.masp == ma) return l;
    }
}

// copy 1 object, do trong js ko có tham biến , tham trị rõ ràng
// nên dùng bản copy để chắc chắn ko ảnh hưởng tới bản chính
function copyObject(o) {
    return JSON.parse(JSON.stringify(o));
}

// ============== ALert Box ===============
// div có id alert được tạo trong hàm addFooter
function addAlertBox(text, bgcolor, textcolor, time) {
    var al = document.getElementById('alert');
    al.childNodes[0].nodeValue = text;
    al.style.backgroundColor = bgcolor;
    al.classList.add('show');
    al.style.opacity = 1;
    al.style.zIndex = 200;

    if (textcolor) al.style.color = textcolor;
    if (time)
        setTimeout(function () {
            al.style.opacity = 0;
            al.classList.remove('show');
            al.style.zIndex = 0;
        }, time);
}

function addEventCloseAlertButton() {
    document.getElementById('closebtn')
        .addEventListener('mouseover', (event) => {
            // event.target.parentElement.style.display = "none";
            event.target.parentElement.style.opacity = 0;
            event.target.parentElement.style.zIndex = 0;
            event.target.parentElement.classList.remove('show');
        });
}

// Ghi đè alert mặc định để dùng toast đẹp
(function () {
    var nativeAlert = window.alert;
    window.showToast = function (text, bgcolor, textcolor, time) {
        addAlertBox(text, bgcolor || '#1e88e5', textcolor || '#fff', time || 3500);
    };
    window.alert = function (text) {
        addAlertBox(text, '#1e88e5', '#fff', 4000);
    };
})();

// ================ Cart Number + Thêm vào Giỏ hàng ======================
function animateCartNumber() {
    // Hiệu ứng cho icon giỏ hàng
    var cn = document.getElementsByClassName('cart-number')[0];
    cn.style.transform = 'scale(2)';
    cn.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    cn.style.color = 'white';
    setTimeout(function () {
        cn.style.transform = 'scale(1)';
        cn.style.backgroundColor = 'transparent';
        cn.style.color = 'red';
    }, 1200);
}

function themVaoGioHang(masp, tensp) {
    var user = getCurrentUser();
    if (!user) {
        alert('Bạn cần đăng nhập để mua hàng !');
        showTaiKhoan(true);
        return;
    }
    if (user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
    }
    var t = new Date();
    var daCoSanPham = false;;

    for (var i = 0; i < user.products.length; i++) { // check trùng sản phẩm
        if (user.products[i].ma == masp) {
            user.products[i].soluong++;
            daCoSanPham = true;
            break;
        }
    }

    if (!daCoSanPham) { // nếu không trùng thì mới thêm sản phẩm vào user.products
        user.products.push({
            "ma": masp,
            "soluong": 1,
            "date": t
        });
    }

    animateCartNumber();
    addAlertBox('Đã thêm ' + tensp + ' vào giỏ.', '#17c671', '#fff', 3500);

    setCurrentUser(user); // cập nhật giỏ hàng cho user hiện tại
    updateListUser(user); // cập nhật list user
    capNhat_ThongTin_CurrentUser(); // cập nhật giỏ hàng
}

// ============================== TÀI KHOẢN ============================

// Hàm get set cho người dùng hiện tại đã đăng nhập
function getCurrentUser() {
    return JSON.parse(window.localStorage.getItem('CurrentUser')); // Lấy dữ liệu từ localstorage
}

function setCurrentUser(u) {
    window.localStorage.setItem('CurrentUser', JSON.stringify(u));
}

// Hàm get set cho danh sách người dùng
function getListUser() {
    var data = JSON.parse(window.localStorage.getItem('ListUser')) || []
    var l = [];
    for (var d of data) {
        l.push(d);
    }
    return l;
}

function setListUser(l) {
    window.localStorage.setItem('ListUser', JSON.stringify(l));
}

// ListOrders: đơn hàng toàn cửa hàng (để tra cứu theo mã, không cần đăng nhập)
function getListOrders() {
    try {
        var raw = window.localStorage.getItem('ListOrders');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}
function setListOrders(arr) {
    window.localStorage.setItem('ListOrders', JSON.stringify(arr));
}
function updateListOrderStatus(ngaymua, tinhTrang) {
    var list = getListOrders();
    for (var i = 0; i < list.length; i++) {
        if (list[i].ngaymua === ngaymua) {
            list[i].tinhTrang = tinhTrang;
            setListOrders(list);
            return;
        }
    }
}

// Wishlist (yêu thích)
function getWishlistIds() {
    try {
        var raw = window.localStorage.getItem('WishlistIds');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}
function setWishlistIds(arr) {
    window.localStorage.setItem('WishlistIds', JSON.stringify(arr));
}
function toggleWishlist(masp) {
    var list = getWishlistIds();
    var i = list.indexOf(masp);
    if (i >= 0) list.splice(i, 1);
    else list.push(masp);
    setWishlistIds(list);
    updateCompareWishlistBadges();
    return list.indexOf(masp) < 0;
}
function isInWishlist(masp) {
    return getWishlistIds().indexOf(masp) >= 0;
}
function updateCompareWishlistBadges() {
    var w = document.getElementsByClassName('wishlist-number')[0];
    if (w) w.textContent = getWishlistIds().length;
}

// Breadcrumb: items = [{ text, url }], url null = không link
function renderBreadcrumb(items) {
    if (!items || !items.length) return;
    var wrap = document.getElementById('breadcrumb-wrap');
    if (!wrap) return;
    var html = '<div class="breadcrumb">';
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.url) html += '<a href="' + it.url + '">' + it.text + '</a>';
        else html += '<span class="current">' + it.text + '</span>';
        if(i < items.length - 1) html += '<i class="fa fa-angle-right separator"></i>';
    }
    html += '</div>';
    wrap.innerHTML = html;
}

// Sau khi chỉnh sửa 1 user 'u' thì cần hàm này để cập nhật lại vào ListUser
function updateListUser(u, newData) {
    var list = getListUser();
    for (var i = 0; i < list.length; i++) {
        if (equalUser(u, list[i])) {
            list[i] = (newData ? newData : u);
        }
    }
    setListUser(list);
}

function logIn(form) {
    // Lấy dữ liệu từ form
    var name = form.username.value;
    var pass = form.pass.value;
    var newUser = new User(name, pass);

    // Lấy dữ liệu từ danh sách người dùng localstorage
    var listUser = getListUser();

    // Kiểm tra xem dữ liệu form có khớp với người dùng nào trong danh sách ko
    for (var u of listUser) {
        if (equalUser(newUser, u)) {
            if(u.off) {
                alert('Tài khoản này đang bị khoá. Không thể đăng nhập.');
                return false;
            }

            setCurrentUser(u);

            // Reload lại trang -> sau khi reload sẽ cập nhật luôn giỏ hàng khi hàm setupEventTaiKhoan chạy
            location.reload();
            return false;
        }
    }

    // Đăng nhập vào admin
    for (var ad of adminInfo) {
        if (equalUser(newUser, ad)) {
            alert('Xin chào admin .. ');
            window.localStorage.setItem('admin', true);
            window.location.assign('admin.html');
            return false;
        }
    }

    // Trả về thông báo nếu không khớp
    alert('Nhập sai tên hoặc mật khẩu !!!');
    form.username.focus();
    return false;
}

function signUp(form) {
    var ho = (form.ho.value || '').trim();
    var ten = (form.ten.value || '').trim();
    var email = (form.email.value || '').trim();
    var username = (form.newUser.value || '').trim();
    var pass = (form.newPass.value || '').trim();
    if (!ho || !ten) {
        alert('Vui lòng nhập đầy đủ Họ và Tên.');
        return false;
    }
    if (!email) {
        alert('Vui lòng nhập Email.');
        form.email.focus();
        return false;
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
        alert('Email không đúng định dạng.');
        form.email.focus();
        return false;
    }
    if (!username) {
        alert('Vui lòng nhập Tên đăng nhập.');
        form.newUser.focus();
        return false;
    }
    if (username.length < 3) {
        alert('Tên đăng nhập cần ít nhất 3 ký tự.');
        form.newUser.focus();
        return false;
    }
    if (!pass) {
        alert('Vui lòng nhập Mật khẩu.');
        form.newPass.focus();
        return false;
    }
    if (pass.length < 6) {
        alert('Mật khẩu cần ít nhất 6 ký tự.');
        form.newPass.focus();
        return false;
    }
    var newUser = new User(username, pass, ho, ten, email);

    // Lấy dữ liệu các khách hàng hiện có
    var listUser = getListUser();

    // Kiểm tra trùng admin
    for (var ad of adminInfo) {
        if (newUser.username == ad.username) {
            alert('Tên đăng nhập đã có người sử dụng !!');
            return false;
        }
    }

    // Kiểm tra xem dữ liệu form có trùng với khách hàng đã có không
    for (var u of listUser) {
        if (newUser.username == u.username) {
            alert('Tên đăng nhập đã có người sử dụng !!');
            return false;
        }
    }

    // Lưu người mới vào localstorage
    listUser.push(newUser);
    window.localStorage.setItem('ListUser', JSON.stringify(listUser));

    // Đăng nhập vào tài khoản mới tạo
    window.localStorage.setItem('CurrentUser', JSON.stringify(newUser));
    alert('Đăng kí thành công, Bạn sẽ được tự động đăng nhập!');
    location.reload();

    return false;
}

function logOut() {
    window.localStorage.removeItem('CurrentUser');
    location.reload();
}

// Hiển thị form tài khoản, giá trị truyền vào là true hoặc false
function showTaiKhoan(show) {
    /* START LOGIN MODAL FIX */
    var div = document.getElementsByClassName('containTaikhoan')[0];
    if(show) {
        div.classList.add('show');
        document.body.style.overflow = 'hidden';
    } else {
        div.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    /* END LOGIN MODAL FIX */
}

// Check xem có ai đăng nhập hay chưa (CurrentUser có hay chưa)
// Hàm này chạy khi ấn vào nút tài khoản trên header
function checkTaiKhoan() {
    if (!getCurrentUser()) {
        showTaiKhoan(true);
    }
}

// Tạo event, hiệu ứng cho form tài khoản
function setupEventTaiKhoan() {
    var taikhoan = document.getElementsByClassName('taikhoan')[0];
    var list = taikhoan.getElementsByTagName('input');

    // Tạo eventlistener cho input để tạo hiệu ứng label
    // Gồm 2 event onblur, onfocus được áp dụng cho từng input trong list bên trên
    ['blur', 'focus'].forEach(function (evt) {
        for (var i = 0; i < list.length; i++) {
            list[i].addEventListener(evt, function (e) {
                var label = this.previousElementSibling; // lấy element ĐỨNG TRƯỚC this, this ở đây là input
                if (e.type === 'blur') { // khi ấn chuột ra ngoài
                    if (this.value === '') { // không có value trong input thì đưa label lại như cũ
                        label.classList.remove('active');
                        label.classList.remove('highlight');
                    } else { // nếu có chữ thì chỉ tắt hightlight chứ không tắt active, active là dịch chuyển lên trên
                        label.classList.remove('highlight');
                    }
                } else if (e.type === 'focus') { // khi focus thì label active + hightlight
                    label.classList.add('active');
                    label.classList.add('highlight');
                }
            });
        }
    })

    // Event chuyển tab login-signup
    var tab = document.getElementsByClassName('tab');
    for (var i = 0; i < tab.length; i++) {
        var a = tab[i].getElementsByTagName('a')[0];
        a.addEventListener('click', function (e) {
            e.preventDefault(); // tắt event mặc định

            // Thêm active(màu xanh lá) cho li chứa tag a này => ấn login thì login xanh, signup thì signup sẽ xanh
            this.parentElement.classList.add('active');

            // Sau khi active login thì phải tắt active sigup và ngược lại
            // Trường hợp a này thuộc login => <li>Login</li> sẽ có nextElement là <li>SignUp</li>
            if (this.parentElement.nextElementSibling) {
                this.parentElement.nextElementSibling.classList.remove('active');
            }
            // Trường hợp a này thuộc signup => <li>SignUp</li> sẽ có .previousElement là <li>Login</li>
            if (this.parentElement.previousElementSibling) {
                this.parentElement.previousElementSibling.classList.remove('active');
            }

            // Ẩn phần nhập của login nếu ấn signup và ngược lại
            // href của 2 tab signup và login là #signup và #login -> tiện cho việc getElement dưới đây
            var target = this.href.split('#')[1];
            document.getElementById(target).style.display = 'block';

            var hide = (target == 'login' ? 'signup' : 'login');
            document.getElementById(hide).style.display = 'none';
        })
    }

    updateCompareWishlistBadges();
    // Đoạn code tạo event trên được chuyển về js thuần từ code jquery
    // Code jquery cho phần tài khoản được lưu ở cuối file này
}

// Cập nhật số lượng hàng trong giỏ hàng + Tên current user
function capNhat_ThongTin_CurrentUser() {
    var u = getCurrentUser();
    if (u) {
        // Cập nhật số lượng hàng vào header
        document.getElementsByClassName('cart-number')[0].innerHTML = getTongSoLuongSanPhamTrongGioHang(u);
        // Cập nhật tên người dùng
        document.getElementsByClassName('member')[0]
            .getElementsByTagName('a')[0].childNodes[2].nodeValue = ' ' + u.username;
        // bỏ class hide của menu người dùng
        document.getElementsByClassName('menuMember')[0]
            .classList.remove('hide');
    }
}

// tính tổng số lượng các sản phẩm của user u truyền vào
function getTongSoLuongSanPhamTrongGioHang(u) {
    var soluong = 0;
    for (var p of u.products) {
        soluong += p.soluong;
    }
    return soluong;
}

// lấy số lương của sản phẩm NÀO ĐÓ của user NÀO ĐÓ được truyền vào
function getSoLuongSanPhamTrongUser(tenSanPham, user) {
    for (var p of user.products) {
        if (p.name == tenSanPham)
            return p.soluong;
    }
    return 0;
}

// ==================== Những hàm khác ===================== 
function numToString(num, char) {
    return num.toLocaleString().split(',').join(char || '.');
}

function stringToNum(str, char) {
    return Number(str.split(char || '.').join(''));
}

// https://www.w3schools.com/howto/howto_js_autocomplete.asp
function autocomplete(inp, arr) {
    var currentFocus;

    inp.addEventListener("keyup", function (e) {
        if (e.keyCode != 13 && e.keyCode != 40 && e.keyCode != 38) { // not Enter,Up,Down arrow
            var a, b, i, val = this.value;

            /*close any already open lists of autocompleted values*/
            closeAllLists();
            if (!val) {
                return false;
            }
            currentFocus = -1;

            /*create a DIV element that will contain the items (values):*/
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");

            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(a);

            /*for each item in the array...*/
            for (i = 0; i < arr.length; i++) {
                /*check if the item starts with the same letters as the text field value:*/
                if (arr[i].name.substr(0, val.length).toUpperCase() == val.toUpperCase()) {

                    /*create a DIV element for each matching element:*/
                    b = document.createElement("DIV");

                    /*make the matching letters bold:*/
                    b.innerHTML = "<strong>" + arr[i].name.substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].name.substr(val.length);

                    /*insert a input field that will hold the current array item's value:*/
                    b.innerHTML += "<input type='hidden' value='" + arr[i].name + "'>";

                    /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function (e) {
                        /*insert the value for the autocomplete text field:*/
                        inp.value = this.getElementsByTagName("input")[0].value;
                        inp.focus();

                        /*close the list of autocompleted values,
                        (or any other open lists of autocompleted values:*/
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        }

    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed, increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/

            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) {
                    x[currentFocus].click();
                    e.preventDefault();
                }
            }
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document, except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

// Thêm từ khóa tìm kiếm
function addTags(nameTag, link) {
    var new_tag = `<a href=` + link + `>` + nameTag + `</a>`;

    // Thêm <a> vừa tạo vào khung tìm kiếm
    var khung_tags = document.getElementsByClassName('tags')[0];
    khung_tags.innerHTML += new_tag;
}

// Thêm sản phẩm vào trang
function addProduct(p, ele, returnString) {
	promo = new Promo(p.promo.name, p.promo.value); // class Promo
	product = new Product(p.masp, p.name, p.img, p.price, p.star, p.rateCount, promo); // Class product

	return addToWeb(product, ele, returnString);
}

// Thêm topnav vào trang (đầy đủ kiểu CellphoneS)
function addTopNav() {
    document.write(`    
	<div class="top-nav group">
        <section>
            <div class="top-nav-promo">
                <span>Sản phẩm <strong>Chính hãng</strong> – Xuất VAT đầy đủ</span>
                <span><strong>Giao nhanh</strong> – Miễn phí đơn 300k</span>
                <span><strong>Thu cũ</strong> giá ngon – Lên đời tiết kiệm</span>
                <span><strong>Trả góp 0%</strong> – Bảo hành chính hãng</span>
            </div>
            <div class="top-nav-right">
                <a href="lienhe.html" class="top-nav-link"><i class="fa fa-map-marker"></i> Cửa hàng gần bạn</a>
                <a href="nguoidung.html" class="top-nav-link"><i class="fa fa-truck"></i> Tra cứu đơn hàng</a>
                <a href="tel:0876008333" class="top-nav-hotline"><i class="fa fa-phone"></i> 0876 008 333</a>
                <ul class="top-nav-quicklink">
                    <li><a href="index.html"><i class="fa fa-home"></i> Trang chủ</a></li>
                    <li><a href="tintuc.html"><i class="fa fa-newspaper-o"></i> Tin tức</a></li>
                    <li><a href="trungtambaohanh.html"><i class="fa fa-wrench"></i> Bảo hành</a></li>
                    <li><a href="lienhe.html"><i class="fa fa-phone"></i> Liên hệ</a></li>
                </ul>
            </div>
        </section>
    </div>`);
}

// Thêm header (đầy đủ CellphoneS: danh mục, hotline)
function addHeader() {
    document.write(`        
    <!-- START COMMERCIAL AUDIT - FULL WIDTH HEADER -->
    <div class="header-full">
        <div class="header-container">
            <div class="header group">
                <div class="logo">
                    <a href="index.html" class="logo-inner">
                        <span class="logo-circle">
                            <img class="logo-img-full" src="assets/logo-quanlan.png" alt="QUÂN LAN MOBILE" title="Trang chủ QUÂN LAN MOBILE">
                        </span>
                        <span class="logo-text">
                            <span class="logo-name">QUÂN LAN MOBILE</span>
                            <span class="logo-tagline">UY TÍN – CHẤT LƯỢNG – GIÁ TỐT</span>
                        </span>
                    </a>
                </div>
                <div class="header-category dropdown">
                    <button class="dropbtn category-btn"><i class="fa fa-th-list"></i> Danh mục</button>
                    <div class="dropdown-content dropdown-category">
                        <a href="index.html"><i class="fa fa-mobile"></i> Điện thoại</a>
                        <a href="index.html?promo=tragop"><i class="fa fa-credit-card"></i> Trả góp 0%</a>
                        <a href="index.html?promo=giamgia"><i class="fa fa-tag"></i> Khuyến mãi</a>
                        <a href="trungtambaohanh.html"><i class="fa fa-wrench"></i> Bảo hành</a>
                        <a href="lienhe.html"><i class="fa fa-map-marker"></i> Cửa hàng</a>
                    </div>
                </div>
                <div class="content">
                    <div class="search-header">
                        <form class="input-search" method="get" action="index.html">
                            <div class="autocomplete">
                                <input id="search-box" name="search" autocomplete="off" type="text" placeholder="Nhập từ khóa tìm kiếm...">
                                <button type="submit">
                                    <i class="fa fa-search"></i>
                                    Tìm kiếm
                                </button>
                            </div>
                        </form>
                        <div class="tags">
                            <strong>Từ khóa: </strong>
                        </div>
                    </div>
                    <div class="tools-member">
                        <div class="member">
                            <a onclick="checkTaiKhoan()">
                                <i class="fa fa-user"></i>
                                Tài khoản
                            </a>
                            <div class="menuMember hide">
                                <a href="nguoidung.html">Trang người dùng</a>
                                <a onclick="if(window.confirm('Xác nhận đăng xuất ?')) logOut();">Đăng xuất</a>
                            </div>
                        </div>
                        <a href="yeuthich.html" class="header-wishlist" title="Sản phẩm yêu thích">
                            <i class="fa fa-heart-o"></i>
                            <span>Yêu thích</span>
                            <span class="wishlist-number">0</span>
                        </a>
                        <div class="cart">
                            <a href="giohang.html">
                                <i class="fa fa-shopping-cart"></i>
                                <span>Giỏ hàng</span>
                                <span class="cart-number"></span>
                            </a>
                        </div>
                        <a href="tel:0876008333" class="header-hotline">
                            <i class="fa fa-phone"></i>
                            <span>0876 008 333</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END COMMERCIAL AUDIT -->`)
}

function addFooter() {
    document.write(`
    <!-- ============== Alert Box ============= -->
    <div id="alert">
        <span id="closebtn">&otimes;</span>
    </div>

    <!-- FAB Lên đầu + Liên hệ (mọi trang) -->
    <div class="fab-wrap">
        <a href="#" class="fab fab-top" onclick="(typeof gotoTop === 'function' ? gotoTop() : window.scrollTo(0,0)); return false;" title="Lên đầu trang"><i class="fa fa-arrow-up"></i> Lên đầu</a>
        <a href="javascript:void(0)" class="fab fab-contact" onclick="openMessageModal()" title="Hỏi đáp / Liên hệ"><i class="fa fa-comments"></i> Hỏi đáp</a>
    </div>

    <!-- ============== Footer đầy đủ CellphoneS ============= -->
    <footer class="footer-main">
        <div class="footer-inner">
            <!-- Cột 1: Hotline & Thanh toán -->
            <div class="footer-col-group">
                <div class="footer-hotline-block">
                    <p class="footer-hotline-title">Tổng đài hỗ trợ miễn phí</p>
                    <p><strong>Mua hàng - Bảo hành</strong> <br><a href="tel:0876008333">0876 008 333</a> (7h30 - 22h00)</p>
                    <p><strong>Khiếu nại</strong> <br><a href="tel:0876008333">0876 008 333</a> (8h00 - 21h30)</p>
                </div>
                <div class="footer-payment">
                    <h4>Phương thức thanh toán</h4>
                    <div class="footer-payment-icons">
                        <span title="Tiền mặt">Tiền mặt</span>
                        <span title="Chuyển khoản">Chuyển khoản</span>
                        <span title="Trả góp 0%">Trả góp 0%</span>
                        <span title="VNPay">VNPay</span>
                        <span title="MoMo">MoMo</span>
                    </div>
                </div>
            </div>

            <!-- Cột 2: Danh sách Links -->
            <div class="footer-col-group">
                <div class="footer-col footer-policy">
                    <h4>QUICK LINKS</h4>
                    <ul>
                        <li><a href="index.html">Trang chủ</a></li>
                        <li><a href="index.html">Sản phẩm</a></li>
                        <li><a href="lienhe.html">Liên hệ</a></li>
                        <li><a href="giohang.html">Giỏ hàng</a></li>
                        <li><a href="trungtambaohanh.html">Chính sách bảo hành</a></li>
                    </ul>
                </div>
                <div class="footer-col footer-service">
                    <h4>Dịch vụ và thông tin khác</h4>
                    <ul>
                        <li><a href="gioithieu.html">Quy chế hoạt động</a></li>
                        <li><a href="lienhe.html">Chính sách bảo mật</a></li>
                        <li><a href="lienhe.html">Liên hệ hợp tác</a></li>
                    </ul>
                </div>
            </div>

            <!-- Cột 3: Đăng ký nhận tin -->
            <div class="footer-newsletter">
                <h4>ĐĂNG KÝ NHẬN TIN KHUYẾN MÃI</h4>
                <p>Nhận ngay voucher 10% – Voucher gửi sau 24h, áp dụng cho khách hàng mới</p>
                <form class="footer-newsletter-form" onsubmit="addAlertBox('Đăng ký nhận tin thành công!', '#4caf50', '#fff', 3000); return false;">
                    <input type="email" placeholder="Email (*)" required>
                    <input type="tel" placeholder="Số điện thoại" pattern="[0-9]{10,11}">
                    <label><input type="checkbox" required> Tôi đồng ý với điều khoản của QUÂN LAN MOBILE</label>
                    <button type="submit">ĐĂNG KÝ NGAY</button>
                </form>
            </div>

            <!-- Cột 4: Thông tin cửa hàng -->
            <div class="footer-col footer-about">
                <h4>QUÂN LAN MOBILE</h4>
                <p>Địa chỉ: Đồng Bàu 2, Bình Minh, Nghệ An</p>
                <p>Hotline: <a href="tel:0876008333" style="color: var(--primary); font-weight:bold;">0876 008 333</a></p>
                <p>Email: <a href="mailto:quanlanmobile@gmail.com">quanlanmobile@gmail.com</a></p>
            </div>
        </div>
        <div class="copy-right">
            <p><a href="index.html">QUÂN LAN MOBILE</a> – Uy tín – Chất lượng – Giá tốt. © 2021 – Designed by <span class="credit">group 15th</span></p>
        </div>
    </footer>`);
}

/* START HIGH PRIORITY IMPLEMENT - CUSTOMER MESSAGING */
function openMessageModal(productId = null) {
    if (document.getElementById('containMessage')) {
        document.getElementById('containMessage').remove();
    }
    
    let productData = null;
    if (productId) {
        productData = timKiemTheoMa(list_products, productId);
    }
    
    const modalHtml = renderMessageModal(productData);
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Hide mobile menu if open
    const mobileMenu = document.querySelector('.header .content');
    if (mobileMenu && mobileMenu.classList.contains('show')) {
        mobileMenu.classList.remove('show');
    }
    
    // Show modal with animation
    setTimeout(() => {
        const modal = document.getElementById('containMessage');
        if (modal) modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Lock scroll
    }, 10);
}

function renderMessageModal(productData) {
    let productSection = '';
    if (productData) {
        productSection = `
            <div class="msg-product-info">
                <img src="${fixImagePath(productData.img)}" alt="${productData.name}">
                <div>
                    <p class="msg-product-name">${productData.name}</p>
                    <p class="msg-product-price">${productData.price} ₫</p>
                </div>
            </div>
            <input type="hidden" name="productId" value="${productData.masp}">
        `;
    }

    return `
    <div id="containMessage" class="containTaikhoan msg-modal" onclick="if(event.target == this) closeMessageModal();">
        <div class="taikhoan msg-box">
            <span class="close" onclick="closeMessageModal();">&times;</span>
            <div class="msg-header">
                <h2>💬 Tư vấn sản phẩm</h2>
                <p>Vui lòng để lại thông tin, Quân Lan Mobile sẽ liên hệ ngay!</p>
            </div>
            <form onsubmit="return saveCustomerMessage(this);" class="msg-form">
                ${productSection}
                <input type="hidden" name="currentPage" value="${window.location.href}">
                
                <div class="field-wrap">
                    <label>Họ tên<span class="req">*</span></label>
                    <input name="name" type="text" required autocomplete="off" placeholder="Ví dụ: Nguyễn Văn A" />
                </div>
                
                <div class="field-wrap-row">
                    <div class="field-wrap">
                        <label>Số điện thoại<span class="req">*</span></label>
                        <input name="phone" type="tel" required autocomplete="off" placeholder="087xxx..." />
                    </div>
                    <div class="field-wrap">
                        <label>Email<span class="req">*</span></label>
                        <input name="email" type="email" required autocomplete="off" placeholder="email@example.com" />
                    </div>
                </div>

                <div class="field-wrap">
                    <label>Lời nhắn<span class="req">*</span></label>
                    <textarea name="content" required placeholder="Tôi muốn hỏi về sản phẩm này..."></textarea>
                </div>

                <button type="submit" class="button button-block">Gửi yêu cầu ngay</button>
            </form>
        </div>
    </div>`;
}

function closeMessageModal() {
    const modal = document.getElementById('containMessage');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = ''; // Unlock scroll
        }, 300);
    }
}

function saveCustomerMessage(form) {
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const content = form.content.value.trim();
    const productId = form.productId ? form.productId.value : null;
    const currentPage = form.currentPage.value;

    // Validate
    if (!/^[0-9\s+]{9,15}$/.test(phone)) {
        addAlertBox('Số điện thoại không hợp lệ.', '#f44336', '#fff', 3000);
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addAlertBox('Email không đúng định dạng.', '#f44336', '#fff', 3000);
        return false;
    }

    const messages = JSON.parse(localStorage.getItem('ListCustomerMessages')) || [];
    const newMessage = {
        id: 'MSG' + Date.now(),
        name,
        phone,
        email,
        content,
        productId,
        productName: productId ? timKiemTheoMa(list_products, productId).name : 'Tổng quát',
        productImage: productId ? timKiemTheoMa(list_products, productId).img : null,
        currentPage,
        date: new Date().toISOString(),
        status: 'unread'
    };

    messages.push(newMessage);
    localStorage.setItem('ListCustomerMessages', JSON.stringify(messages));

    closeMessageModal();
    addAlertBox('Cảm ơn bạn! Quân Lan Mobile đã tiếp nhận yêu cầu.', '#4caf50', '#fff', 5000);
    
    // Trigger update badge if on admin page
    if (typeof capNhatBadgeDonHang === 'function') capNhatBadgeDonHang();
    
    return false;
}
/* END HIGH PRIORITY IMPLEMENT - CUSTOMER MESSAGING */

// Thêm contain Taikhoan
function addContainTaiKhoan() {
    /* START LOGIN MODAL FIX */
    document.write(`
	<div class="containTaikhoan" onclick="if(event.target == this) showTaiKhoan(false);">
        <div class="taikhoan">
            <span class="close" onclick="showTaiKhoan(false);">&times;</span>
            <ul class="tab-group">
                <li class="tab active"><a href="#login">Đăng nhập</a></li>
                <li class="tab"><a href="#signup">Đăng kí</a></li>
            </ul> <!-- /tab group -->

            <div class="tab-content">
                <div id="login">
                    <h1>Chào mừng bạn trở lại!</h1>

                    <form onsubmit="return logIn(this);">

                        <div class="field-wrap">
                            <label>
                                Tên đăng nhập<span class="req">*</span>
                            </label>
                            <input name='username' type="text" required autocomplete="off" />
                        </div> <!-- /user name -->

                        <div class="field-wrap">
                            <label>
                                Mật khẩu<span class="req">*</span>
                            </label>
                            <input name="pass" type="password" required autocomplete="off" />
                        </div> <!-- pass -->

                        <p class="forgot"><a href="#">Quên mật khẩu?</a></p>

                        <button type="submit" class="button button-block" />Tiếp tục</button>

                    </form> <!-- /form -->

                </div> <!-- /log in -->

                <div id="signup">
                    <h1>Đăng kí miễn phí</h1>

                    <form onsubmit="return signUp(this);">

                        <div class="top-row">
                            <div class="field-wrap">
                                <label>
                                    Họ<span class="req">*</span>
                                </label>
                                <input name="ho" type="text" required autocomplete="off" />
                            </div>

                            <div class="field-wrap">
                                <label>
                                    Tên<span class="req">*</span>
                                </label>
                                <input name="ten" type="text" required autocomplete="off" />
                            </div>
                        </div> <!-- / ho ten -->

                        <div class="field-wrap">
                            <label>
                                Địa chỉ Email<span class="req">*</span>
                            </label>
                            <input name="email" type="email" required autocomplete="off" />
                        </div> <!-- /email -->

                        <div class="field-wrap">
                            <label>
                                Tên đăng nhập<span class="req">*</span>
                            </label>
                            <input name="newUser" type="text" required autocomplete="off" />
                        </div> <!-- /user name -->

                        <div class="field-wrap">
                            <label>
                                Mật khẩu<span class="req">*</span>
                            </label>
                            <input name="newPass" type="password" required autocomplete="off" />
                        </div> <!-- /pass -->

                        <button type="submit" class="button button-block" />Tạo tài khoản</button>

                    </form> <!-- /form -->

                </div> <!-- /sign up -->
            </div><!-- tab-content -->

        </div> <!-- /taikhoan -->
    </div>`);
}
// Thêm plc (phần giới thiệu trước footer)
function addPlc() {
    document.write(`
    <div class="plc">
        <section>
            <ul class="flexContain">
                <li>Giao hàng hỏa tốc trong 1 giờ</li>
                <li>Thanh toán linh hoạt: tiền mặt, chuyển khoản, trả góp 0% lãi suất</li>
                <li>Trải nghiệm sản phẩm tại nhà</li>
                <li>Lỗi do nhà sản xuất – 1 đổi 1 trong 7 ngày</li>
                <li>Hỗ trợ suốt thời gian sử dụng.
                    <br>Hotline:
                    <a href="tel:0876008333" style="color: #288ad6;">0876 008 333</a>
                </li>
            </ul>
        </section>
    </div>`);
}

// https://stackoverflow.com/a/2450976/11898496
function shuffleArray(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

function checkLocalStorage() {
    if (typeof (Storage) == "undefined") {
        alert('Máy tính không hỗ trợ LocalStorage. Không thể lưu thông tin sản phẩm, khách hàng!!');
    } else {
    }
}

// Di chuyển lên đầu trang
function gotoTop() {
    if (window.jQuery) {
        jQuery('html,body').animate({
            scrollTop: 0
        }, 100);
    } else {
        document.getElementsByClassName('top-nav')[0].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }
}

// Lấy màu ngẫu nhiên
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Test, not finished
function auto_Get_Database() {
    var ul = document.getElementsByClassName('homeproduct')[0];
    var li = ul.getElementsByTagName('li');
    for (var l of li) {
        var a = l.getElementsByTagName('a')[0];
        // name
        var name = a.getElementsByTagName('h3')[0].innerHTML;

        // price
        var price = a.getElementsByClassName('price')[0]
        price = price.getElementsByTagName('strong')[0].innerHTML;

        // img
        var img = a.getElementsByTagName('img')[0].src;
        /* START COMMERCIAL AUDIT - DEBUG CLEANUP */
        /* console.log(img); */
        /* END COMMERCIAL AUDIT - DEBUG CLEANUP */

        // // rating
        // var rating = a.getElementsByClassName('ratingresult')[0];
        // var star = rating.getElementsByClassName('icontgdd-ystar').length;
        // var rateCount = parseInt(rating.getElementsByTagName('span')[0].innerHTML);

        // // promo
        // var tragop = a.getElementsByClassName('installment');
        // if(tragop.length) {

        // }

        // var giamgia = a.getElementsByClassName('discount').length;
        // var giareonline = a.getElementsByClassName('shockprice').length;
    }
}

function getThongTinSanPhamFrom_TheGioiDiDong() {
    javascript: (function () {
        var s = document.createElement('script');
        s.innerHTML = `
			(function () {
				var ul = document.getElementsByClassName('parameter')[0];
				var li_s = ul.getElementsByTagName('li');
				var result = {};
				result.detail = {};
	
				for (var li of li_s) {
					var loai = li.getElementsByTagName('span')[0].innerText;
					var giatri = li.getElementsByTagName('div')[0].innerText;
	
					switch (loai) {
						case "Màn hình:":
							result.detail.screen = giatri.replace('"', "'");
							break;
						case "Hệ điều hành:":
							result.detail.os = giatri;
							break;
						case "Camera sau:":
							result.detail.camara = giatri;
							break;
						case "Camera trước:":
							result.detail.camaraFront = giatri;
							break;
						case "CPU:":
							result.detail.cpu = giatri;
							break;
						case "RAM:":
							result.detail.ram = giatri;
							break;
						case "Bộ nhớ trong:":
							result.detail.rom = giatri;
							break;
						case "Thẻ nhớ:":
							result.detail.microUSB = giatri;
							break;
						case "Dung lượng pin:":
							result.detail.battery = giatri;
							break;
					}
				}
	
                /* START COMMERCIAL AUDIT - DEBUG CLEANUP */
                /* console.log(JSON.stringify(result, null, "\t")); */
                /* END COMMERCIAL AUDIT - DEBUG CLEANUP */
			})();`;
        document.body.appendChild(s);
    })();
}

// $('.taikhoan').find('input').on('keyup blur focus', function (e) {

//     var $this = $(this),
//         label = $this.prev('label');

//     if (e.type === 'keyup') {
//         if ($this.val() === '') {
//             label.removeClass('active highlight');
//         } else {
//             label.addClass('active highlight');
//         }
//     } else if (e.type === 'blur') {
//         if ($this.val() === '') {
//             label.removeClass('active highlight');
//         } else {
//             label.removeClass('highlight');
//         }
//     } else if (e.type === 'focus') {

//         if ($this.val() === '') {
//             label.removeClass('highlight');
//         } else if ($this.val() !== '') {
//             label.addClass('highlight');
//         }
//     }

// });

// $('.tab a').on('click', function (e) {

//     e.preventDefault();

//     $(this).parent().addClass('active');
//     $(this).parent().siblings().removeClass('active');

//     target = $(this).attr('href');

//     $('.tab-content > div').not(target).hide();

//     $(target).fadeIn(600);

// });
