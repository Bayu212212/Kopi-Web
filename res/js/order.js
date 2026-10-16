const menuItems = [
    { id: 'aren-latte', name: 'Aren Latte', category: 'Latte', price: 18000, image: 'res/img/aren latte.png' },
    { id: 'cafe-latte', name: 'Cafe Latte', category: 'Latte', price: 24000, image: 'res/img/cafe latte.png' },
    { id: 'caramel-latte', name: 'Caramel Latte', category: 'Latte', price: 30000, image: 'res/img/caramel latte.png' },
    { id: 'americano', name: 'Americano', category: 'Espresso', price: 18000, image: 'res/img/americano.png' },
    { id: 'cappuccino', name: 'Cappuccino', category: 'Espresso', price: 24000, image: 'res/img/cappucino.png' },
    { id: 'butterscotch', name: 'Butterscotch', category: 'Latte', price: 24000, image: 'res/img/butterscotch.png' }
];

const cupSizes = [
    { id: 'small', name: 'Kecil', price: 0 },
    { id: 'medium', name: 'Sedang', price: 5000 },
    { id: 'large', name: 'Besar', price: 10000 }
];

const toppings = [
    { id: 'whipped-cream', name: 'Whipped cream', price: 3000 },
    { id: 'boba', name: 'Boba', price: 4000 },
    { id: 'extra-espresso', name: 'Extra espresso', price: 5000 }
];

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
});

const menuList = document.querySelector('#menu-list');
const cartItemsElement = document.querySelector('#cart-items');
const cartEmptyElement = document.querySelector('#cart-empty');
const cartTotalElement = document.querySelector('#cart-total');
const cartStatusElement = document.querySelector('#cart-status');
const orderFeedbackElement = document.querySelector('#order-feedback');
const searchInput = document.querySelector('#menu-search');
const categorySelect = document.querySelector('#menu-category');
const orderForm = document.querySelector('#order-form');
const customerNameInput = document.querySelector('#customer-name');
const customerPhoneInput = document.querySelector('#customer-phone');
const customerNoteInput = document.querySelector('#customer-note');

const cart = [];

function formatPrice(amount) {
    return rupiah.format(amount);
}

function getSelectedItemPrice(card) {
    const item = menuItems.find(({ id }) => id === card.dataset.productId);
    const size = cupSizes.find(({ id }) => id === card.querySelector('[data-size]').value);
    const selectedToppings = Array.from(card.querySelectorAll('[data-topping]:checked'));

    return item.price + size.price + selectedToppings.reduce((total, input) => {
        const topping = toppings.find(({ id }) => id === input.value);
        return total + topping.price;
    }, 0);
}

function renderMenu() {
    const query = searchInput.value.trim().toLocaleLowerCase('id-ID');
    const category = categorySelect.value;
    const visibleItems = menuItems.filter((item) => {
        const matchesCategory = category === 'all' || item.category === category;
        const matchesQuery = `${item.name} ${item.category}`.toLocaleLowerCase('id-ID').includes(query);
        return matchesCategory && matchesQuery;
    });

    if (visibleItems.length === 0) {
        menuList.innerHTML = '<p class="order-empty">Menu tidak ditemukan.</p>';
        return;
    }

    menuList.innerHTML = visibleItems.map((item) => `
        <article class="menu-card" data-product-id="${item.id}">
            <div class="menu-card-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="menu-card-body">
                <div class="menu-card-heading">
                    <div>
                        <span class="menu-category">${item.category}</span>
                        <h3>${item.name}</h3>
                    </div>
                    <p class="menu-price" data-item-price>${formatPrice(item.price)}</p>
                </div>
                <label class="form-label" for="size-${item.id}">Ukuran</label>
                <select class="form-select" id="size-${item.id}" data-size>
                    ${cupSizes.map((size) => `
                        <option value="${size.id}">${size.name}${size.price ? ` (+${formatPrice(size.price)})` : ''}</option>
                    `).join('')}
                </select>
                <fieldset class="topping-options">
                    <legend class="form-label">Tambahan topping</legend>
                    ${toppings.map((topping) => `
                        <label class="form-check">
                            <input class="form-check-input" type="checkbox" value="${topping.id}" data-topping>
                            <span class="form-check-label">${topping.name} (+${formatPrice(topping.price)})</span>
                        </label>
                    `).join('')}
                </fieldset>
                <button class="btn btn-primary w-100" type="button" data-add-item>Tambah ke keranjang</button>
            </div>
        </article>
    `).join('');
}

