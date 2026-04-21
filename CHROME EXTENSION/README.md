### CHROME EXTENSION

### Internship Details

* Company: CODTECH IT SOLUTIONS PVT. LTD.
* Name: Sujeet Kumar Yadav
* Intern ID: CTS1663
* Domain: Full Stack Web Development
* Duration: 30 December 2025 – 21 April 2026
* Mentor: Neela Santhosh Kumar




# FocusTrack — Chrome extension + productivity analytics

FocusTrack is a Chrome extension that measures time on websites, labels visits as **productive**, **neutral**, or **unproductive**, syncs totals to a small Node.js backend, and shows a **weekly dashboard** with charts and a short productivity summary.



## Quick start

### 1. Backend

```bash
cd server
npm install
npm start
```

The API and dashboard default to **http://localhost:3847**. Open **http://localhost:3847/dashboard/** after the server is running.

### 2. Load the extension

1. Open Chrome → **Extensions** → enable **Developer mode**.
2. **Load unpacked** → select the `extension` folder inside this project.
3. Open the extension **Options** and confirm the backend URL is `http://localhost:3847` (default).
4. Copy your **User id** from the options page; paste it into the dashboard to load your weekly report (or open the dashboard from the popup link, which includes `?userId=`).

