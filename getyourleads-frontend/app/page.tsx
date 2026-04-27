"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  // ================= FORM =================
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [radius, setRadius] = useState(""); // optional

  // ================= DATA =================
  const [leads, setLeads] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // ================= FETCH HISTORY =================
  const fetchHistory = async () => {
    const res = await fetch(`${API_BASE}/api/search-history`);
    const data = await res.json();
    setHistory(data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ================= SEARCH =================
  const handleSearch = async () => {
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/api/search-leads?page=1&limit=${limit}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          country,
          state: stateVal,
          city,
          street,
          radius: radius ? Number(radius) : null,
        }),
      }
    );

    const data = await res.json();

    setLeads(data.leads);
    setSearchId(data.search_id);
    setPage(data.page);
    setTotalPages(data.total_pages);

    setLoading(false);
    fetchHistory();
  };

  // ================= FETCH BY SEARCH ID =================
  const fetchBySearchId = async (id: number, pageNum = 1, pageLimit = limit) => {
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/api/leads?search_id=${id}&page=${pageNum}&limit=${pageLimit}`
    );

    const data = await res.json();

    setLeads(data.leads);
    setPage(data.page);
    setTotalPages(data.total_pages);
    setSearchId(id);

    setLoading(false);
  };

  // ================= HISTORY =================
  const handleHistoryClick = (item: any) => {
    setKeyword(item.keyword);
    setCountry(item.country || "");
    setStateVal(item.state || "");
    setCity(item.city || "");
    setStreet(item.street || "");
    setRadius(item.radius || "");

    fetchBySearchId(item.id, 1, limit);
  };

  // ================= PAGINATION =================
  const handleNext = () => {
    if (!searchId || page === totalPages) return;
    fetchBySearchId(searchId, page + 1, limit);
  };

  const handlePrev = () => {
    if (!searchId || page === 1) return;
    fetchBySearchId(searchId, page - 1, limit);
  };

  // ================= LIMIT =================
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    if (!searchId) return;
    fetchBySearchId(searchId, 1, newLimit);
  };

  // ================= EXPORT =================
  const handleExport = async () => {
    if (!searchId) return;

    const res = await fetch(`${API_BASE}/api/export-leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ search_id: searchId }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${searchId}.csv`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 p-5 flex flex-col">
        <h1 className="text-xl font-semibold mb-6">GetYourLeads</h1>

        <p className="text-xs text-gray-400 mb-3">Recent Searches</p>

        <div className="space-y-2 overflow-y-auto">
          {history.map((item: any) => (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={item.id}
              onClick={() => handleHistoryClick(item)}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <p className="text-sm">{item.keyword}</p>
              <p className="text-xs text-gray-400">
                {item.city}, {item.state}
              </p>
            </motion.div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-white/10">
          <h2 className="text-lg">Lead Intelligence</h2>

          <button
            onClick={handleExport}
            className="bg-blue-600 px-4 py-2 rounded-xl"
          >
            Export
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-6 overflow-auto">

          {/* SEARCH FORM */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <div className="grid grid-cols-3 gap-4">

              <input placeholder="Keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-2 rounded-xl"
              />

              <input placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-2 rounded-xl"
              />

              <input placeholder="State"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-2 rounded-xl"
              />

              <input placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-2 rounded-xl"
              />

              <input placeholder="Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-2 rounded-xl"
              />

              <input placeholder="Radius (meters - optional)"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-2 rounded-xl"
              />

            </div>

            <button
              onClick={handleSearch}
              className="mt-4 bg-blue-600 px-5 py-2 rounded-xl"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* RESULTS */}
          <div className="bg-white/5 rounded-2xl border border-white/10">

            <div className="flex justify-between p-4 border-b border-white/10">
              <span>Results</span>

              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-black/30 border border-white/10 rounded px-2"
              >
                {[5, 10, 15, 20, 50, 100].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="p-4">{lead.name}</td>
                      <td className="p-4">{lead.address}</td>
                      <td className="p-4">{lead.rating || "-"}</td>
                      <td className="p-4">
                        <a
                          href={lead.maps_url}
                          target="_blank"
                          className="text-blue-400"
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-between p-4 border-t border-white/10">
              <button onClick={handlePrev}>Prev</button>
              <span>{page} / {totalPages}</span>
              <button onClick={handleNext}>Next</button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}