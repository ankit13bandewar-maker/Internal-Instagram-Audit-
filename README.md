# Instagram Account Audit + Competitor Audit

A high-fidelity full-stack analytics application designed to run deep-dive audits on public Instagram profiles and execute competitive analysis grids. Built with a fast Python backend and a modern Next.js/Tailwind CSS frontend dashboard, the system enforces a strict live-data validation pipeline.

---

## 🚀 Core Features Included

### 📊 Advanced Benchmark vs. Niche Analytics
* **Inverse-Bracket Tier System:** Classifies handles into targeted weight classes (Micro-Influencers at 3.5% baseline, Mid-Tier at 2.0%, and Macro/Mega creators at 0.8% baseline) to account for algorithmic reach suppression as an audience expands.
* **Dynamic Performance Slider:** Uses relative bounding linear mapping to plot an account's efficiency rating precisely against its industry peer median.

### 📈 Posts Reach Distribution Curve
* **Visual Reach Waves:** Evaluates live public metrics from the latest 15 posts and processes public video/Reels view data as a precise, high-integrity proxy for organic platform reach.
* **Smooth Spline Chronological Track:** Renders an ultra-clean, responsive Recharts monotone wave displaying performance velocity peaks and engagement patterns over a left-to-right timeline—completely free of distracting layout anchor dots.

### 🔍 Live Post-by-Post Audit Verification
* **Itemized Metric Breakdown:** A clean, scannable tabular view component itemizing every single audited item in the loop.
* **Format-Aware Logic:** Automatically distinguishes between media types, processing Reels/videos with shorthand numerical notations (e.g., `3.2M`, `45k`) while handling static images gracefully to prevent metric flatlines or 0% layout crashes.

---

## 🛠️ Architecture & Tech Stack

The workspace is cleanly divided into decoupled client and server layers:
* **Frontend Component Engine:** Vanilla HTML5, CSS3, and JavaScript (ES6+), using Chart.js for data visualization and Lucide for icons.
* **Backend Processing Pipeline:** Python (FastAPI framework), native date handling, and data transformation blocks.
* **Live Scraper Orchestration:** Strict live-or-nothing pass-through pipeline executing live actor workflows via Apify, completely free of synthetic mock files or outdated offline fallback states.

---

## ⚙️ Local Setup and Installation

### 1. Backend Service Configuration
Navigate to the server directory, establish a virtual environment, install dependencies, and run:
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Configuration
You can start a local static server to serve the vanilla frontend:
```bash
# From the root directory:
npm run vanilla
```
This serves the application on [http://localhost:5000](http://localhost:5000).

### Directory Structure
```text
├── backend/            # Python metric calculations, parsing scripts, and scraping routing logic
├── frontend-vanilla/   # Vanilla HTML, CSS, and JS dashboard assets
├── .gitignore          # Environment variables and node_modules blocking rules
├── package.json        # Main project manifest config scripts tracking
└── render.yaml         # Cloud deployment specifications for hosting environments
```
