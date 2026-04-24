"use client";

import { useEffect, useState } from "react";

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

  // ================= UI =================
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-5 flex flex-col">
        <h1 className="text-xl font-bold mb-6">GetYourLeads</h1>

        <h2 className="text-sm font-semibold text-gray-500 mb-2">
          Recent Searches
        </h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          {history.map((item: any) => (
            <div
              key={item.id}
              onClick={() => {
                setKeyword(item.keyword);
                setLocation(item.location);
                setArea(item.area);
                fetchLeads(1, limit);
              }}
              className="p-3 rounded-lg border hover:bg-gray-100 cursor-pointer transition"
            >
              <p className="font-medium">{item.keyword}</p>
              <p className="text-xs text-gray-500">
                {item.area}, {item.location}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">

        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Lead Dashboard</h2>

          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm"
          >
            Export CSV
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-auto">

          {/* Search Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="grid grid-cols-3 gap-4">
              <input
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <input
                className="border p-2 rounded-lg"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <input
                className="border p-2 rounded-lg"
                placeholder="Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <button
              onClick={handleSearch}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-sm border">

            {/* Controls */}
            <div className="flex justify-between items-center p-4 border-b">
              <span className="font-medium">Results</span>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  fetchLeads(1, Number(e.target.value));
                }}
                className="border rounded-lg p-2"
              >
                {[10, 20, 50, 100].map((v) => (
                  <option key={v}>{v} / page</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center">Loading...</div>
              ) : leads.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No results yet
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Address</th>
                      <th className="p-3 text-center">Rating</th>
                      <th className="p-3 text-center">Maps</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{lead.name}</td>
                        <td className="p-3">{lead.address}</td>
                        <td className="p-3 text-center">
                          {lead.rating || "-"}
                        </td>
                        <td className="p-3 text-center">
                          <a
                            href={lead.maps_url}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 border-t">
              <button
                onClick={() => fetchLeads(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>

              <span className="text-sm">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => fetchLeads(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}