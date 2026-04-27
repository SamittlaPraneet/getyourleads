const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const Database = require("better-sqlite3");
const { Parser } = require("json2csv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const db = new Database("leads.db");

// ================= DB =================
db.exec(`
CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT,
  location TEXT,
  area TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id INTEGER,
  place_id TEXT,
  name TEXT,
  address TEXT,
  rating REAL,
  reviews INTEGER,
  maps_url TEXT
);
`);

// ================= FETCH =================
const fetchLeadsFromGoogle = async ({ keyword, location, area }) => {
  const geo = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address: `${area || ""} ${location}`,
        key: API_KEY,
      },
    }
  );

  const { lat, lng } = geo.data.results[0].geometry.location;

  const step = 0.01;
  const grid = [];

  for (let i of [-step, 0, step]) {
    for (let j of [-step, 0, step]) {
      grid.push({ lat: lat + i, lng: lng + j });
    }
  }

  let all = [];

  for (let p of grid) {
    const res = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery: `${keyword} in ${area || location}`,
        locationBias: {
          circle: {
            center: {
              latitude: p.lat,
              longitude: p.lng,
            },
            radius: 1200,
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.id",
        },
      }
    );

    all.push(...(res.data.places || []));
  }

  const map = new Map();
  all.forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p);
  });

  return Array.from(map.values()).map((p) => ({
    place_id: p.id,
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    rating: p.rating || null,
    reviews: p.userRatingCount || 0,
    maps_url: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
  }));
};

// ================= SEARCH =================
app.post("/api/search-leads", async (req, res) => {
  const { keyword, location, area } = req.body;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // CHECK CACHE
  const existing = db
    .prepare(
      `SELECT * FROM searches WHERE keyword=? AND location=? AND area=?`
    )
    .get(keyword, location, area);

  if (existing) {
    const total = db
      .prepare(`SELECT COUNT(*) as count FROM leads WHERE search_id=?`)
      .get(existing.id).count;

    const rows = db
      .prepare(
        `SELECT * FROM leads WHERE search_id=? LIMIT ? OFFSET ?`
      )
      .all(existing.id, limit, offset);

    return res.json({
      search_id: existing.id,
      total,
      page,
      total_pages: Math.ceil(total / limit),
      leads: rows,
    });
  }

  // NEW SEARCH
  const leads = await fetchLeadsFromGoogle({ keyword, location, area });

  const result = db
    .prepare(
      `INSERT INTO searches (keyword, location, area) VALUES (?, ?, ?)`
    )
    .run(keyword, location, area);

  const searchId = result.lastInsertRowid;

  const stmt = db.prepare(`
    INSERT INTO leads (search_id, place_id, name, address, rating, reviews, maps_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  leads.forEach((l) => {
    stmt.run(
      searchId,
      l.place_id,
      l.name,
      l.address,
      l.rating,
      l.reviews,
      l.maps_url
    );
  });

  return res.json({
    search_id: searchId,
    total: leads.length,
    page,
    total_pages: Math.ceil(leads.length / limit),
    leads: leads.slice(offset, offset + limit),
  });
});

// ================= GET LEADS BY SEARCH =================
app.get("/api/leads", (req, res) => {
  const { search_id, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM leads WHERE search_id=?`)
    .get(search_id).count;

  const rows = db
    .prepare(
      `SELECT * FROM leads WHERE search_id=? LIMIT ? OFFSET ?`
    )
    .all(search_id, limit, offset);

  res.json({
    total,
    page: Number(page),
    total_pages: Math.ceil(total / limit),
    leads: rows,
  });
});

// ================= HISTORY =================
app.get("/api/search-history", (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM searches ORDER BY created_at DESC`)
    .all();

  res.json(rows);
});

// ================= EXPORT =================
app.post("/api/export-leads", (req, res) => {
  const { search_id } = req.body;

  const rows = db
    .prepare(`SELECT * FROM leads WHERE search_id=?`)
    .all(search_id);

  const parser = new Parser();
  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(`leads_${search_id}.csv`);
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});