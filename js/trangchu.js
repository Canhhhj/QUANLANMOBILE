window.onload = function () {
	khoiTao();

	// if (typeof renderBreadcrumb === 'function') {
	// 	renderBreadcrumb([{ text: 'Trang chủ', url: 'index.html' }, { text: 'Điện thoại', url: null }]);
	// }

	// Thêm hình vào banner (ưu tiên danh sách trong LocalStorage nếu có)
	var listBanners = getListBanners();
	if (listBanners && listBanners.length) {
		for (var i = 0; i < listBanners.length; i++) {
			var b = listBanners[i];
			addBanner(b.img, b.link || b.img);
		}
	} else {
		// Dữ liệu mặc định nếu chưa cấu hình banner
		addBanner("assets/img/banners/banner0.gif", "assets/img/banners/banner0.gif");
		var numBanner = 9; // Số lượng hình banner
		for (var i = 1; i <= numBanner; i++) {
			var linkimg = "assets/img/banners/banner" + i + ".png";
			addBanner(linkimg, linkimg);
		}
	}

	// Khởi động thư viện hỗ trợ banner - chỉ chạy khi đã tạo hình trong banner
	var owl = $('.owl-carousel');
	owl.owlCarousel({
		items: 1.5,
		margin: 100,
		center: true,
		loop: true,
		smartSpeed: 450,
		autoplay: true,
		autoplayTimeout: 3500
	});

	// autocomplete cho khung tim kiem
	autocomplete(document.getElementById('search-box'), list_products);

	// thêm tags (từ khóa) vào khung tìm kiếm
	var tags = ["Samsung", "iPhone", "Oppo", "Xiaomi"];
	for (var t of tags) addTags(t, "index.html?search=" + t);

	// Thêm danh sách hãng điện thoại
	var company = ["Apple.jpg", "Samsung.jpg", "Oppo.jpg", "Xiaomi.png", "Realme.png", "Vivo.jpg", "Nokia.jpg", "Huawei.jpg", "Mobiistar.jpg", "Philips.jpg", "Mobell.jpg", "HTC.jpg", "Itel.jpg", "Coolpad.png", "Motorola.jpg"];
	for (var i = 0; i < company.length; i++) {
		var c = company[i];
		var isExtra = (i >= 8); // Hiện 8 hãng đầu
		addCompany("assets/img/company/" + c, c.slice(0, c.lastIndexOf('.')), isExtra);
	}
	
	// Thêm nút Xem tất cả hãng
	var khung_hangSanXuat = document.getElementsByClassName('companyMenu')[0];
	if (khung_hangSanXuat) {
		khung_hangSanXuat.innerHTML += `
			<a href="javascript:;" class="company-card btn-view-all-brands" onclick="toggleBrands(this)">
				<div class="company-logo">
					<span>Tất cả hãng <i class="fa fa-angle-down"></i></span>
				</div>
			</a>`;
	}

	// Thêm sản phẩm vào trang
	var sanPhamPhanTich
	var sanPhamPhanTrang;

	var filters = getFilterFromURL();
	var isProductAnchor = window.location.hash === '#products';

	if (filters.length || isProductAnchor) { // có filter hoặc click vào anchor sản phẩm
		sanPhamPhanTich = phanTich_URL(filters, true);
		sanPhamPhanTrang = tinhToanPhanTrang(sanPhamPhanTich, filtersFromUrl.page || 1);
		if (!sanPhamPhanTrang.length) alertNotHaveProduct(false);
		else {
			alertNotHaveProduct(true);
			clearAllProducts();
			addProductsFrom(sanPhamPhanTrang);
		}

		// hiển thị list sản phẩm
		document.getElementsByClassName('contain-products')[0].style.display = 'block';
		// Ẩn khung sản phẩm trang chủ
		var khungHome = document.getElementsByClassName('contain-khungSanPham')[0];
		if (khungHome) khungHome.style.display = 'none';

		// Tự động cuộn xuống phần sản phẩm mượt mà
		if (window.location.hash === '#products' || filters.length) {
			setTimeout(function () {
				var target = document.getElementById('filter-result-title');
				if (target) {
					var headerOffset = 90; // chiều cao header sticky
					var elementTop = target.getBoundingClientRect().top + window.pageYOffset;
					window.scrollTo({
						top: elementTop - headerOffset,
						behavior: 'smooth'
					});
				}
			}, 120); // delay nhỏ để DOM render xong
		}

	} else { // ko có filter : trang chính mặc định sẽ hiển thị các sp hot, ...
		var soLuong = 10; // Hiện thị 10 cái mặc định

		// Các màu
		var yellow_red = ['#ff9c00', '#ec1f1f'];
		var blue = ['#42bcf4', '#004c70'];
		var green = ['#5de272', '#007012'];
		var colorsCycle = [yellow_red, blue, yellow_red, green, yellow_red, green];

		var div = document.getElementsByClassName('contain-khungSanPham')[0];
		var listGroups = getListProductGroups();
		for (var i = 0; i < listGroups.length; i++) {
			var g = listGroups[i];
			var filter = ['group=' + g.id];
			if (g.id === 'gia_re') filter.push('sort=price');
			else filter.push('sort=rateCount-decrease');
			var color = colorsCycle[i % colorsCycle.length];
			addKhungSanPham((g.name || g.id).toUpperCase(), color, filter, soLuong, div);
		}
	}

	// Thêm chọn mức giá
	addPricesRange(0, 2000000);
	addPricesRange(2000000, 4000000);
	addPricesRange(4000000, 7000000);
	addPricesRange(7000000, 13000000);
	addPricesRange(13000000, 0);

	// Thêm chọn khuyến mãi
	addPromotion('giamgia');
	addPromotion('tragop');
	addPromotion('moiramat');
	addPromotion('giareonline');

	// Thêm chọn số sao
	addStarFilter(3);
	addStarFilter(4);
	addStarFilter(5);

	// Thêm chọn sắp xếp
	addSortFilter('ascending', 'price', 'Giá tăng dần');
	addSortFilter('decrease', 'price', 'Giá giảm dần');
	addSortFilter('ascending', 'star', 'Sao tăng dần');
	addSortFilter('decrease', 'star', 'Sao giảm dần');
	addSortFilter('ascending', 'rateCount', 'Đánh giá tăng dần');
	addSortFilter('decrease', 'rateCount', 'Đánh giá giảm dần');
	addSortFilter('ascending', 'name', 'Tên A-Z');
	addSortFilter('decrease', 'name', 'Tên Z-A');

	// Thêm filter đã chọn
	addAllChoosedFilter();

	// Active tab Sắp xếp theo (CellphoneS) theo URL
	var sortTabs = document.querySelectorAll('.sort-tab');
	var currentSort = (filtersFromUrl.sort && filtersFromUrl.sort.by) ? (filtersFromUrl.sort.by + '-' + filtersFromUrl.sort.type) : '';
	
	// Kiểm tra xem có bộ lọc nào khác ngoài phân trang không
	var hasAnyFilter = false;
	for (var key in filtersFromUrl) {
		if (key === 'page' || key === 'sort') continue;
		if (filtersFromUrl[key] !== '') {
			hasAnyFilter = true;
			break;
		}
	}
	if (currentSort !== '') hasAnyFilter = true;

	for (var i = 0; i < sortTabs.length; i++) {
		var tab = sortTabs[i];
		tab.classList.remove('active');
		var href = (tab.getAttribute('href') || '');
		var query = href.split('?')[1] || '';
		
		if (currentSort && query.indexOf('sort=' + currentSort) >= 0) {
			tab.classList.add('active');
		} else if (!hasAnyFilter && (href === 'index.html' || href === 'index.html#products')) {
			tab.classList.add('active');
		}
	}

	updateFilterTitle();
};

