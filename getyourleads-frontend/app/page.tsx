"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [searchId, setSearchId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

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
        body: JSON.stringify({
          keyword,
          location,
          area,
        }),
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

  const loadFromHistory = async (item: any) => {
    setKeyword(item.keyword);
    setLocation(item.location);
    setArea(item.area);
    fetchLeads(1, limit);
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
    <div className="flex h-screen bg-gray-100">

      <div className="w-72 bg-white border-r p-4">
        <h2 className="text-lg font-bold mb-4">Search History</h2>

        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => loadFromHistory(item)}
            className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
          >
            <p className="font-semibold">{item.keyword}</p>
            <p className="text-xs text-gray-500">
              {item.area}, {item.location}
            </p>
          </div>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-auto">

        <h1 className="text-2xl font-bold mb-6">GetYourLeads 🚀</h1>

        <div className="bg-white p-5 rounded-xl shadow mb-6">
          <div className="grid grid-cols-3 gap-4">
            <input className="border p-2 rounded" placeholder="Keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>

          <button onClick={handleSearch} className="mt-4 bg-blue-600 text-white px-5 py-2 rounded">
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Results</h2>

            <div className="flex gap-2">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  fetchLeads(1, Number(e.target.value));
                }}
                className="border p-2 rounded"
              >
                {[5, 10, 20, 50, 100].map((val) => (
                  <option key={val}>{val} / page</option>
                ))}
              </select>

              <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded">
                Export
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : leads.length === 0 ? (
            <p>No results</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Address</th>
                    <th className="p-2">Rating</th>
                    <th className="p-2">Maps</th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{lead.name}</td>
                      <td className="p-2">{lead.address}</td>
                      <td className="p-2 text-center">{lead.rating || "-"}</td>
                      <td className="p-2 text-center">
                        <a href={lead.maps_url} target="_blank" className="text-blue-600">
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between mt-4">
                <button onClick={() => fetchLeads(page - 1)} disabled={page === 1}>Prev</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => fetchLeads(page + 1)} disabled={page === totalPages}>Next</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}