// ============================================================
// FoodRescue — App Router & Shared Utilities
// ============================================================

const FRApp = (() => {
  const VIEWS = ['landing', 'customer', 'restaurant', 'impact'];
  let currentView = 'landing';
  let cardTimerInterval = null;

  // ---- View Routing ----
  function showView(name) {
    VIEWS.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle('hidden', v !== name);
    });
    currentView = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update nav link active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const linkMap = { customer: 'nav-find-food', restaurant: 'nav-restaurant', impact: 'nav-impact' };
    if (linkMap[name]) document.getElementById(linkMap[name])?.classList.add('active');

    // Close mobile menu
    document.getElementById('mobile-menu')?.classList.add('hidden');

    // Initialize view
    const inits = {
      landing: () => initLanding(),
      customer: () => FRCustomer.init(),
      restaurant: () => FRRestaurant.init(),
      impact: () => FRDashboard.init(),
    };
    inits[name]?.();
  }

  // ---- Landing Page ----
  function initLanding() {
    const impact = FRData.loadImpact();
    animateCounter('landing-stat-meals', impact.totalMealsSaved, 2200);
    animateCounter('landing-stat-restaurants', impact.restaurantsOnboard, 1800);
    animateDecimalStat('landing-stat-co2', impact.co2ReducedKg / 1000, 2200, 't');

    // Featured grid - show first 4 listings
    const listings = FRData.loadListings().slice(0, 4);
    renderFoodGrid('landing-featured-grid', listings);
  }

  // ---- Animated Counters ----
  function animateCounter(id, target, duration, prefix = '', suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();
    const update = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * ease).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function animateDecimalStat(id, target, duration, unit = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();
    const update = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = (target * ease).toFixed(2);
      el.innerHTML = `${val}<span class="stat-unit">${unit}</span>`;
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function animateDecimal(id, target, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();
    const update = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * ease).toFixed(1);
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // ---- Food Card Builder ----
  function buildFoodCard(listing) {
    const qty      = listing.quantityLeft !== undefined ? listing.quantityLeft : listing.quantity;
    const discount = FRData.calcDiscount(listing.closingTime);
    const price    = FRData.calcDiscountedPrice(listing.originalPrice, listing.closingTime);
    const isFree   = listing.isDonation;
    const soldOut  = qty <= 0;
    const expired  = new Date(listing.closingTime) <= new Date();
    const urgent   = !expired && getMinutesLeft(listing.closingTime) < 30;

    let badgeClass = 'badge-warm';
    if (discount >= 80) badgeClass = 'badge-hot';

    return `
    <div class="food-card" data-id="${listing.id}" onclick="FRCustomer.openReserveModal('${listing.id}')">
      <div class="food-card-top">
        <div class="food-emoji-circle">
          ${listing.emoji || '🍽️'}
        </div>
        <div class="food-badges">
          ${isFree
            ? `<div class="discount-badge badge-free">FREE DONATION</div>`
            : `<div class="discount-badge ${badgeClass}">${discount}% OFF</div>`}
          <div class="cuisine-badge">${listing.cuisine}</div>
          ${urgent ? `<div class="urgent-badge">&lt; 30 min</div>` : ''}
        </div>
      </div>

      <div class="food-card-body">
        <div class="food-card-name">${listing.name}</div>
        <div class="food-card-restaurant">${listing.restaurantName}</div>
        <div class="food-card-desc">${listing.description}</div>
        <div class="food-card-meta">
          <span class="meta-star">★ ${listing.restaurantRating || '4.5'}</span>
          <span class="meta-sep">·</span>
          <span>${listing.distance} km away</span>
          <span class="meta-sep">·</span>
          <span>${qty} remaining</span>
        </div>
      </div>

      <div class="food-card-footer">
        <div class="price-group">
          ${isFree
            ? `<div class="final-price free-price">FREE</div>`
            : `<div class="original-price">$${listing.originalPrice.toFixed(2)}</div>
               <div class="final-price">$${price.toFixed(2)}</div>`}
        </div>
        <div class="card-actions">
          <div class="countdown-timer ${urgent ? 'urgent' : ''}" data-closing="${listing.closingTime}">
            ${formatTimeLeft(listing.closingTime)}
          </div>
          ${(soldOut || expired)
            ? `<button class="reserve-btn" disabled>${expired ? 'Expired' : 'Sold Out'}</button>`
            : `<button class="reserve-btn ${isFree ? 'btn-donate' : ''}"
                       onclick="event.stopPropagation();FRCustomer.openReserveModal('${listing.id}')">
                 ${isFree ? 'Claim Free' : 'Reserve Meal'}
               </button>`}
        </div>
      </div>
    </div>`;
  }
  function renderFoodGrid(containerId, listings) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!listings.length) {
      el.innerHTML = `<div class="empty-grid">
        <div class="empty-icon">🍽️</div>
        <div class="empty-title">No deals right now</div>
        <div class="empty-sub">Try different filters or check back soon!</div>
      </div>`;
      return;
    }
    el.innerHTML = listings.map(l => buildFoodCard(l)).join('');
    startTimers();
  }

  // ---- Countdown Timers ----
  function getMinutesLeft(iso) {
    return (new Date(iso) - new Date()) / 60000;
  }

  function formatTimeLeft(iso) {
    const ms = new Date(iso) - new Date();
    if (ms <= 0) return 'Closed';
    const mins = Math.floor(ms / 60000);
    const hrs  = Math.floor(mins / 60);
    const rem  = mins % 60;
    if (hrs > 0) return `${hrs}h ${rem}m left`;
    if (mins > 0) return `${mins}m left`;
    return 'Closing now!';
  }

  function startTimers() {
    if (cardTimerInterval) clearInterval(cardTimerInterval);
    cardTimerInterval = setInterval(() => {
      document.querySelectorAll('[data-closing]').forEach(el => {
        const iso = el.getAttribute('data-closing');
        el.textContent = `⏱ ${formatTimeLeft(iso)}`;
        if (getMinutesLeft(iso) < 30) el.classList.add('urgent');
      });
    }, 30000);
  }

  // ---- Toast Notifications ----
  function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.classList.add('toast-exit');
      setTimeout(() => t.remove(), 350);
    }, 3500);
  }

  // ---- Mobile Menu ----
  window.toggleMobileMenu = () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  };

  // ---- Bootstrap ----
  document.addEventListener('DOMContentLoaded', () => {
    showView('landing');

    // Close modals on backdrop click
    ['modal-reserve', 'modal-qr'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', function(e) {
        if (e.target === this) {
          if (id === 'modal-reserve') FRCustomer.closeReserveModal();
          if (id === 'modal-qr')     FRCustomer.closeQRModal();
        }
      });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      nav?.classList.toggle('scrolled', window.scrollY > 20);
    });
  });

  return {
    showView,
    initLanding,
    renderFoodGrid,
    buildFoodCard,
    formatTimeLeft,
    getMinutesLeft,
    showToast,
    animateCounter,
    animateDecimal,
    animateDecimalStat,
  };
})();