function updateFilterTitle() {
	var title = "Tất cả sản phẩm";
	if (filtersFromUrl.company) title = "Điện thoại " + filtersFromUrl.company;
	else if (filtersFromUrl.search) title = "Kết quả tìm kiếm cho: " + filtersFromUrl.search;
	else if (filtersFromUrl.promo) title = "Sản phẩm " + promoToString(filtersFromUrl.promo);
	else if (filtersFromUrl.group) {
		switch(filtersFromUrl.group) {
			case 'noi_bat_nhat': title = "Điện thoại chơi game"; break;
			case 'gia_re': title = "Điện thoại giá rẻ"; break;
			case 'pin_trau': title = "Điện thoại pin trâu"; break;
			case 'choi_game': title = "Điện thoại chơi game"; break;
			case 'san_pham_moi': title = "Sản phẩm mới ra mắt"; break;
		}
	}
	else if (filtersFromUrl.price) {
		var p = filtersFromUrl.price.split('-');
		title = "Sản phẩm giá " + priceToString(p[0], p[1]);
	}

	var el = document.getElementById('filter-result-title');
	if (el) el.innerText = title;
}

var soLuongSanPhamMaxTrongMotTrang = 15;

// =========== Đọc dữ liệu từ url ============
var filtersFromUrl = { // Các bộ lọc tìm được trên url sẽ đc lưu vào đây
	company: '',
	search: '',
	price: '',
	promo: '',
	group: '',
	star: '',
	page: '',
	sort: {
		by: '',
		type: 'ascending'
	}
}
var stagedFilters = null;

function getFilterFromURL() { // tách và trả về mảng bộ lọc trên url
	var fullLocation = window.location.href;
	fullLocation = decodeURIComponent(fullLocation);
	fullLocation = fullLocation.split('#')[0]; // Remove anchor before parsing
	var dauHoi = fullLocation.split('?'); // tách theo dấu ?

	if (dauHoi[1]) {
		var dauVa = dauHoi[1].split('&');
		return dauVa;
	}

	return [];
}

