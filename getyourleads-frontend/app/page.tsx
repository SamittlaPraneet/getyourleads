"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");

  const [leads, setLeads] = useState<any[]>([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // ================= FETCH =================
  const fetchHistory = async () => {
    const res = await fetch(`${API_BASE}/api/search-history`);
    const data = await res.json();
    setHistory(data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchLeads = async (pageNumber = 1, pageLimit = limit) => {
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/api/search-leads?page=${pageNumber}&limit=${pageLimit}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, location, area }),
      }
    );

    const data = await res.json();

    setLeads(data.leads || []);
    setPage(data.page);
    setTotalPages(data.total_pages);
    setSearchId(data.search_id);

    setLoading(false);
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchLeads(1, limit);
    fetchHistory();
  };

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

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 p-5 flex flex-col"
      >
        <h1 className="text-xl font-semibold mb-6 tracking-tight">
          GetYourLeads
        </h1>

        <p className="text-xs text-gray-400 mb-3">Recent</p>

        <div className="space-y-2 overflow-y-auto">
          {history.map((item: any) => (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={item.id}
              onClick={() => {
                setKeyword(item.keyword);
                setLocation(item.location);
                setArea(item.area);
                fetchLeads(1, limit);
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
            >
              <p className="text-sm">{item.keyword}</p>
              <p className="text-xs text-gray-400">
                {item.area}, {item.location}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">

        {/* Header */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center px-8 py-5 border-b border-white/10 backdrop-blur-xl bg-white/5"
        >
          <h2 className="text-lg font-medium">Lead Intelligence</h2>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-xl shadow-lg"
          >
            Export
          </motion.button>
        </motion.div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-auto">

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl"
          >
            <div className="grid grid-cols-3 gap-4">
              <input
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <input
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <input
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2"
                placeholder="Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 rounded-xl shadow-xl"
            >
              {loading ? "Searching..." : "Search"}
            </motion.button>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
          >

            {/* Top bar */}
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <span className="text-sm text-gray-300">
                Results
              </span>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  fetchLeads(1, Number(e.target.value));
                }}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-1"
              >
                {[10, 20, 50, 100].map((v) => (
                  <option key={v}>{v} / page</option>
                ))}
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-6 text-center text-gray-400 animate-pulse">
                Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No results
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Address</th>
                    <th className="p-4 text-center">Rating</th>
                    <th className="p-4 text-center">Maps</th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead, i) => (
                    <motion.tr
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="p-4 font-medium">{lead.name}</td>
                      <td className="p-4 text-gray-300">
                        {lead.address}
                      </td>
                      <td className="p-4 text-center">
                        {lead.rating || "-"}
                      </td>
                      <td className="p-4 text-center">
                        <a
                          href={lead.maps_url}
                          target="_blank"
                          className="text-blue-400 hover:underline"
                        >
                          Open
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center p-5 border-t border-white/10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fetchLeads(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-white/10 rounded"
              >
                Prev
              </motion.button>

              <span className="text-sm text-gray-400">
                {page} / {totalPages}
              </span>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fetchLeads(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-white/10 rounded"
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}