# 🛡️ Login Assistant

A local-only web application that searches gaming account credentials from a multi-tab Google Spreadsheet and automatically logs into websites using Playwright browser automation.

> 🚀 **Zero Google Cloud Setup**: No Google Cloud Console, no API keys, no Service Accounts, and no billing required!

---

## 📑 Google Spreadsheet Structure

- **Tab Name** = **COMPANY** (e.g. `HOLSPIN`, `BETSDOGGY`, `BETWAY`)
- **Column A** = **GAME** (e.g. `JILI`, `JULI`, `1XBET`)
- **Column B** = **WEBSITE URL** (e.g. `https://example.com/login`)
- **Column C** = **USERNAME**
- **Column D** = **PASSWORD**

Any additional columns in the sheet are safely ignored.

---

## ⚡ Core Features

- **Zero Google Cloud Setup**:
  - Connects directly to your Google Spreadsheet via link sharing ("Anyone with the link can view").
  - You can also paste your Google Sheet link directly into the web UI setting drawer without editing files.
  - Also supports 100% offline local `accounts.xlsx` files!
- **Forgiving Autocomplete Search**:
  - Type `HOLSPIN JILI`, `holspin jili`, or partial prefixes like `holspin ji`.
  - Case-insensitive search with automatic whitespace trimming.
  - Suggestions dropdown with keyboard navigation (↑, ↓, Enter).
  - Pressing **ENTER** matches the Company + Game and immediately initiates automated login.
- **Account Summary Card**:
  - Displays matched Company, Game, Website URL, and Username.
  - Password is masked by default (`••••••••`) with a toggle eye icon.
- **Playwright Headed Automation**:
  - Chromium browser launches visibly on your desktop (`headless: false`).
  - Automatic detection of Username/Email inputs, Password inputs, and Sign-in/Login buttons using resilient multi-selector heuristics.
  - Support for multi-step login flows (e.g. Email → Next → Password → Submit).
  - Keeps browser window open after login (`keepBrowserOpen: true`) so you can use the account immediately.
- **Site-Specific Profiles**:
  - Modular selector configuration system located in `backend/src/sites/` (`HOLSPIN.ts`, `BETSDOGGY.ts`, etc.).
- **Real-Time Live Status**:
  - Step-by-step progress indicator streamed from backend via Server-Sent Events (SSE).
- **Recent Logins & ⭐ Favorites**:
  - One-click launch for frequently used company/game accounts.
  - Stored locally in your browser (passwords are **never** stored in browser `localStorage`).
- **Data Caching & Refresh**:
  - Fast in-memory cache of Sheet tabs and rows.
  - Instant cache reload button ("Refresh Data").

---

## 🚀 Quick Start

### 1. Install Dependencies & Playwright

```bash
npm run install:all
cd backend
npx playwright install chromium
```

### 2. Start Application

```bash
npm run dev
```

- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:3001`

---

## 🔗 Connecting Your Google Spreadsheets (Supports 2 Sheets, Zero Cloud)

1. Open your Google Spreadsheet(s) in your browser.
2. Click **Share** (top right) → Change General access to **"Anyone with the link can view"**.
3. Copy the spreadsheet URL or ID.
4. You can either:
   - **Method A (Direct in UI)**: Open `http://localhost:5173`, click the **Settings** slider icon (top right), paste your links for **Sheet 1** and **Sheet 2** (with optional custom names), and click **"Sync & Load Google Sheets"**.
   - **Method B (via .env)**: Create a `.env` file in the project root with:
     ```env
     GOOGLE_SHEET_ID_1=https://docs.google.com/spreadsheets/d/your_first_sheet_id/edit
     GOOGLE_SHEET_NAME_1=Primary Accounts

     GOOGLE_SHEET_ID_2=https://docs.google.com/spreadsheets/d/your_second_sheet_id/edit
     GOOGLE_SHEET_NAME_2=Secondary Accounts
     ```
     *(Legacy single `GOOGLE_SHEET_ID` is also still supported)*

---

## 🔒 Security Practices

1. Passwords and credentials are **never** logged to the terminal or console.
2. Passwords are **never** stored in browser `localStorage` (only company and game names for recent history).
3. Passwords in the UI preview are masked with dots by default.
4. Playwright automation is executed directly by the local Node backend.