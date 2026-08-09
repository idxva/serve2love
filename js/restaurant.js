// ============================================================
// FoodRescue — Restaurant Dashboard Module
// ============================================================

const FRRestaurant = (() => {

  function init() {
    _renderStats();
    _renderListings();
    _renderImpact();
  }

  // ---- Dashboard Stats ----
  function _renderStats() {
    const listings     = FRData.loadListings();
    const reservations = FRData.loadReservations();
    const now          = new Date();
    const todayStr     = now.toDateString();

    const active = listings.filter(l =>
      new Date(l.closingTime) > now &&
      (l.quantityLeft !== undefined ? l.quantityLeft : l.quantity) > 0
    );

    const todayRsvs = reservations.filter(r => new Date(r.createdAt).toDateString() === todayStr);
    const revenue   = todayRsvs.reduce((s, r) => s + (r.finalPrice || 0), 0);
    const donated   = reservations.filter(r => {
      const listing = FRData.loadListings().find(l => l.id === r.listingId);
      return listing?.isDonation;
    }).length;

    _set('restaurant-active-count',       active.length);
    _set('restaurant-reservations-today', todayRsvs.length);
    _set('restaurant-revenue-saved',      `$${revenue.toFixed(2)}`);
    _set('restaurant-meals-donated',      donated);
    _set('listings-count-badge',          `${listings.length} total`);
  }

  // ---- Listings Table ----
  function _renderListings() {
    const listings = FRData.loadListings();
    const tbody    = document.getElementById('restaurant-listings-tbody');
    if (!tbody) return;

    if (!listings.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="9">No listings yet. Click "+ Add New Listing" to get started!</td></tr>`;
      return;
    }

    tbody.innerHTML = listings.map(l => {
      const qty      = l.quantityLeft !== undefined ? l.quantityLeft : l.quantity;
      const disc     = l.isDonation ? '–' : `${FRData.calcDiscount(l.closingTime)}%`;
      const final    = l.isDonation ? 'FREE' : `$${FRData.calcDiscountedPrice(l.originalPrice, l.closingTime).toFixed(2)}`;
      const expired  = new Date(l.closingTime) <= new Date();
      const soldOut  = qty <= 0;

      let status = '';
      if (l.isDonation)    status = `<span class="status-badge s-donate">🎁 Donation</span>`;
      else if (expired)    status = `<span class="status-badge s-expired">⏰ Expired</span>`;
      else if (soldOut)    status = `<span class="status-badge s-sold">✗ Sold Out</span>`;
      else                 status = `<span class="status-badge s-active">● Active</span>`;

      return `<tr>
        <td><span class="tbl-item">${l.emoji || '🍽️'} ${l.name}</span></td>
        <td>${l.cuisine}</td>
        <td class="qty-cell">${qty} / ${l.quantity}</td>
        <td>$${l.originalPrice.toFixed(2)}</td>
        <td><span class="tbl-disc">${disc}</span></td>
        <td><strong>${final}</strong></td>
        <td class="${expired ? 'text-muted' : ''}">${FRApp.formatTimeLeft(l.closingTime)}</td>
        <td>${status}</td>
        <td>
          <button class="btn-tbl btn-danger" onclick="FRRestaurant.removeListing('${l.id}')">✕ Remove</button>
        </td>
      </tr>`;
    }).join('');
  }

  // ---- Impact Panel ----
  function _renderImpact() {
    const rsvs        = FRData.loadReservations();
    const meals       = rsvs.length + 47;
    const co2         = (meals * 0.58).toFixed(1);
    const water       = (meals * 50).toLocaleString();
    let badge = 'Eco Starter 🌱';
    if (meals >= 100) badge = 'Eco Legend 🏆';
    else if (meals >= 50)  badge = 'Eco Champion ⭐';
    else if (meals >= 20)  badge = 'Eco Hero 💚';
    else if (meals >= 5)   badge = 'Eco Warrior 🌿';

    _set('restaurant-impact-meals',  meals);
    _set('restaurant-impact-co2',    `${co2} kg`);
    _set('restaurant-impact-water',  `${water} L`);
    _set('restaurant-impact-rating', badge);
  }

  // ---- Add Form ----
  function showAddForm() {
    const panel = document.getElementById('add-listing-panel');
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  function hideAddForm() {
    document.getElementById('add-listing-panel').classList.add('hidden');
    document.getElementById('add-listing-form').reset();
    _set('discount-preview-content', 'Enter price and closing time to see auto-discount');
  }

  function updateDiscountPreview() {
    const price      = parseFloat(document.getElementById('form-original-price')?.value);
    const hours      = parseFloat(document.getElementById('form-closing-hours')?.value);
    const isDonation = document.getElementById('form-is-donation')?.checked;
    const el         = document.getElementById('discount-preview-content');
    if (!el) return;

    if (isDonation) {
      el.innerHTML = `<strong style="color:var(--primary)">Free Community Donation</strong> — diners can claim it at no charge.`;
      return;
    }
    if (!price || !hours || isNaN(price) || isNaN(hours)) {
      el.textContent = 'Enter original price and closing hours to preview rate';
      return;
    }
    const fakeClose = new Date(Date.now() + hours * 3600000).toISOString();
    const disc      = FRData.calcDiscount(fakeClose);
    const final     = FRData.calcDiscountedPrice(price, fakeClose);
    const tiers     = { 30: '2+ hours away', 50: '1–2 hours away', 65: '30–60 min away', 80: '< 30 min away' };
    el.innerHTML =
      `Original: <s>$${price.toFixed(2)}</s> →
       <strong style="color:var(--accent)">${disc}% off</strong> →
       Customer pays <strong style="color:var(--primary)">$${final.toFixed(2)}</strong>
       <span style="color:var(--t3);font-size:0.8rem;"> (closing ${tiers[disc]})</span>`;
  }

  function submitListing(e) {
    e.preventDefault();
    const name       = document.getElementById('form-food-name').value.trim();
    const emoji      = document.getElementById('form-emoji').value.trim() || '🍽️';
    const desc       = document.getElementById('form-description').value.trim();
    const cuisine    = document.getElementById('form-cuisine').value;
    const price      = parseFloat(document.getElementById('form-original-price').value);
    const qty        = parseInt(document.getElementById('form-quantity').value);
    const closeHrs   = parseFloat(document.getElementById('form-closing-hours').value);
    const isDonation = document.getElementById('form-is-donation').checked;
    const restName   = document.getElementById('form-restaurant-name')?.value.trim() || 'My Restaurant';

    if (!name || !desc || !cuisine || !price || !qty || !closeHrs) {
      FRApp.showToast('Please fill in all required fields.', 'error'); return;
    }

    const listings = FRData.loadListings();
    listings.unshift({
      id:             'usr-' + Date.now(),
      restaurantId:   'my-restaurant',
      restaurantName: restName,
      restaurantRating: 4.8,
      address:        document.getElementById('form-address')?.value.trim() || '1 Restaurant Street',
      cuisine, emoji, name,
      description:    desc,
      originalPrice:  price,
      quantity:       qty,
      quantityLeft:   qty,
      closingTime:    new Date(Date.now() + closeHrs * 3600000).toISOString(),
      isDonation,
      distance:       0.0,
      tags:           [cuisine.toLowerCase()],
    });
    FRData.saveListings(listings);

    hideAddForm();
    _renderListings();
    _renderStats();
    FRApp.showToast(`✅ "${name}" published successfully!`, 'success');
  }

  function removeListing(id) {
    if (!confirm('Remove this listing?')) return;
    FRData.saveListings(FRData.loadListings().filter(l => l.id !== id));
    _renderListings();
    _renderStats();
    FRApp.showToast('Listing removed.', 'info');
  }

  function resetDemoData() {
    if (!confirm('Reset all demo data to defaults?')) return;
    FRData.resetDemo();
    init();
    FRApp.showToast('Demo data reset!', 'info');
  }

  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return { init, showAddForm, hideAddForm, updateDiscountPreview, submitListing, removeListing, resetDemoData };
})();
