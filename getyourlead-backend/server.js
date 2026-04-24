const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const { Parser } = require("json2csv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ================= DATABASE =================
const db = new sqlite3.Database("./leads.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT,
      location TEXT,
      area TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
    )
  `);
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    allPlaces = [...allPlaces, ...(response.data.places || [])];
    await delay(400);
  }

  const uniqueMap = new Map();
  allPlaces.forEach((place) => {
    if (!uniqueMap.has(place.id)) {
      uniqueMap.set(place.id, place);
    }
  });

  let results = Array.from(uniqueMap.values());

  if (area) {
    const areaLower = area.toLowerCase();
    results = results.filter((place) =>
      place.formattedAddress?.toLowerCase().includes(areaLower)
    );
  }

  return results.map((place) => ({
    place_id: place.id,
    name: place.displayName?.text || "",
    address: place.formattedAddress || "",
    rating: place.rating || null,
    reviews: place.userRatingCount || 0,
    maps_url: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
  }));
};

// ================= SEARCH API =================
app.post("/api/search-leads", async (req, res) => {
  try {
    const { keyword, location, area } = req.body;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.get(
      `SELECT * FROM searches 
       WHERE keyword=? AND location=? AND area=? 
       ORDER BY created_at DESC LIMIT 1`,
      [keyword, location, area],
      async (err, existingSearch) => {
        if (err) return res.status(500).json({ error: "DB error" });

        // ================= CACHE HIT =================
        if (existingSearch) {
          db.get(
            `SELECT COUNT(*) as total FROM leads WHERE search_id=?`,
            [existingSearch.id],
            (err, countResult) => {
              if (err) return res.status(500).json({ error: "DB error" });

              db.all(
                `SELECT * FROM leads WHERE search_id=? LIMIT ? OFFSET ?`,
                [existingSearch.id, limit, offset],
                (err, rows) => {
                  if (err) return res.status(500).json({ error: "DB error" });

                  return res.json({
                    total: countResult.total,
                    page,
                    limit,
                    total_pages: Math.ceil(countResult.total / limit),
                    cached: true,
                    search_id: existingSearch.id, // ✅ FIX
                    leads: rows,
                  });
                }
              );
            }
          );
          return;
        }

        // ================= FIRST SEARCH =================
        const leads = await fetchLeads({ keyword, location, area });

        db.run(
          `INSERT INTO searches (keyword, location, area) VALUES (?, ?, ?)`,
          [keyword, location, area],
          function (err) {
            if (err) return res.status(500).json({ error: "Insert failed" });

            const searchId = this.lastID;

            const stmt = db.prepare(`
              INSERT OR IGNORE INTO leads 
              (search_id, place_id, name, address, rating, reviews, maps_url)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            leads.forEach((lead) => {
              stmt.run(
                searchId,
                lead.place_id,
                lead.name,
                lead.address,
                lead.rating,
                lead.reviews,
                lead.maps_url
              );
            });

            stmt.finalize();

            const paginatedLeads = leads.slice(offset, offset + limit);

            return res.json({
              total: leads.length,
              page,
              limit,
              total_pages: Math.ceil(leads.length / limit),
              cached: false,
              search_id: searchId, // ✅ FIX
              leads: paginatedLeads,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search failed" });
  }
});

// ================= EXPORT =================
app.post("/api/export-leads", (req, res) => {
  const { search_id } = req.body;

  db.all(
    `SELECT * FROM leads WHERE search_id=?`,
    [search_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });

      const parser = new Parser();
      const csv = parser.parse(rows);

      res.header("Content-Type", "text/csv");
      res.attachment(`leads_${search_id}.csv`);
      res.send(csv);
    }
  );
});

// ================= SEARCH HISTORY =================
app.get("/api/search-history", (req, res) => {
  db.all(`SELECT * FROM searches ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(rows);
  });
});

// ================= DEBUG =================
app.get("/api/debug-leads-count", (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM leads`, [], (err, row) => {
    res.json({ total_leads_in_db: row.count });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});