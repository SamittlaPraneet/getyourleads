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

// ================= DATABASE =================
const db = new Database("leads.db");

// Create tables
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
    place_id TEXT UNIQUE,
    name TEXT,
    address TEXT,
    rating REAL,
    reviews INTEGER,
    maps_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ================= FETCH =================
const fetchLeads = async ({ keyword, location, area }) => {
  const geoResponse = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        address: area ? `${area} ${location}` : location,
        key: API_KEY,
      },
    }
  );

  const { lat, lng } = geoResponse.data.results[0].geometry.location;

  const step = 0.01;
  const gridPoints = [];

  for (let latOffset of [-step, 0, step]) {
    for (let lngOffset of [-step, 0, step]) {
      gridPoints.push({
        lat: lat + latOffset,
        lng: lng + lngOffset,
      });
    }
  }

  let allPlaces = [];

  for (let point of gridPoints) {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery: area
          ? `${keyword} in ${area}`
          : `${keyword} in ${location}`,
        locationBias: {
          circle: {
            center: {
              latitude: point.lat,
              longitude: point.lng,
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

    allPlaces.push(...(response.data.places || []));
    await delay(400);
  }

  const unique = new Map();
  allPlaces.forEach((p) => {
    if (!unique.has(p.id)) unique.set(p.id, p);
  });

  let results = Array.from(unique.values());

  if (area) {
    const areaLower = area.toLowerCase();
    results = results.filter((p) =>
      p.formattedAddress?.toLowerCase().includes(areaLower)
    );
  }

  return results.map((p) => ({
    place_id: p.id,
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    rating: p.rating || null,
    reviews: p.userRatingCount || 0,
    maps_url: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
  }));
};

// ================= SEARCH API =================
app.post("/api/search-leads", async (req, res) => {
  try {
    const { keyword, location, area } = req.body;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const existingSearch = db
      .prepare(
        `SELECT * FROM searches WHERE keyword=? AND location=? AND area=? ORDER BY created_at DESC LIMIT 1`
      )
      .get(keyword, location, area);

    // CACHE HIT
    if (existingSearch) {
      const total = db
        .prepare(`SELECT COUNT(*) as count FROM leads WHERE search_id=?`)
        .get(existingSearch.id).count;

      const rows = db
        .prepare(
          `SELECT * FROM leads WHERE search_id=? LIMIT ? OFFSET ?`
        )
        .all(existingSearch.id, limit, offset);

      return res.json({
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        cached: true,
        search_id: existingSearch.id,
        leads: rows,
      });
    }

    // NEW SEARCH
    const leads = await fetchLeads({ keyword, location, area });

    const insertSearch = db
      .prepare(`INSERT INTO searches (keyword, location, area) VALUES (?, ?, ?)`)
      .run(keyword, location, area);

    const searchId = insertSearch.lastInsertRowid;

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO leads
      (search_id, place_id, name, address, rating, reviews, maps_url)
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

    const paginated = leads.slice(offset, offset + limit);

    res.json({
      total: leads.length,
      page,
      limit,
      total_pages: Math.ceil(leads.length / limit),
      cached: false,
      search_id: searchId,
      leads: paginated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
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

// ================= HISTORY =================
app.get("/api/search-history", (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM searches ORDER BY created_at DESC`)
    .all();

  res.json(rows);
});

// ================= DEBUG =================
app.get("/api/debug-leads-count", (req, res) => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM leads`).get().count;
  res.json({ total_leads_in_db: count });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});