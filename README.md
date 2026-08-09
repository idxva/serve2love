# Serve2love

A polished, front-end prototype for a sustainable surplus-food marketplace. Serve2love helps restaurants publish surplus meals and lets diners discover discounted or donated food before it goes to waste.

> **Demo project:** All data is simulated in the browser. No real ordering, payments, authentication, or restaurant inventory integrations are included.

## Highlights

- **Customer marketplace** — browse, search, filter, and sort surplus meal listings.
- **Time-based pricing** — discounts automatically increase as pickup closing time approaches.
- **Reservation flow** — reserve a meal and receive a generated QR pickup pass.
- **Restaurant portal** — publish, remove, and reset demo surplus listings.
- **Impact dashboard** — see simulated meals saved, CO₂ avoided, water conserved, and weekly progress.
- **Responsive interface** — designed for desktop and mobile screens.

## Built with

- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- Browser `localStorage` for demo persistence
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) via CDN
- Google Fonts (Playfair Display and Plus Jakarta Sans)

## Run locally

Because this is a static site, no build step or package installation is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-github-username>/serve2love.git
   cd serve2love
   ```
2. Open `index.html` in a modern browser, or serve the directory locally:
   ```bash
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000`.

## How the demo works

The application seeds sample listings when it first loads. Interactions—including meal reservations, inventory changes, and impact metrics—are stored only in the current browser's `localStorage`.

Use **Reset Demo** in the Restaurant Portal to clear locally stored demo data and start again.

## Project structure

```text
serve2love/
├── index.html          # Application markup and views
├── css/
│   └── style.css       # Responsive design system and styles
└── js/
    ├── app.js          # Routing, shared UI, and timers
    ├── customer.js     # Marketplace and reservation experience
    ├── restaurant.js   # Restaurant listing management
    ├── dashboard.js    # Environmental impact dashboard
    └── data.js         # Seed data, localStorage, and pricing logic
```

## Deployment

This repository is ready for GitHub Pages. After enabling Pages from the repository's `master` branch and `/ (root)` folder, it will be available at:

```text
https://<your-github-username>.github.io/serve2love/
```

## Future improvements

- Add real authentication and role-based access.
- Connect restaurant inventory and payment providers.
- Use a backend database and real-time listing updates.
- Add geolocation, maps, notifications, and accessibility audits.

## License

No license has been selected yet. Add one before using this code in a public production project.
