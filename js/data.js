// ============================================================
// FoodRescue — Data Layer
// Manages seed data, localStorage persistence, and business logic
// ============================================================

const FRData = (() => {
  // Build closing times relative to now at page load
  const _pageLoadTime = new Date();
  const mkClose = (hoursFromNow) => {
    const d = new Date(_pageLoadTime);
    d.setTime(d.getTime() + hoursFromNow * 3600000);
    return d.toISOString();
  };

  const SEED_LISTINGS = [
    {
      id: 'l1', restaurantId: 'r1',
      restaurantName: 'Bella Italia', restaurantRating: 4.7,
      address: '42 Maple Street, Downtown',
      cuisine: 'Italian', emoji: '🍝',
      name: 'Pasta Carbonara Box',
      description: 'Creamy carbonara with pancetta, pecorino romano and fresh black pepper. Perfectly portioned for one.',
      originalPrice: 18.00, quantity: 4, closingTime: mkClose(1.5),
      isDonation: false, distance: 0.8, tags: ['pasta', 'meat'],
    },
    {
      id: 'l2', restaurantId: 'r2',
      restaurantName: 'Green Bowl', restaurantRating: 4.9,
      address: '8 Park Avenue, Midtown',
      cuisine: 'Vegan', emoji: '🥗',
      name: 'Buddha Bowl (Large)',
      description: 'Quinoa, roasted sweet potato, avocado, chickpeas and house-made tahini dressing. 100% plant-based.',
      originalPrice: 14.00, quantity: 6, closingTime: mkClose(0.5),
      isDonation: false, distance: 1.2, tags: ['vegan', 'healthy', 'glutenfree'],
    },
    {
      id: 'l3', restaurantId: 'r3',
      restaurantName: 'Sakura Sushi', restaurantRating: 4.8,
      address: '17 Cherry Blossom Lane',
      cuisine: 'Japanese', emoji: '🍱',
      name: 'Mixed Sushi Platter (12pc)',
      description: 'Assorted nigiri and maki rolls: salmon, tuna, cucumber, avocado, and spicy mayo.',
      originalPrice: 24.00, quantity: 3, closingTime: mkClose(2.2),
      isDonation: false, distance: 2.1, tags: ['sushi', 'seafood'],
    },
    {
      id: 'l4', restaurantId: 'r4',
      restaurantName: 'Mumbai Masala', restaurantRating: 4.6,
      address: '91 Spice Road, East Quarter',
      cuisine: 'Indian', emoji: '🍛',
      name: 'Butter Chicken + Naan',
      description: 'Rich tomato-cream butter chicken with two garlic naan breads. Serves 2 comfortably.',
      originalPrice: 22.00, quantity: 5, closingTime: mkClose(1.0),
      isDonation: false, distance: 0.5, tags: ['curry', 'meat'],
    },
    {
      id: 'l5', restaurantId: 'r5',
      restaurantName: 'El Rancho', restaurantRating: 4.5,
      address: '55 Fiesta Boulevard',
      cuisine: 'Mexican', emoji: '🌮',
      name: 'Taco Trio Box',
      description: 'Three soft shell tacos with grilled chicken, fresh guac, pico de gallo and sour cream.',
      originalPrice: 16.00, quantity: 8, closingTime: mkClose(0.35),
      isDonation: false, distance: 1.8, tags: ['tacos', 'meat'],
    },
    {
      id: 'l6', restaurantId: 'r6',
      restaurantName: 'The Bread Basket', restaurantRating: 4.8,
      address: '3 Baker Street, Old Town',
      cuisine: 'Bakery', emoji: '🥐',
      name: 'Pastry Surprise Box',
      description: 'Assorted freshly-baked pastries: croissants, pain au chocolat, and Danish. 4 items.',
      originalPrice: 12.00, quantity: 10, closingTime: mkClose(0.25),
      isDonation: true, distance: 0.3, tags: ['bakery', 'sweet'],
    },
    {
      id: 'l7', restaurantId: 'r7',
      restaurantName: 'Seoul Kitchen', restaurantRating: 4.7,
      address: '22 Kimchi Lane, Koreatown',
      cuisine: 'Korean', emoji: '🍜',
      name: 'Bibimbap + Miso Soup',
      description: 'Classic bibimbap with mixed vegetables, gochujang chili paste, soft egg and sesame oil.',
      originalPrice: 15.00, quantity: 4, closingTime: mkClose(1.75),
      isDonation: false, distance: 3.0, tags: ['korean', 'rice', 'vegetarian'],
    },
    {
      id: 'l8', restaurantId: 'r8',
      restaurantName: 'Pizzeria Roma', restaurantRating: 4.6,
      address: '7 Colosseum Way, Westside',
      cuisine: 'Pizza', emoji: '🍕',
      name: 'Half Margherita Pizza',
      description: '4 generous slices of stone-baked margherita with fresh basil and buffalo mozzarella.',
      originalPrice: 13.00, quantity: 6, closingTime: mkClose(2.5),
      isDonation: false, distance: 1.4, tags: ['pizza', 'vegetarian'],
    },
    {
      id: 'l9', restaurantId: 'r9',
      restaurantName: 'Dragon Palace', restaurantRating: 4.5,
      address: '99 Dragon Street, Chinatown',
      cuisine: 'Chinese', emoji: '🥟',
      name: 'Dim Sum Basket (10pc)',
      description: 'Assorted steamed dumplings: har gow, siu mai, cheung fun and taro puffs.',
      originalPrice: 20.00, quantity: 5, closingTime: mkClose(0.75),
      isDonation: false, distance: 2.5, tags: ['dim sum', 'seafood'],
    },
  ];

  const SEED_IMPACT = {
    totalMealsSaved: 24731,
    totalKgRescued: 6842,
    co2ReducedKg: 14250,
    restaurantsOnboard: 1248,
    weeklyGoalMeals: 5000,
    weeklyMealsSaved: 3827,
    dailyData: [412, 558, 387, 621, 490, 534, 415],
  };

  // ---- localStorage keys ----
  const KEY_LISTINGS     = 'fr_listings_v2';
  const KEY_RESERVATIONS = 'fr_reservations_v2';
  const KEY_IMPACT       = 'fr_impact_v2';
  const KEY_SEED_TIME    = 'fr_seed_time';

  function initSeedListings() {
    const seeded = SEED_LISTINGS.map(l => ({ ...l, quantityLeft: l.quantity }));
    localStorage.setItem(KEY_LISTINGS, JSON.stringify(seeded));
    localStorage.setItem(KEY_SEED_TIME, Date.now().toString());
    return seeded;
  }

  function loadListings() {
    const stored = localStorage.getItem(KEY_LISTINGS);
    if (!stored) return initSeedListings();
    const listings = JSON.parse(stored);
    // If all seed listings have expired, re-seed with fresh times
    const seedIds = SEED_LISTINGS.map(l => l.id);
    const seedListings = listings.filter(l => seedIds.includes(l.id));
    const allExpired = seedListings.every(l => new Date(l.closingTime) <= new Date());
    if (allExpired && seedListings.length > 0) {
      // Re-seed expired items with fresh times, keep user-added listings
      const userListings = listings.filter(l => !seedIds.includes(l.id));
      const freshSeed = SEED_LISTINGS.map(l => ({ ...l, quantityLeft: l.quantity }));
      const merged = [...freshSeed, ...userListings];
      localStorage.setItem(KEY_LISTINGS, JSON.stringify(merged));
      return merged;
    }
    return listings.map(l => ({
      ...l,
      quantityLeft: l.quantityLeft !== undefined ? l.quantityLeft : l.quantity,
    }));
  }

  function saveListings(listings) {
    localStorage.setItem(KEY_LISTINGS, JSON.stringify(listings));
  }

  function loadReservations() {
    const stored = localStorage.getItem(KEY_RESERVATIONS);
    return stored ? JSON.parse(stored) : [];
  }

  function saveReservations(reservations) {
    localStorage.setItem(KEY_RESERVATIONS, JSON.stringify(reservations));
  }

  function loadImpact() {
    const stored = localStorage.getItem(KEY_IMPACT);
    return stored ? JSON.parse(stored) : { ...SEED_IMPACT };
  }

  function saveImpact(impact) {
    localStorage.setItem(KEY_IMPACT, JSON.stringify(impact));
  }

  function resetDemo() {
    localStorage.removeItem(KEY_LISTINGS);
    localStorage.removeItem(KEY_RESERVATIONS);
    localStorage.removeItem(KEY_IMPACT);
    localStorage.removeItem(KEY_SEED_TIME);
  }

  // ---- Discount logic ----
  // Discount tiers based on minutes until closing
  function calcDiscount(closingTimeISO) {
    const minsLeft = (new Date(closingTimeISO) - new Date()) / 60000;
    if (minsLeft <= 0)  return 80;
    if (minsLeft <= 30) return 80;
    if (minsLeft <= 60) return 65;
    if (minsLeft <= 120) return 50;
    return 30;
  }

  function calcDiscountedPrice(originalPrice, closingTimeISO) {
    const disc = calcDiscount(closingTimeISO);
    return +(originalPrice * (1 - disc / 100)).toFixed(2);
  }

  return {
    loadListings,
    saveListings,
    loadReservations,
    saveReservations,
    loadImpact,
    saveImpact,
    resetDemo,
    calcDiscount,
    calcDiscountedPrice,
    SEED_IMPACT,
  };
})();
