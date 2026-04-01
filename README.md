# 💸 Budget Tracker

> *Save today, Smiles Tomorrow*

A mobile-friendly web app to track daily spending, visualize expenses by category, and stay within your budget — no backend, no setup, just open and use.

---

## ✨ Features

- **Total Balance** — live balance display with transaction count
- **Spending Mood** — motivational messages based on how much of your limit you've used
- **Add Transactions** — log expenses with name, amount, category, and date
- **Custom Categories** — add and delete your own spending categories beyond the built-ins (Food, Transport, Fun)
- **Delete Transactions** — remove any entry from the list
- **Pie Chart** — doughnut chart showing spending distribution by category (powered by Chart.js)
- **Monthly & Yearly Summary** — filter total spending by month or year
- **Sort Transactions** — sort by date, amount (high/low), or category
- **Spending Limit** — set a budget limit; items over the limit are highlighted and a warning appears on the balance card
- **Currency Selector** — switch between USD, EUR, GBP, IDR, JPY, SGD
- **Export as Infographic** — snapshot the app as a PNG with a custom report name
- **Dark / Light Mode** — toggle with one tap, preference saved
- **Persistent Storage** — all data saved in browser localStorage, survives page refresh

---

## 🚀 Getting Started

No install or build step needed.

1. Clone or download this repository
2. Open `index.html` in any modern browser

```bash
git clone https://github.com/your-username/expense-visualizer.git
cd expense-visualizer
# open index.html in your browser
```

Or just double-click `index.html`.

---

## 📁 Project Structure

```
expense-visualizer/
├── index.html        # App structure
├── css/
│   └── style.css     # All styling, light/dark themes
└── js/
    └── app.js        # All logic, state, and rendering
```

---

## 🛠 Tech Stack

| Layer   | Technology          |
|---------|---------------------|
| Structure | HTML5             |
| Styling   | CSS3 (custom properties, flexbox) |
| Logic     | Vanilla JavaScript (no frameworks) |
| Chart     | [Chart.js](https://www.chartjs.org/) via CDN |
| Export    | [html2canvas](https://html2canvas.hertzen.com/) via CDN |
| Storage   | Browser localStorage |

---

## 💬 Spending Mood Messages

When a spending limit is set, the balance card shows a message based on how much you've used:

| Usage       | Message |
|-------------|---------|
| 0 – 25%     | Get some coffee and castengel please!. Love yourself! |
| 25.1 – 50%  | You might forget to buy something! |
| 50.1 – 75%  | Wise spending and saving! |
| 75.1 – 90%  | You saved little smile for tomorrow! |
| 90.1 – 100% | It's okay to reach your budget limit |
| 100.1 – 120% | Don't overthink the overbudget, it may important purchase for you |
| > 120%      | whoaa, be wise, that's overbudget |

---

## 🌐 Live Demo

Deployed via GitHub Pages:
**[https://argaindrawan.github.io/expense-visualizer](https://argaindrawan.github.io/expense-visualizer)**


---

## 👤 Author

**Arga Dwi Indrawan**
Built with [Kiro](https://kiro.dev)
