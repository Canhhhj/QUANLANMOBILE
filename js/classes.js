function User(username, pass, ho, ten, email, products, donhang) {
	this.ho = ho || '';
	this.ten = ten || '';
	this.email = email || '';

	this.username = username;
	this.pass = pass;
	this.products = products || [];
	this.donhang = donhang || [];
}

function equalUser(u1, u2) {
	return (u1.username == u2.username && u1.pass == u2.pass);
}

function Promo(name, value) { // khuyen mai
	this.name = name; // giamGia, traGop, giaReOnline
	this.value = value;

	this.toWeb = function () {
		if (!this.name) return "";
		var contentLabel = "";
		switch (this.name) {
			case "giamgia":
				contentLabel = `<i class="fa fa-bolt"></i> Giảm ` + this.value + `&#8363;`;
				break;

			case "tragop":
				contentLabel = `Trả góp ` + this.value + `%`;
				break;

			case "giareonline":
				contentLabel = `Giá rẻ online`;
				break;

			case "moiramat":
				contentLabel = "Mới ra mắt";
				break;
		}

		var label =
			`<label class=` + this.name + `>
			` + contentLabel + `
		</label>`;

		return label;
	}
}

function Product(masp, name, img, price, star, rateCount, promo) {
	this.masp = masp;
	this.img = img;
	this.name = name;
	this.price = price;
	this.star = star;
	this.rateCount = rateCount;
	this.promo = promo;
}

// START COMMERCIAL AUDIT
function parsePrice(s) {
	if (!s) return 0;
	return parseInt(String(s).split('.').join(''), 10) || 0;
}
// END COMMERCIAL AUDIT

function addToWeb(p, ele, returnString, extraClass) {
	// Rating HTML
	var rating = "";
	if (p.rateCount > 0) {
		for (var i = 1; i <= 5; i++) {
			rating += (i <= p.star) ? `<i class="fa fa-star"></i>` : `<i class="fa fa-star-o"></i>`;
		}
		rating += `<span class="rate-count">` + p.star + `</span>`;
	} else {
		rating = `<span class="rate-count">0</span>`;
	}

	// Badge trạng thái: Sẵn hàng / Hàng mới về (CellphoneS)
	var statusBadge = (p.promo && p.promo.name === "moiramat")
		? `<span class="cps-badge cps-badge-new">Hàng mới về</span>`
		: `<span class="cps-badge cps-badge-stock">Sẵn hàng</span>`;

	// Badge khuyến mãi (góc trái)
	var badgeHtml = "";
	if (p.promo && p.promo.name === "giamgia" && p.promo.value) {
		var priceNum = parsePrice(p.price);
		var valueNum = parsePrice(p.promo.value);
		var oldNum = priceNum + valueNum;
		var percent = oldNum > 0 ? Math.round((valueNum / oldNum) * 100) : 0;
		if (percent > 0) badgeHtml = `<span class="cps-badge cps-badge-discount">Giảm ` + percent + `%</span>`;
	} else if (p.promo && p.promo.name === "tragop") {
		badgeHtml = `<span class="cps-badge cps-badge-tragop">Trả góp 0%</span>`;
	} else if (p.promo && p.promo.name === "moiramat") {
		badgeHtml = `<span class="cps-badge cps-badge-moi">Mới ra mắt</span>`;
	} else if (p.promo && p.promo.name === "giareonline") {
		badgeHtml = `<span class="cps-badge cps-badge-giare">Giá rẻ online</span>`;
	}

	// Giá: giá khuyến mãi (đỏ) + giá gốc (gạch ngang) nếu có
	var priceNum = parsePrice(p.price);
	var priceHtml = `<strong class="cps-price">` + p.price + `&#8363;</strong>`;
	var oldPriceHtml = "";
	if (p.promo && p.promo.name === "giareonline" && p.promo.value) {
		priceHtml = `<strong class="cps-price">` + p.promo.value + `&#8363;</strong>`;
		oldPriceHtml = `<span class="cps-old-price">` + p.price + `&#8363;</span>`;
	} else if (p.promo && p.promo.name === "giamgia" && p.promo.value) {
		var valueNum = parsePrice(p.promo.value);
		var oldNum = priceNum + valueNum;
		var oldStr = String(oldNum).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
		oldPriceHtml = `<span class="cps-old-price">` + oldStr + `&#8363;</span>`;
	}

	// Dòng trả góp
	var tragopText = (p.promo && p.promo.name === "tragop") 
		? "Trả góp 0% - 0đ phụ thu - 0đ trả trước - kỳ hạn đến 6 tháng"
		: "Trả góp 0% lãi suất qua thẻ tín dụng kỳ hạn 3-6 tháng";

	var chitietSp = 'chitietsanpham.html?' + p.name.split(' ').join('-');

	var newLi =
	`<li class="sanPham cps-card ` + (extraClass || '') + `">
		<a href="` + chitietSp + `">
			<div class="cps-card-image-wrap">
				` + statusBadge + `
				` + badgeHtml + `
				<img src="` + fixImagePath(p.img) + `" alt="` + p.name + `" loading="lazy">
			</div>
			<h3 class="cps-card-name">` + p.name + `</h3>
			<div class="cps-price-block">
				` + priceHtml + `
				` + oldPriceHtml + `
			</div>
			<p class="cps-tragop">` + tragopText + `</p>
			<div class="cps-card-footer">
				<span class="ratingresult" aria-label="Đánh giá ` + p.star + ` sao">` + rating + `</span>
				<span class="cps-yeuthich" role="button" aria-label="Thêm vào danh sách yêu thích"><i class="fa fa-heart-o"></i> Yêu thích</span>
			</div>
			<div class="tooltip">
				<button class="themvaogio" aria-label="Thêm ` + p.name + ` vào giỏ hàng" onclick="themVaoGioHang('`+p.masp+`', '`+p.name+`'); return false;">
					<span class="tooltiptext">Thêm vào giỏ</span>
					+
				</button>
			</div>
		</a>
	</li>`;

	if (returnString) return newLi;

	var products = ele || document.getElementById('products');
	products.innerHTML += newLi;
}