function renderCart() {
    cartEmptyElement.hidden = cart.length > 0;
    cartItemsElement.innerHTML = cart.map((item) => `
        <article class="cart-line">
            <div class="cart-line-details">
                <h3>${item.name}</h3>
                <p>${item.sizeName}${item.toppingNames.length ? ` · ${item.toppingNames.join(', ')}` : ''}</p>
                <strong>${formatPrice(item.price * item.quantity)}</strong>
            </div>
            <div class="cart-line-actions" aria-label="Jumlah ${item.name}">
                <button class="quantity-button" type="button" data-cart-action="decrease" data-cart-key="${item.key}" aria-label="Kurangi ${item.name}">−</button>
                <span aria-live="polite">${item.quantity}</span>
                <button class="quantity-button" type="button" data-cart-action="increase" data-cart-key="${item.key}" aria-label="Tambah ${item.name}">+</button>
                <button class="remove-button" type="button" data-cart-action="remove" data-cart-key="${item.key}">Hapus</button>
            </div>
        </article>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotalElement.textContent = formatPrice(total);
}

function addToCart(card) {
    const product = menuItems.find(({ id }) => id === card.dataset.productId);
    const size = cupSizes.find(({ id }) => id === card.querySelector('[data-size]').value);
    const selectedToppings = Array.from(card.querySelectorAll('[data-topping]:checked'))
        .map((input) => toppings.find(({ id }) => id === input.value))
        .sort((a, b) => a.id.localeCompare(b.id));
    const key = `${product.id}|${size.id}|${selectedToppings.map(({ id }) => id).join(',')}`;
    const existingItem = cart.find((item) => item.key === key);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            key,
            name: product.name,
            sizeName: size.name,
            toppingNames: selectedToppings.map(({ name }) => name),
            price: product.price + size.price + selectedToppings.reduce((sum, topping) => sum + topping.price, 0),
            quantity: 1
        });
    }

    renderCart();
    orderFeedbackElement.textContent = '';
    cartStatusElement.textContent = `${product.name} ditambahkan ke keranjang.`;
}

menuList.addEventListener('change', (event) => {
    const card = event.target.closest('.menu-card');
    if (!card || (!event.target.matches('[data-size]') && !event.target.matches('[data-topping]'))) {
        return;
    }

    card.querySelector('[data-item-price]').textContent = formatPrice(getSelectedItemPrice(card));
});

menuList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-item]');
    if (button) {
        addToCart(button.closest('.menu-card'));
    }
});

cartItemsElement.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) {
        return;
    }

    const itemIndex = cart.findIndex((item) => item.key === button.dataset.cartKey);
    if (itemIndex === -1) {
        return;
    }

    const item = cart[itemIndex];
    if (button.dataset.cartAction === 'increase') {
        item.quantity += 1;
    } else if (button.dataset.cartAction === 'decrease') {
        item.quantity -= 1;
        if (item.quantity === 0) {
            cart.splice(itemIndex, 1);
        }
    } else if (button.dataset.cartAction === 'remove') {
        cart.splice(itemIndex, 1);
    }

    renderCart();
    orderFeedbackElement.textContent = '';
    cartStatusElement.textContent = 'Keranjang diperbarui.';
});

searchInput.addEventListener('input', renderMenu);
categorySelect.addEventListener('change', renderMenu);

orderForm.addEventListener('input', (event) => {
    if (event.target.matches('#customer-name, #customer-phone, #customer-note')) {
        event.target.setCustomValidity('');
        event.target.classList.remove('is-invalid');
        orderFeedbackElement.textContent = '';
    }
});

orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    orderFeedbackElement.classList.remove('is-success');
    orderFeedbackElement.textContent = '';

    if (cart.length === 0) {
        orderFeedbackElement.textContent = 'Tambahkan menu ke keranjang sebelum melanjutkan.';
        return;
    }

    const name = customerNameInput.value.trim();
    const phone = customerPhoneInput.value.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    const validPhoneFormat = /^\+?[0-9\s()-]+$/.test(phone);

    customerNameInput.setCustomValidity(name.length >= 2 ? '' : 'Masukkan nama minimal 2 karakter.');
    customerPhoneInput.setCustomValidity(
        validPhoneFormat && phoneDigits.length >= 9 && phoneDigits.length <= 15
            ? ''
            : 'Masukkan nomor kontak dengan 9–15 angka.'
    );
    customerNoteInput.setCustomValidity(
        customerNoteInput.value.length <= 300 ? '' : 'Catatan maksimal 300 karakter.'
    );

    [customerNameInput, customerPhoneInput, customerNoteInput].forEach((input) => {
        input.classList.toggle('is-invalid', !input.validity.valid);
    });

    if (!orderForm.checkValidity()) {
        orderForm.reportValidity();
        orderFeedbackElement.textContent = 'Periksa kembali nama dan nomor kontak.';
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    orderFeedbackElement.classList.add('is-success');
    orderFeedbackElement.textContent = `Pesanan ${name} siap diperiksa. Total ${formatPrice(total)}. Ini demo; pesanan belum dikirim ke toko.`;
});

renderMenu();
renderCart();
