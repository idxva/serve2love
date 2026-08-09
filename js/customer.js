// ============================================================
// FoodRescue — Customer Module
// Browse deals, filter/sort, reserve meals, QR pickup
// ============================================================

const FRCustomer = (() => {
  let activeFilter  = 'all';
  let pendingId     = null;   // listing being reserved

  // ---- Init ----
  function init() {
    filterListings();
  }

  // ---- Filter chips ----
  function setFilter(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn?.classList.add('active');
    filterListings();
  }

  // ---- Main filter + sort + render ----
  function filterListings() {
    let listings = FRData.loadListings();
    const now    = new Date();

    // Remove expired
    listings = listings.filter(l => new Date(l.closingTime) > now);

    // Search
    const q = (document.getElementById('customer-search')?.value || '').toLowerCase();
    if (q) {
      listings = listings.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.restaurantName.toLowerCase().includes(q) ||
        l.cuisine.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    switch (activeFilter) {
      case 'free':     listings = listings.filter(l => l.isDonation); break;
      case 'urgent':   listings = listings.filter(l => FRApp.getMinutesLeft(l.closingTime) < 30); break;
      case 'vegan':    listings = listings.filter(l => l.cuisine === 'Vegan' || (l.tags||[]).includes('vegan')); break;
      case 'italian':  listings = listings.filter(l => l.cuisine === 'Italian'); break;
      case 'japanese': listings = listings.filter(l => l.cuisine === 'Japanese'); break;
      case 'indian':   listings = listings.filter(l => l.cuisine === 'Indian'); break;
      case 'pizza':    listings = listings.filter(l => l.cuisine === 'Pizza'); break;
      case 'bakery':   listings = listings.filter(l => l.cuisine === 'Bakery'); break;
    }

    // Sort
    const sort = document.getElementById('customer-sort')?.value || 'discount';
    switch (sort) {
      case 'discount':
        listings.sort((a, b) => {
          if (a.isDonation && !b.isDonation) return -1;
          if (!a.isDonation && b.isDonation) return 1;
          return FRData.calcDiscount(b.closingTime) - FRData.calcDiscount(a.closingTime);
        });
        break;
      case 'time':
        listings.sort((a, b) => new Date(a.closingTime) - new Date(b.closingTime));
        break;
      case 'distance':
        listings.sort((a, b) => (a.distance || 99) - (b.distance || 99));
        break;
      case 'price':
        listings.sort((a, b) => {
          if (a.isDonation) return -1;
          if (b.isDonation) return 1;
          return FRData.calcDiscountedPrice(a.originalPrice, a.closingTime) -
                 FRData.calcDiscountedPrice(b.originalPrice, b.closingTime);
        });
        break;
    }

    // Count label
    const countEl = document.getElementById('customer-count');
    if (countEl) {
      const freeN = listings.filter(l => l.isDonation).length;
      countEl.textContent = `${listings.length} deal${listings.length !== 1 ? 's' : ''} available` +
        (freeN ? ` · ${freeN} free 🎁` : '');
    }

    FRApp.renderFoodGrid('customer-grid', listings);
  }

  // ---- Reserve Modal ----
  function openReserveModal(id) {
    const listings = FRData.loadListings();
    const listing  = listings.find(l => l.id === id);
    if (!listing) return;

    const qty = listing.quantityLeft !== undefined ? listing.quantityLeft : listing.quantity;
    if (qty <= 0) { FRApp.showToast('Sorry, this item is sold out!', 'error'); return; }
    if (new Date(listing.closingTime) <= new Date()) { FRApp.showToast('This listing has expired.', 'error'); return; }

    pendingId = id;
    const disc       = FRData.calcDiscount(listing.closingTime);
    const finalPrice = FRData.calcDiscountedPrice(listing.originalPrice, listing.closingTime);
    const closeAt    = new Date(listing.closingTime);
    const timeStr    = closeAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    _set('reserve-food-emoji',   listing.emoji || '🍽️');
    _set('reserve-food-name',    listing.name);
    _set('reserve-restaurant',   listing.restaurantName);
    _set('reserve-address',      listing.address || '–');
    _set('reserve-original-price', listing.isDonation ? 'Donated 🎁' : `$${listing.originalPrice.toFixed(2)}`);
    _set('reserve-discount',     listing.isDonation ? 'FREE Donation' : `${disc}% OFF`);
    _set('reserve-final-price',  listing.isDonation ? 'FREE' : `$${finalPrice.toFixed(2)}`);
    _set('reserve-pickup-time',  `By ${timeStr} today`);

    document.getElementById('modal-reserve').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeReserveModal() {
    document.getElementById('modal-reserve').classList.add('hidden');
    document.body.style.overflow = '';
    pendingId = null;
  }

  // ---- Confirm → QR ----
  function confirmReservation() {
    if (!pendingId) return;

    const listings = FRData.loadListings();
    const idx      = listings.findIndex(l => l.id === pendingId);
    if (idx === -1) return;

    const listing = listings[idx];
    if (listing.quantityLeft !== undefined && listing.quantityLeft <= 0) {
      FRApp.showToast('Just sold out — sorry!', 'error');
      closeReserveModal();
      return;
    }

    // Decrement stock
    listings[idx].quantityLeft = (listing.quantityLeft !== undefined ? listing.quantityLeft : listing.quantity) - 1;
    FRData.saveListings(listings);

    // Create reservation record
    const rsvId = 'FR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const rsv   = {
      id: rsvId,
      listingId: pendingId,
      foodName: listing.name,
      restaurantName: listing.restaurantName,
      address: listing.address || '',
      emoji: listing.emoji || '🍽️',
      finalPrice: listing.isDonation ? 0 : FRData.calcDiscountedPrice(listing.originalPrice, listing.closingTime),
      closingTime: listing.closingTime,
      createdAt: new Date().toISOString(),
    };
    const rsvs = FRData.loadReservations();
    rsvs.push(rsv);
    FRData.saveReservations(rsvs);

    // Update global impact
    const impact = FRData.loadImpact();
    impact.totalMealsSaved  += 1;
    impact.totalKgRescued   += 0.6;
    impact.co2ReducedKg     += 0.58;
    impact.weeklyMealsSaved += 1;
    FRData.saveImpact(impact);

    closeReserveModal();
    _showQRModal(rsv, listing);
    filterListings();
  }

  function _showQRModal(rsv, listing) {
    _set('qr-food-emoji',    listing.emoji || '🍽️');
    _set('qr-food-name',     listing.name);
    _set('qr-restaurant',    listing.restaurantName);
    _set('qr-code-text',     rsv.id);
    _set('qr-address-text',  listing.address || '–');
    _set('qr-pickup-str',    new Date(listing.closingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    _set('qr-price-str',     rsv.finalPrice === 0 ? 'FREE' : `$${rsv.finalPrice.toFixed(2)}`);

    // Generate QR
    const qrEl = document.getElementById('reserve-qr');
    qrEl.innerHTML = '';
    try {
      new QRCode(qrEl, {
        text: `FOODRESCUE:${rsv.id}:${listing.restaurantName}`,
        width: 160, height: 160,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch {
      qrEl.innerHTML = `<div class="qr-fallback">🔲<br><strong>${rsv.id}</strong></div>`;
    }

    document.getElementById('modal-qr').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    FRApp.showToast(`🎉 Reserved! Pick up at ${listing.restaurantName}`, 'success');
  }

  function closeQRModal() {
    document.getElementById('modal-qr').classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ---- Notification Simulation ----
  function simulateNotification() {
    const msgs = [
      '🎁 The Bread Basket has FREE pastries — closing in 15 min!',
      '⚡ Taco Trio at El Rancho is now 80% OFF — only 3 left!',
      '🆕 Bella Italia just added Pasta Carbonara at 50% off!',
      '🎉 Seoul Kitchen donating free Bibimbap tonight!',
      '🔥 Sakura Sushi sushi platter — 30% off, grab it now!',
    ];
    const banner = document.getElementById('notification-banner');
    document.getElementById('notification-text').textContent = msgs[Math.floor(Math.random() * msgs.length)];
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 8000);
    FRApp.showToast('🔔 New notification received!', 'info');
  }

  // ---- Helpers ----
  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return { init, setFilter, filterListings, openReserveModal, closeReserveModal, confirmReservation, closeQRModal, simulateNotification };
})();
