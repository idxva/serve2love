// ============================================================
// FoodRescue — Impact Dashboard Module
// Animated metrics, canvas bar chart, equivalents
// ============================================================

const FRDashboard = (() => {

  function init() {
    const impact = FRData.loadImpact();

    // Big hero counter
    FRApp.animateCounter('impact-total-meals', impact.totalMealsSaved, 2000);

    // Metric cards
    FRApp.animateDecimal('impact-total-co2',    impact.co2ReducedKg / 1000, 1800);
    FRApp.animateCounter('impact-total-kg',     impact.totalKgRescued, 1800);
    FRApp.animateCounter('impact-total-water',  Math.round(impact.totalMealsSaved * 50 / 1000), 1800);
    FRApp.animateCounter('impact-restaurants',  impact.restaurantsOnboard, 1500);

    // Equivalents text
    _set('impact-co2-cars',    Math.round(impact.co2ReducedKg / 2.4).toLocaleString());
    _set('impact-kg-meals',    Math.round(impact.totalKgRescued / 0.5).toLocaleString());
    _set('impact-water-days',  Math.round(impact.totalMealsSaved * 50 / 2).toLocaleString());

    // Equivalents cards
    _set('equiv-cars',        Math.round(impact.co2ReducedKg / 2.4).toLocaleString());
    _set('equiv-trees',       Math.round(impact.co2ReducedKg * 10).toLocaleString());
    _set('equiv-lightbulbs',  Math.round(impact.co2ReducedKg * 4450).toLocaleString());
    _set('equiv-flights',     Math.round(impact.co2ReducedKg / 6.25).toLocaleString());

    // Weekly progress bar
    const pct = Math.min((impact.weeklyMealsSaved / impact.weeklyGoalMeals) * 100, 100);
    _set('impact-weekly-text',
      `${impact.weeklyMealsSaved.toLocaleString()} / ${impact.weeklyGoalMeals.toLocaleString()} meals this week`);
    setTimeout(() => {
      const bar = document.getElementById('impact-weekly-progress');
      if (bar) bar.style.width = pct + '%';
    }, 600);

    // Draw chart with a slight delay so canvas is sized
    setTimeout(() => _drawChart(impact.dailyData), 400);
  }

  // ---- Bar Chart ----
  function _drawChart(data) {
    const canvas = document.getElementById('impact-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Responsive sizing
    const W = canvas.parentElement?.offsetWidth || 800;
    const H = 280;
    canvas.width  = W;
    canvas.height = H;

    const DAYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal  = Math.max(...data) * 1.25 || 100;
    const pad     = { top: 24, right: 20, bottom: 48, left: 56 };
    const chartW  = W - pad.left - pad.right;
    const chartH  = H - pad.top - pad.bottom;
    const slotW   = chartW / data.length;
    const barW    = slotW * 0.55;

    ctx.clearRect(0, 0, W, H);

    // Grid lines + Y labels
    const GRIDS = 5;
    for (let i = 0; i <= GRIDS; i++) {
      const y = pad.top + (chartH / GRIDS) * i;
      const v = Math.round(maxVal * (1 - i / GRIDS));
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle   = '#767A77';
      ctx.font        = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign   = 'right';
      ctx.fillText(v.toLocaleString(), pad.left - 8, y + 4);
    }

    // Bars
    data.forEach((val, i) => {
      const x    = pad.left + slotW * i + (slotW - barW) / 2;
      const barH = (val / maxVal) * chartH;
      const y    = pad.top + chartH - barH;
      const r    = Math.min(4, barW / 2);

      // Gradient fill
      const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
      grad.addColorStop(0, '#1B3B2B');
      grad.addColorStop(1, '#2C503D');
      ctx.fillStyle   = grad;
      ctx.strokeStyle = '#1B3B2B';
      ctx.lineWidth   = 1;

      // Rounded-top bar
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Value label
      ctx.fillStyle = '#121413';
      ctx.font      = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, x + barW / 2, y - 7);

      // Day label
      ctx.fillStyle = '#444845';
      ctx.font      = '500 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(DAYS[i], x + barW / 2, H - pad.bottom + 18);
    });

    // X axis
    ctx.strokeStyle = '#E5E3DC';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + chartH);
    ctx.lineTo(W - pad.right, pad.top + chartH);
    ctx.stroke();
  }

  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return { init };
})();