function phanTich_URL(filters, saveFilter) {
	// var filters = getFilterFromURL();
	var result = copyObject(list_products);

	for (var i = 0; i < filters.length; i++) {
		var dauBang = filters[i].split('=');

		switch (dauBang[0]) {
			case 'search':
				dauBang[1] = dauBang[1].split('+').join(' ');
				result = timKiemTheoTen(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.search = dauBang[1];
				break;

			case 'price':
				if (saveFilter) filtersFromUrl.price = dauBang[1];

				var prices = dauBang[1].split('-');
				prices[1] = Number(prices[1]) || 1E10;
				result = timKiemTheoGiaTien(result, prices[0], prices[1]);
				break;

			case 'company':
				result = timKiemTheoCongTySanXuat(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.company = dauBang[1];
				break;

			case 'star':
				result = timKiemTheoSoLuongSao(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.star = dauBang[1];
				break;

			case 'promo':
				result = timKiemTheoKhuyenMai(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.promo = dauBang[1];
				break;

			case 'group':
				result = timKiemTheoGroup(result, dauBang[1]);
				if (saveFilter) filtersFromUrl.group = dauBang[1];
				break;

			case 'page': // page luôn ở cuối đường link
				if (saveFilter) filtersFromUrl.page = dauBang[1];
				break;

			case 'sort':
				var s = dauBang[1].split('-');
				var tenThanhPhanCanSort = s[0];

				switch (tenThanhPhanCanSort) {
					case 'price':
						if (saveFilter) filtersFromUrl.sort.by = 'price';
						result.sort(function (a, b) {
							var giaA = parseInt(a.price.split('.').join(''));
							var giaB = parseInt(b.price.split('.').join(''));
							return giaA - giaB;
						});
						break;

					case 'star':
						if (saveFilter) filtersFromUrl.sort.by = 'star';
						result.sort(function (a, b) {
							return a.star - b.star;
						});
						break;

					case 'rateCount':
						if (saveFilter) filtersFromUrl.sort.by = 'rateCount';
						result.sort(function (a, b) {
							return a.rateCount - b.rateCount;
						});
						break;

					case 'name':
						if (saveFilter) filtersFromUrl.sort.by = 'name';
						result.sort(function (a, b) {
							return a.name.localeCompare(b.name);
						});
						break;
				}

				if (s[1] == 'decrease') {
					if (saveFilter) filtersFromUrl.sort.type = 'decrease';
					result.reverse();
				}

				break;
		}
	}

	return result;
}

// thêm các sản phẩm từ biến mảng nào đó vào trang
function addProductsFrom(list, vitri, soluong) {
	var start = vitri || 0;
	var end = (soluong ? start + soluong : list.length);
	for (var i = start; i < end; i++) {
		addProduct(list[i]);
	}
}

function clearAllProducts() {
	document.getElementById('products').innerHTML = "";
}

// Thêm sản phẩm vào các khung sản phẩm
function addKhungSanPham(tenKhung, color, filter, len, ele) {
	// convert color to code
	var gradient = `background-image: linear-gradient(120deg, ` + color[0] + ` 0%, ` + color[1] + ` 50%, ` + color[0] + ` 100%);`
	var borderColor = `border-color: ` + color[0];
	
	var randomId = 'khung-' + Math.random().toString(36).substr(2, 9);

	// mở tag – tiêu đề gọn, không dấu *
	var s = `<div class="khungSanPham" style="` + borderColor + `" id="` + randomId + `">
				<h3 class="tenKhung" style="` + gradient + `">` + tenKhung + `</h3>
				<ul class="listSpTrongKhung">`;

	// thêm các <li> (sản phẩm) vào tag
	var spResult = phanTich_URL(filter, false);
	var displayLen = spResult.length; // Lấy hết để toggle

	for (var i = 0; i < displayLen; i++) {
		var extraClass = (i >= 10 ? 'extra-item-sp' : '');
		s += addProduct(spResult[i], null, true, extraClass);
	}

	// thêm nút xem tất cả rồi đóng tag
	s += `	</ul>`;
	
	if (displayLen > 10) {
		s += `<a class="xemTatCa" href="javascript:;" onclick="toggleExpandKhung('${randomId}')">Xem thêm ` + (displayLen - 10) + ` sản phẩm <i class="fa fa-angle-down"></i></a>`;
	} else {
		s += `<a class="xemTatCa" href="index.html?` + filter.join('&') + `">Xem tất cả ` + spResult.length + ` sản phẩm</a>`;
	}
	
	s += `</div>`;

	// thêm khung vào contain-khung
	ele.innerHTML += s;
}

function toggleExpandKhung(id) {
	var khung = document.getElementById(id);
	if (!khung) return;
	
	khung.classList.toggle('expanded');
	var btn = khung.querySelector('.xemTatCa');
	var isExpanded = khung.classList.contains('expanded');
	
	if (isExpanded) {
		btn.innerHTML = 'Thu gọn <i class="fa fa-angle-up"></i>';
	} else {
		var count = khung.querySelectorAll('.extra-item-sp').length;
		btn.innerHTML = 'Xem thêm ' + count + ' sản phẩm <i class="fa fa-angle-down"></i>';
	}
}

function expandPhuKien() {
	var grid = document.getElementById('phu-kien-grid');
	var btn = document.getElementById('btn-expand-phu-kien');
	if (!grid || !btn) return;

	grid.classList.toggle('expanded');
	if (grid.classList.contains('expanded')) {
		btn.innerHTML = 'Thu gọn <i class="fa fa-angle-up"></i>';
	} else {
		btn.innerHTML = 'Xem tất cả <i class="fa fa-angle-down"></i>';
	}
}

// Nút phân trang
function themNutPhanTrang(soTrang, trangHienTai) {
	var divPhanTrang = document.getElementsByClassName('pagination')[0];

	var k = createLinkFilter('remove', 'page'); // xóa phân trang cũ
	if (k.indexOf('?') > 0) k += '&';
	else k += '?'; // thêm dấu

	if (trangHienTai > 1) // Nút về phân trang trước
		divPhanTrang.innerHTML = `<a href="` + k + `page=` + (trangHienTai - 1) + `"><i class="fa fa-angle-left"></i></a>`;

	if (soTrang > 1) // Chỉ hiện nút phân trang nếu số trang > 1
		for (var i = 1; i <= soTrang; i++) {
			if (i == trangHienTai) {
				divPhanTrang.innerHTML += `<a href="javascript:;" class="current">` + i + `</a>`

			} else {
				divPhanTrang.innerHTML += `<a href="` + k + `page=` + (i) + `">` + i + `</a>`
			}
		}

	if (trangHienTai < soTrang) { // Nút tới phân trang sau
		divPhanTrang.innerHTML += `<a href="` + k + `page=` + (trangHienTai + 1) + `"><i class="fa fa-angle-right"></i></a>`
	}
}

// Tính toán xem có bao nhiêu trang + trang hiện tại,
// Trả về mảng sản phẩm trong trang hiện tại tính được
function tinhToanPhanTrang(list, vitriTrang) {
	var sanPhamDu = list.length % soLuongSanPhamMaxTrongMotTrang;
	var soTrang = parseInt(list.length / soLuongSanPhamMaxTrongMotTrang) + (sanPhamDu ? 1 : 0);
	var trangHienTai = parseInt(vitriTrang < soTrang ? vitriTrang : soTrang);

	themNutPhanTrang(soTrang, trangHienTai);
	var start = soLuongSanPhamMaxTrongMotTrang * (trangHienTai - 1);

	var temp = copyObject(list);

	return temp.splice(start, soLuongSanPhamMaxTrongMotTrang);
}

// ======== TÌM KIẾM (Từ mảng list truyền vào, trả về 1 mảng kết quả) ============

// function timKiemTheoTen(list, ten, soluong) {}
// hàm Tìm-kiếm-theo-tên được đặt trong dungchung.js , do trang chitietsanpham cũng cần dùng tới nó

function timKiemTheoCongTySanXuat(list, tenCongTy, soluong) {
	var count, result = [];
	if (soluong < list.length) count = soluong;
	else count = list.length;

	for (var i = 0; i < list.length; i++) {
		if (list[i].company.toUpperCase().indexOf(tenCongTy.toUpperCase()) >= 0) {
			result.push(list[i]);
			count--;
			if (count <= 0) break;
		}
	}
	return result;
}

function timKiemTheoSoLuongSao(list, soLuongSaoToiThieu, soluong) {
	var count, result = [];
	if (soluong < list.length) count = soluong;
	else count = list.length;

	for (var i = 0; i < list.length; i++) {
		if (list[i].star >= soLuongSaoToiThieu) {
			result.push(list[i]);
			count--;
			if (count <= 0) break;
		}
	}

	return result;
}

function timKiemTheoGiaTien(list, giaMin, giaMax, soluong) {
	var count, result = [];
	if (soluong < list.length) count = soluong;
	else count = list.length;

	for (var i = 0; i < list.length; i++) {
		var gia = parseInt(list[i].price.split('.').join(''));
		if (gia >= giaMin && gia <= giaMax) {
			result.push(list[i]);
			count--;
			if (count <= 0) break;
		}
	}

	return result;
}

function timKiemTheoKhuyenMai(list, tenKhuyenMai, soluong) {
	var count, result = [];
	if (soluong < list.length) count = soluong;
	else count = list.length;

	for (var i = 0; i < list.length; i++) {
		if (list[i].promo.name == tenKhuyenMai) {
			result.push(list[i]);
			count--;
			if (count <= 0) break;
		}
	}

	return result;
}

// Tìm theo nhóm hiển thị (group) – ưu tiên field groups, nếu không có dùng luật cũ
function timKiemTheoGroup(list, groupKey, soluong) {
	var count, result = [];
	if (soluong < list.length) count = soluong;
	else count = list.length;

	for (var i = 0; i < list.length; i++) {
		var sp = list[i];
		var groups = sp.groups || {};
		var match = false;

		if (groups[groupKey]) {
			match = true;
		} else {
			// Luật mặc định cho sản phẩm cũ chưa có groups
			var gia = parseInt(sp.price.split('.').join(''));
			var battery = parseInt((sp.detail.battery || "").replace(/[^0-9]/g, "")) || 0;
			var ram = parseInt((sp.detail.ram || "").replace(/[^0-9]/g, "")) || 0;

			switch (groupKey) {
				case 'noi_bat_nhat':
				case 'choi_game':
					match = ram >= 4 || sp.star >= 4;
					break;
				case 'gia_re':
				case 'pin_trau':
					match = battery >= 4000 || gia <= 4000000;
					break;
				case 'giam_gia_lon':
					match = (sp.promo && sp.promo.name === 'giamgia') || (sp.promo && sp.promo.value > 0);
					break;
				case 'gia_soc_online':
					match = sp.promo && (sp.promo.name === 'giareonline' || sp.promo.name === 'giamgia');
					break;
				case 'tra_gop_0':
					match = (sp.promo && sp.promo.name === 'tragop') || gia > 10000000;
					break;
				case 'san_pham_moi':
					match = (sp.promo && sp.promo.name === 'moiramat') || sp.star >= 4;
					break;
                default:
                    match = true; 
			}
		}

		if (match) {
			result.push(sp);
			count--;
			if (count <= 0) break;
		}
	}

	return result;
}

function timKiemTheoRAM(list, luongRam, soluong) {
	var count, result = [];
	if (soluong < list.length) count = soluong;
	else count = list.length;

	for (var i = 0; i < list.length; i++) {
		if (parseInt(list[i].detail.ram) == luongRam) {
			result.push(list[i]);
			count--;
			if (count <= 0) break;
		}
	}

	return result;
}

// ========== LỌC ===============
// Thêm bộ lọc đã chọn vào html
function addChoosedFilter(type, textInside) {
	var link = createLinkFilter('remove', type);
	var tag_a = `<a href="` + link + `"><h3>` + textInside + ` <i class="fa fa-close"></i> </h3></a>`;

	var divChoosedFilter = document.getElementsByClassName('choosedFilter')[0];
	divChoosedFilter.innerHTML += tag_a;

	var deleteAll = document.getElementById('deleteAllFilter');
	deleteAll.style.display = "block";
	deleteAll.href = window.location.href.split('?')[0];
}

// Thêm nhiều bộ lọc cùng lúc 
function addAllChoosedFilter() {
	var divChoosedFilter = document.getElementsByClassName('choosedFilter')[0];
	if (!divChoosedFilter) return;

	// Xóa các chip cũ nhưng giữ lại nút deleteAllFilter
	var deleteAll = document.getElementById('deleteAllFilter');
	divChoosedFilter.innerHTML = '';
	divChoosedFilter.appendChild(deleteAll);
	deleteAll.style.display = "none";

	var count = 0;
	if (filtersFromUrl.company != '') {
		addChoosedFilter('company', filtersFromUrl.company);
		count++;
	}

	if (filtersFromUrl.search != '') {
		addChoosedFilter('search', '"' + filtersFromUrl.search + '"');
		count++;
	}

	if (filtersFromUrl.price != '') {
		var prices = filtersFromUrl.price.split('-');
		addChoosedFilter('price', priceToString(prices[0], prices[1]));
		count++;
	}

	if (filtersFromUrl.promo != '') {
		addChoosedFilter('promo', promoToString(filtersFromUrl.promo));
		count++;
	}

	if (filtersFromUrl.group != '') {
		addChoosedFilter('group', filtersFromUrl.group);
		count++;
	}

	if (filtersFromUrl.star != '') {
		addChoosedFilter('star', starToString(filtersFromUrl.star));
		count++;
	}

	if (filtersFromUrl.sort.by != '') {
		var sortBy = sortToString(filtersFromUrl.sort.by);
		var kieuSapXep = (filtersFromUrl.sort.type == 'decrease' ? 'giảm dần' : 'tăng dần');
		addChoosedFilter('sort', sortBy + kieuSapXep);
		count++;
	}

	if (count > 0) {
		deleteAll.style.display = "block";
		deleteAll.href = window.location.href.split('?')[0];
	}
}

// Tạo link cho bộ lọc
// type là 'add' hoặc 'remove',
// tương ứng 'thêm' bộ lọc mới có giá trị = valueAdd, hoặc 'xóa' bộ lọc đã có
function createLinkFilter(type, nameFilter, valueAdd) {
	var o = copyObject(filtersFromUrl);
	o.page = ''; // reset phân trang

	if (nameFilter == 'sort') {
		if (type == 'add') {
			o.sort.by = valueAdd.by;
			o.sort.type = valueAdd.type;

		} else if (type == 'remove') {
			o.sort.by = '';
		}

	} else {
		if (type == 'add') o[nameFilter] = valueAdd;
		else if (type == 'remove') o[nameFilter] = '';
	}

	var link = 'index.html'; //window.location.href.split('?')[0].replace('#', '');
	var h = false; // Đã có dấu hỏi hay chưa

	// thêm những filter trước sort
	for (var i in o) {
		if (i != 'sort' && o[i]) {
			link += (h ? '&' : '?') + i + '=' + o[i];
			h = true;
		}
	}

	if (o.sort.by != '')
		link += (h ? '&' : '?') + 'sort=' + o.sort.by + '-' + o.sort.type;

	return link + "#products";
}

// Thông báo nếu không có sản phẩm
function alertNotHaveProduct(coSanPham) {
	var thongbao = document.getElementById('khongCoSanPham');
	var suggestion = document.getElementById('suggestionProducts');
	if (!coSanPham) {
		thongbao.style.display = "block";
		suggestion.style.display = "block";
		showSuggestions();
	} else {
		thongbao.style.display = "none";
		suggestion.style.display = "none";
	}
}

function showSuggestions() {
	var suggestion = document.getElementById('suggestionProducts');
	if (suggestion.innerHTML != "") return; // Đã load rồi

	suggestion.innerHTML = `
		<div class="suggestion-header">
			<h2 class="suggestion-title"><i class="fa fa-lightbulb-o"></i> Có thể bạn quan tâm</h2>
		</div>
		<ul class="homeproduct group">
		</ul>
	`;

	var list = suggestion.getElementsByClassName('homeproduct')[0];
	var products = getListProducts();
	
	// Lấy ngẫu nhiên 5 sản phẩm
	var shuffled = [...products].sort(() => 0.5 - Math.random());
	var randomProducts = shuffled.slice(0, 5);
	
	for (var p of randomProducts) {
		addProduct(p, list);
	}
}

// ========== Lọc TRONG TRANG ============
// Hiển thị Sản phẩm
function showLi(li) {
	li.style.opacity = 1;
	li.style.display = "flex";
	li.style.width = "auto";
	li.style.borderWidth = "1px";
}
// Ẩn sản phẩm
function hideLi(li) {
	li.style.width = 0;
	li.style.opacity = 0;
	li.style.display = "none";
	li.style.borderWidth = "0";
}

// Lấy mảng sản phẩm trong trang hiện tại (ở dạng tag html)
function getLiArray() {
	var ul = document.getElementById('products');
	var listLi = ul.getElementsByTagName('li');
	return listLi;
}

// lọc theo tên
function getNameFromLi(li) {
	var a = li.getElementsByTagName('a')[0];
	var h3 = a.getElementsByTagName('h3')[0];
	var name = h3.innerHTML;
	return name;
}

function filterProductsName(ele) {
	var filter = ele.value.toUpperCase();
	var listLi = getLiArray();
	var coSanPham = false;

	var soLuong = 0;

	for (var i = 0; i < listLi.length; i++) {
		if (getNameFromLi(listLi[i]).toUpperCase().indexOf(filter) > -1 &&
			soLuong < soLuongSanPhamMaxTrongMotTrang) {
			showLi(listLi[i]);
			coSanPham = true;
			soLuong++;

		} else {
			hideLi(listLi[i]);
		}
	}

	// Thông báo nếu không có sản phẩm
	alertNotHaveProduct(coSanPham);
}

// lọc theo số lượng sao
function getStarFromLi(li) {
	var a = li.getElementsByTagName('a')[0];
	var divRate = a.getElementsByClassName('ratingresult');
	if (!divRate) return 0;

	divRate = divRate[0];
	var starCount = divRate.getElementsByClassName('fa-star').length;

	return starCount;
}

function filterProductsStar(num) {
	var listLi = getLiArray();
	var coSanPham = false;

	for (var i = 0; i < listLi.length; i++) {
		if (getStarFromLi(listLi) >= num) {
			showLi(listLi[i]);
			coSanPham = true;

		} else {
			hideLi(listLi[i]);
		}
	}

	// Thông báo nếu không có sản phẩm
	alertNotHaveProduct(coSanPham);
}

// ================= Hàm khác ==================
// Thêm tags (từ khóa) vào khung tìm kiếm
function addTags(name, link) {
	var new_tag = `<a href="` + link + `">` + name + `</a>`;
	var khung_tags = document.getElementsByClassName('tags')[0];
	if (khung_tags) khung_tags.innerHTML += new_tag;
}

// Thêm banner
function addBanner(img, link) {
	var newDiv = `<div class='item'>
						<a target='_blank' href=` + link + `>
							<img src=` + fixImagePath(img) + `>
						</a>
					</div>`;
	var banner = document.getElementsByClassName('owl-carousel')[0];
	banner.innerHTML += newDiv;
}

// Thêm hãng sản xuất (kiểu card hiện đại 2025)
function addCompany(img, nameCompany, isExtra) {
	var link = createLinkFilter('add', 'company', nameCompany);
	var activeClass = (filtersFromUrl.company && filtersFromUrl.company.toLowerCase() === nameCompany.toLowerCase()) ? 'active' : '';
	var extraClass = isExtra ? 'extra-brand' : '';
	
	var new_tag = `
		<a href="${link}" class="company-card ${activeClass} ${extraClass}" title="${nameCompany}">
			<div class="company-logo">
				<img src="${fixImagePath(img)}" alt="${nameCompany}">
			</div>
		</a>`;

	var khung_hangSanXuat = document.getElementsByClassName('companyMenu')[0];
	if (khung_hangSanXuat) khung_hangSanXuat.innerHTML += new_tag;
}

function toggleBrands(btn) {
	var menu = document.getElementsByClassName('companyMenu')[0];
	if (!menu) return;
	
	menu.classList.toggle('expanded');
	if (menu.classList.contains('expanded')) {
		btn.querySelector('span').innerHTML = 'Thu gọn <i class="fa fa-angle-up"></i>';
	} else {
		btn.querySelector('span').innerHTML = 'Tất cả hãng <i class="fa fa-angle-down"></i>';
	}
}

// Thêm chọn mức giá (vào tất cả dropdown cùng class: thanh chính + panel bộ lọc)
function addPricesRange(min, max) {
	var link = createLinkFilter('add', 'price', min + '-' + max);
	var text = priceToString(min, max);
	
	var els = document.getElementsByClassName('pricesRangeFilter');
	for (var i = 0; i < els.length; i++) {
		var dc = els[i].getElementsByClassName('dropdown-content')[0];
		if (!dc) continue;
		
		var isPanel = els[i].closest('.filter-panel') !== null;
		var priceTag;
		if (isPanel) {
			priceTag = `<a href="javascript:void(0)" onclick="setStagedFilter('price', '${min}-${max}', this)">` + text + `</a>`;
		} else {
			priceTag = `<a href="` + link + `">` + text + `</a>`;
		}
		dc.innerHTML += priceTag;
	}
}

// Thêm chọn khuyến mãi
function addPromotion(name) {
	var link = createLinkFilter('add', 'promo', name);
	var text = promoToString(name);
	
	var els = document.getElementsByClassName('promosFilter');
	for (var i = 0; i < els.length; i++) {
		var dc = els[i].getElementsByClassName('dropdown-content')[0];
		if (!dc) continue;
		
		var isPanel = els[i].closest('.filter-panel') !== null;
		var promoTag;
		if (isPanel) {
			promoTag = `<a href="javascript:void(0)" onclick="setStagedFilter('promo', '${name}', this)">` + text + `</a>`;
		} else {
			promoTag = `<a href="` + link + `">` + text + `</a>`;
		}
		dc.innerHTML += promoTag;
	}
}

// Thêm chọn số lượng sao
function addStarFilter(value) {
	var link = createLinkFilter('add', 'star', value);
	var text = starToString(value);
	
	var els = document.getElementsByClassName('starFilter');
	for (var i = 0; i < els.length; i++) {
		var dc = els[i].getElementsByClassName('dropdown-content')[0];
		if (!dc) continue;
		
		var isPanel = els[i].closest('.filter-panel') !== null;
		var starTag;
		if (isPanel) {
			starTag = `<a href="javascript:void(0)" onclick="setStagedFilter('star', '${value}', this)">` + text + `</a>`;
		} else {
			starTag = `<a href="` + link + `">` + text + `</a>`;
		}
		dc.innerHTML += starTag;
	}
}

// Thêm chọn sắp xếp theo giá
function addSortFilter(type, nameFilter, text) {
	var link = createLinkFilter('add', 'sort', { by: nameFilter, type: type });
	var sortTag = `<a href="` + link + `">` + text + `</a>`;
	var els = document.getElementsByClassName('sortFilter');
	for (var i = 0; i < els.length; i++) {
		var dc = els[i].getElementsByClassName('dropdown-content')[0];
		if (dc) dc.innerHTML += sortTag;
	}
}

// Mở/đóng panel Bộ lọc (CellphoneS)
function toggleFilterPanel() {
	var panel = document.getElementById('filter-panel');
	var overlay = document.getElementById('filter-panel-overlay');
	if (!panel || !overlay) return;
	
	panel.classList.toggle('open');
	overlay.classList.toggle('open');
	var isOpen = panel.classList.contains('open');
	document.body.classList.toggle('filter-panel-open', isOpen);

	if (isOpen) {
		// Copy bộ lọc hiện tại vào bộ lọc tạm thời
		stagedFilters = copyObject(filtersFromUrl);
		updatePanelUI();
	}
}

// Cập nhật bộ lọc tạm thời khi người dùng nhấn trong panel
function setStagedFilter(key, value, ele) {
	if (!stagedFilters) return;
	
	if (key === 'sort') {
		stagedFilters.sort.by = value.by;
		stagedFilters.sort.type = value.type;
	} else {
		// Nếu nhấn lại cái đang chọn thì bỏ chọn (trừ trường hợp rỗng để reset)
		if (value !== '' && stagedFilters[key] === value) stagedFilters[key] = '';
		else stagedFilters[key] = value;
	}
	
	// Cập nhật UI ngay lập tức cho nhóm này
	if (ele) {
		var group = ele.closest('.filter-panel-group, .dropdown');
		if (group) {
			var links = group.querySelectorAll('a, .filter-chip');
			links.forEach(l => l.classList.remove('active'));
			if (stagedFilters[key] === value) ele.classList.add('active');
		}

		// Đóng dropdown nếu phần tử nằm trong dropdown
		var dropdown = ele.closest('.dropdown');
		if (dropdown) {
			dropdown.classList.remove('show');
			// Cập nhật text của nút
			var btn = dropdown.querySelector('.dropbtn');
			if (btn) btn.innerText = ele.innerText;
		}
	}
}

// Cập nhật giao diện panel để hiển thị cái nào đang được chọn (tạm thời)
function updatePanelUI() {
	if (!stagedFilters) return;
	var panel = document.getElementById('filter-panel');
	if (!panel) return;

	// Reset tất cả active trong panel
	var links = panel.querySelectorAll('.filter-chip, .dropdown-content a');
	links.forEach(l => l.classList.remove('active'));

	// Duyệt qua stagedFilters và highlight
	// (Logic này khớp với text hoặc value - nhưng ở đây ta chỉ cần init lúc mở)
	// Để đơn giản, khi mở panel, ta sẽ highlight dựa trên filtersFromUrl
	for (var key in stagedFilters) {
		if (key === 'page' || stagedFilters[key] === '') continue;
		var val = (key === 'sort') ? (stagedFilters.sort.by + '-' + stagedFilters.sort.type) : stagedFilters[key];
		
		// Tìm link nào có chứa giá trị này
		links.forEach(link => {
			var onclick = link.getAttribute('onclick') || '';
			if (onclick.indexOf("'" + key + "'") >= 0 && onclick.indexOf("'" + val + "'") >= 0) {
				link.classList.add('active');
			}
		});
	}
}

// Áp dụng bộ lọc và tải lại trang
function applyStagedFilters() {
	if (!stagedFilters) {
		toggleFilterPanel();
		return;
	}

	var url = "index.html";
	var params = [];
	if (stagedFilters.company) params.push("company=" + stagedFilters.company);
	if (stagedFilters.search) params.push("search=" + stagedFilters.search);
	if (stagedFilters.price) params.push("price=" + stagedFilters.price);
	if (stagedFilters.promo) params.push("promo=" + stagedFilters.promo);
	if (stagedFilters.group) params.push("group=" + stagedFilters.group);
	if (stagedFilters.star) params.push("star=" + stagedFilters.star);
	if (stagedFilters.sort && stagedFilters.sort.by) {
		params.push("sort=" + stagedFilters.sort.by + "-" + stagedFilters.sort.type);
	}
	
	if (params.length) url += "?" + params.join("&");
	url += "#products";
	
	window.location.href = url;
}

// Chuyển mức giá về dạng chuỗi tiếng việt
function priceToString(min, max) {
	if (min == 0) return 'Dưới ' + max / 1E6 + ' triệu';
	if (max == 0) return 'Trên ' + min / 1E6 + ' triệu';
	return 'Từ ' + min / 1E6 + ' - ' + max / 1E6 + ' triệu';
}

// Chuyển khuyến mãi vễ dạng chuỗi tiếng việt
function promoToString(name) {
	switch (name) {
		case 'tragop':
			return 'Trả góp';
		case 'giamgia':
			return 'Giảm giá';
		case 'giareonline':
			return 'Giá rẻ online';
		case 'moiramat':
			return 'Mới ra mắt';
	}
}

// Chuyển số sao về dạng chuỗi tiếng việt
function starToString(star) {
	return 'Trên ' + (star - 1) + ' sao';
}

// Chuyển các loại sắp xếp về dạng chuỗi tiếng việt
function sortToString(sortBy) {
	switch (sortBy) {
		case 'price':
			return 'Giá ';
		case 'star':
			return 'Sao ';
		case 'rateCount':
			return 'Đánh giá ';
		case 'name':
			return 'Tên ';
		default:
			return '';
	}
}

// Hàm Test, chưa sử dụng
function hideSanPhamKhongThuoc(list) {
	var allLi = getLiArray();
	for (var i = 0; i < allLi.length; i++) {
		var hide = true;
		for (var j = 0; j < list.length; j++) {
			if (getNameFromLi(allLi[i]) == list[j].name) {
				hide = false;
				break;
			}
		}
		if (hide) hideLi(allLi[i]);
	}
}

// Tính năng thu gọn thanh Sắp xếp khi cuộn trang (New Age Luxury 2026)
window.addEventListener('scroll', function() {
    var sortBar = document.querySelector('.sort-and-filter-bar');
    var filterBar = document.querySelector('.filter-bar');
    if (!sortBar || !filterBar) return;
    
    // Thu gọn khi lướt xuống quá 400px, hiện lại khi quay về đầu trang
    if (window.scrollY > 400) {
        sortBar.classList.add('collapsed');
        filterBar.classList.add('collapsed');
    } else {
        sortBar.classList.remove('collapsed');
        filterBar.classList.remove('collapsed');
    }
});
