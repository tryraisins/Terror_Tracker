
# 🇳🇬 Nigeria Attack Tracker

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)

An open-source intelligence (OSINT) platform dedicated to tracking, visualizing, and analyzing security incidents across Nigeria in real-time. By leveraging AI-powered news aggregation and verification, this tool provides a comprehensive dashboard for researchers, journalists, and the public to stay informed about the security landscape.

## 🚀 Features

- **Interactive Threat Map**: High-fidelity SVG map of Nigeria with real-time incident plotting. Features include:
  - Accurate geopolitical boundaries for all 36 states + FCT.
  - Heatmap-style intensity indicators.
  - Interactive hover states with detailed statistics per region.
  - Pulse animations for critical/active threat zones.

- **Free, Source-Led Collection**:
  - Polls RSS feeds from established Nigerian publishers; no AI API or paid web-search API is used.
  - Inspects only newly-seen article URLs and retains a receipt for every accepted, rejected, and retrospective article.
  - Publishes only when the article itself contains a recent incident date, Nigerian state, precise town/LGA, and incident language. An article publication date is never treated as an incident date.
  - Older/referenced events are recorded as evidence-only and cannot become new incidents merely because another publisher mentions them.
  - Monitors trusted publishers including:
    - Zagazola Makama (Counter-Insurgency Expert)
    - Peoples Gazette, Premium Times, HumAngle
    - Validated Twitter/X intel accounts
  - Automated deduplication and verification logic to filter noise.
  - Scheduled data updates via cron jobs.

- **Comprehensive Dashboard**:
  - At-a-glance metrics: Total incidents, casualties (killed/injured/kidnapped), and active hotspots.
  - Filtering by date, state, threat level, and group.
  - Timeline visualization of attack frequencies.

- **Incident Reporting**:
  - Detailed list view of all recorded incidents.
  - Searchable database with advanced filters (e.g., by specific terrorist groups or attack types).
  - Source transparency linking back to original news reports.

- **Modern Tech Stack**: Built with performance and aesthetics in mind, featuring a "War Room" dark mode design, glassmorphism UI elements, and responsive layouts.

## 🛠️ Technology Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend**: Next.js API Routes (Serverless)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Collection**: Publisher RSS feeds and deterministic validation (no AI API)
- **Animations**: [GSAP](https://greensock.com/gsap/) & CSS Keyframes
- **Icons**: [Heroicons](https://heroicons.com/)

## 🏁 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (or local MongoDB instance)
- No AI API key is required

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nubiaville/nigeria-attack-tracker.git
    cd nigeria-attack-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add the following keys:

    ```env
    # Database Connection
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/your-db-name

    # Free source-led collection guards
    FREE_SOURCE_MAX_ARTICLE_AGE_HOURS=72
    FREE_SOURCE_MAX_INCIDENT_AGE_DAYS=3

    # Security
    CRON_SECRET=your_random_secure_string_for_cron_jobs
    API_KEY=your_public_api_key_if_needed

    # App Config
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 Automated Data Collection (Cron Jobs)

The system uses an API route (`src/app/api/cron/update/route.ts`) designed to be triggered by an external cron service (like Vercel Cron or cron-job.org).

- **Endpoint**: `POST /api/cron/update`
- **Headers**: `x-cron-secret: <CRON_SECRET>`
- **Function**:
    1.  Fetches only newly-seen articles from trusted publisher RSS feeds.
    2.  Verifies article freshness, explicit incident date, state, town/LGA, and incident language before publishing.
    3.  Treats older/referenced events as evidence-only, never as a new incident.
    4.  Merges only an exact incident fingerprint; fuzzy matches are review-only and never delete records automatically.

## 🧹 Data Integrity & Cleanup

A dedicated cleanup tool is available to retroactively sanitize the database of "attacker-killed" records (e.g., "Troops neutralized 30 terrorists") that may have been ingested.

- **Endpoint**: `POST /api/cleanup`
- **Headers**: `x-cron-secret: <CRON_SECRET>`
- **Body**: `{ "dryRun": true }` (default) or `{ "dryRun": false }` (delete mode)

The cleanup logic uses regex patterns to identify casualty reports associated purely with insurgents, while protecting records that mention civilian or security force victims (e.g., "Soldiers killed", "Professor abducted").

## 🤝 Contributing

Contributions are welcome! This project is open-source and relies on community support to improve accuracy and features.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## ⚠️ Disclaimer

This tool aggregates data from various public sources. While we strive for accuracy through AI verification and manual review, data may prompt to errors or delays. This platform is for informational purposes only and should not be the sole source for critical security decisions.

---

**Built with ❤️ for a safer Nigeria.**
