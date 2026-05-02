"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Empty State Illustrations ────────────────────────────────────────────
const EmptySearchIllustration = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#FEF0D4" />
    <circle cx="32" cy="31" r="13" stroke="#F5A623" strokeWidth="2.5" fill="none" />
    <line x1="41.5" y1="41.5" x2="52" y2="52" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="27" y1="31" x2="37" y2="31" stroke="#E09520" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="26" x2="32" y2="36" stroke="#E09520" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const EmptyResultIllustration = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#FAF7F4" />
    <rect x="18" y="22" width="36" height="6" rx="3" fill="#EDE8E1" />
    <rect x="18" y="33" width="28" height="6" rx="3" fill="#EDE8E1" />
    <rect x="18" y="44" width="20" height="6" rx="3" fill="#EDE8E1" />
    <circle cx="52" cy="48" r="10" fill="#FEF0D4" stroke="#F5A623" strokeWidth="2" />
    <line x1="49" y1="48" x2="55" y2="48" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Icons (inline SVG helpers) ─────────────────────────────────────────
const Icon = {
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Globe: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Radius: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 12 17 7"/>
    </svg>
  ),
  Export: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  MapLink: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Bookmark: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  Clock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Star: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="#F5A623" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6M15 9h6M15 15h6"/>
    </svg>
  ),
  Reset: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ── Skeleton Card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton sk-avatar" />
      <div className="sk-body">
        <div className="skeleton sk-line" style={{ width: "55%" }} />
        <div className="skeleton sk-line" style={{ width: "75%", height: "10px" }} />
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <div className="skeleton" style={{ width: 62, height: 28, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 999 }} />
      </div>
    </div>
  );
}

// ── Lead Card ──────────────────────────────────────────────────────────
function LeadCard({ lead, index }: { lead: any; index: number }) {
  const initials = (lead.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <motion.div
      className="lead-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.035, ease: [0.25, 0.1, 0.25, 1] }}
      layout
    >
      {/* Avatar */}
      <div className="lead-avatar">{initials || "?"}</div>

      {/* Body */}
      <div className="lead-body">
        <div className="lead-name">{lead.name || "Unknown Business"}</div>
        <div className="lead-address">
          <Icon.MapPin />
          <span>{lead.address || "Address not available"}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="lead-meta">
        {lead.rating && (
          <div className="rating-badge">
            <Icon.Star />
            <span>{lead.rating}</span>
          </div>
        )}

        {lead.maps_url && (
          <a
            href={lead.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="maps-btn"
          >
            <Icon.MapLink />
            Open Maps
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Home() {
  // Form
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [radius, setRadius] = useState("");

  // Data
  const [leads, setLeads] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState<number | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Fetch History ──────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/search-history`);
      const data = await res.json();
      setHistory(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Search ─────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_BASE}/api/search-leads?page=1&limit=${limit}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword, country, state: stateVal, city, street,
          radius: radius ? Number(radius) : null,
        }),
      });
      const data = await res.json();
      setLeads(data.leads || []);
      setSearchId(data.search_id);
      setPage(data.page);
      setTotalPages(data.total_pages);
      setTotalLeads((data.total_pages || 1) * limit);
      setActiveHistoryId(data.search_id);
    } catch { /* silent */ } finally {
      setLoading(false);
      fetchHistory();
    }
  };

  // ── Fetch by ID ────────────────────────────────────────────
  const fetchBySearchId = async (id: number, pageNum = 1, pageLimit = limit) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads?search_id=${id}&page=${pageNum}&limit=${pageLimit}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setPage(data.page);
      setTotalPages(data.total_pages);
      setTotalLeads((data.total_pages || 1) * pageLimit);
      setSearchId(id);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  // ── History Click ──────────────────────────────────────────
  const handleHistoryClick = (item: any) => {
    setKeyword(item.keyword || "");
    setCountry(item.country || "");
    setStateVal(item.state || "");
    setCity(item.city || "");
    setStreet(item.street || "");
    setRadius(item.radius || "");
    setActiveHistoryId(item.id);
    fetchBySearchId(item.id, 1, limit);
    setSidebarOpen(false);
  };

  // ── Pagination ─────────────────────────────────────────────
  const handleNext = () => { if (!searchId || page === totalPages) return; fetchBySearchId(searchId, page + 1, limit); };
  const handlePrev = () => { if (!searchId || page === 1) return; fetchBySearchId(searchId, page - 1, limit); };
  const handleLimitChange = (v: number) => { setLimit(v); if (searchId) fetchBySearchId(searchId, 1, v); };

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = () => {
    setKeyword(""); setCountry(""); setStateVal("");
    setCity(""); setStreet(""); setRadius("");
  };

  // ── Export ─────────────────────────────────────────────────
  const handleExport = async () => {
    if (!searchId) return;
    try {
      const res = await fetch(`${API_BASE}/api/export-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_id: searchId }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `leads_${searchId}.csv`; a.click();
    } catch { /* silent */ }
  };

  // ── Computed ───────────────────────────────────────────────
  const startItem = ((page - 1) * limit) + 1;
  const endItem   = Math.min(page * limit, totalLeads || leads.length * totalPages);

  return (
    <div className="app-shell">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      {/* Backdrop — mobile only */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo + close button */}
        <div className="sidebar-logo">
          <h1>
            <span style={{ color: "var(--accent)", display: "flex" }}><Icon.Logo /></span>
            GetYourLeads
          </h1>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <Icon.X />
          </button>
        </div>

        {/* New Search */}
        <button className="sidebar-new-btn" onClick={handleReset}>
          <Icon.Plus />
          New Search
        </button>

        <div className="divider" style={{ margin: "0 14px" }} />

        {/* Recent Searches */}
        <p className="sidebar-section-label">Recent Searches</p>

        <div className="sidebar-history">
          <AnimatePresence>
            {history.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 12px" }}>
                No searches yet
              </p>
            ) : (
              history.map((item: any) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`history-item ${activeHistoryId === item.id ? "active" : ""}`}
                  onClick={() => handleHistoryClick(item)}
                >
                  <div className="h-keyword">{item.keyword}</div>
                  <div className="h-sub">
                    {[item.city, item.state, item.country].filter(Boolean).join(", ") || "Global"}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="sidebar-footer">
          <span>GetYourLeads v1.0</span>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────── */}
      <main className="main-area">

        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            {/* Hamburger — shown on mobile/tablet */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(s => !s)}
              aria-label="Toggle sidebar"
            >
              <Icon.Menu />
            </button>
            <div>
              <span className="header-title">Lead Intelligence</span>
              <span className="header-subtitle">
                {hasSearched && !loading
                  ? `${leads.length} leads on this page`
                  : "Discover local business leads"}
              </span>
            </div>
          </div>

          <div className="header-right">
            <button
              className="export-btn"
              onClick={handleExport}
              disabled={!searchId}
            >
              <Icon.Export />
              <span className="export-label">Export CSV</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content-area">

          {/* ── SEARCH CARD ─────────────────────────────────── */}
          <motion.div
            className="search-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="search-card-header">
              <h3>Search Leads</h3>
              <p>Enter a keyword and location to discover local business leads</p>
            </div>

            {/* Row 1: Keyword */}
            <div className="search-grid-row1">
              <div className="field-group">
                <label className="field-label">Keyword</label>
                <div className="field-input-wrap">
                  <span className="field-input-icon"><Icon.Search /></span>
                  <input
                    className="field-input"
                    placeholder="e.g. coffee shop, dentist, gym…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Country / State */}
            <div className="search-grid-row2">
              <div className="field-group">
                <label className="field-label">Country</label>
                <div className="field-input-wrap">
                  <span className="field-input-icon"><Icon.Globe /></span>
                  <input
                    className="field-input"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">State / Province</label>
                <div className="field-input-wrap">
                  <span className="field-input-icon"><Icon.MapPin /></span>
                  <input
                    className="field-input"
                    placeholder="e.g. California"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: City / Street / Radius */}
            <div className="search-grid-row3">
              <div className="field-group">
                <label className="field-label">City</label>
                <div className="field-input-wrap">
                  <span className="field-input-icon"><Icon.MapPin /></span>
                  <input
                    className="field-input"
                    placeholder="e.g. San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Street</label>
                <div className="field-input-wrap">
                  <span className="field-input-icon"><Icon.MapPin /></span>
                  <input
                    className="field-input"
                    placeholder="e.g. Market Street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Radius (meters)</label>
                <div className="field-input-wrap">
                  <span className="field-input-icon"><Icon.Radius /></span>
                  <input
                    className="field-input"
                    placeholder="e.g. 5000 (optional)"
                    value={radius}
                    type="number"
                    onChange={(e) => setRadius(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="search-actions">
              <motion.button
                className="btn-primary"
                onClick={handleSearch}
                disabled={loading || !keyword.trim()}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid #1E1A18", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                    Searching…
                  </>
                ) : (
                  <>
                    <Icon.Search />
                    Search Leads
                  </>
                )}
              </motion.button>

              <button className="btn-reset" onClick={handleReset}>
                <Icon.Reset /> Reset
              </button>
            </div>
          </motion.div>

          {/* ── RESULTS ─────────────────────────────────────── */}
          <div className="results-section">

            {/* Results header */}
            <div className="results-header">
              <div>
                <span className="results-title">Results</span>
                {hasSearched && !loading && leads.length > 0 && (
                  <span className="results-meta" style={{ marginLeft: 10 }}>
                    Showing {startItem}–{endItem} of {totalPages * limit} leads
                  </span>
                )}
              </div>

              <div className="results-controls">
                <label style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Per page:</label>
                <select
                  className="limit-select"
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                >
                  {[5, 10, 15, 20, 50, 100].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card list */}
            {loading ? (
              <div className="leads-list">
                {Array.from({ length: limit > 6 ? 6 : limit }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : !hasSearched ? (
              /* Initial empty state */
              <div className="empty-state">
                <EmptySearchIllustration />
                <div className="empty-title">Ready to find leads?</div>
                <div className="empty-sub">
                  Enter a keyword and location above, then click <strong>Search Leads</strong> to get started.
                </div>
              </div>
            ) : leads.length === 0 ? (
              /* No results */
              <div className="empty-state">
                <EmptyResultIllustration />
                <div className="empty-title">No leads found</div>
                <div className="empty-sub">
                  Try adjusting your search filters or using a broader keyword.
                </div>
                <button className="btn-primary" onClick={handleReset} style={{ marginTop: 8 }}>
                  <Icon.Reset />
                  Start new search
                </button>
              </div>
            ) : (
              <div className="leads-list">
                <AnimatePresence mode="popLayout">
                  {leads.map((lead, i) => (
                    <LeadCard key={`${lead.name}-${i}`} lead={lead} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {!loading && hasSearched && leads.length > 0 && (
              <motion.div
                className="pagination"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>

                <div className="pagination-controls">
                  <button
                    className="pg-btn"
                    onClick={handlePrev}
                    disabled={page === 1}
                    title="Previous page"
                  >
                    <Icon.ChevronLeft />
                  </button>

                  <div className="pg-current">
                    {page} <span style={{ opacity: 0.5 }}>/ {totalPages}</span>
                  </div>

                  <button
                    className="pg-btn"
                    onClick={handleNext}
                    disabled={page === totalPages}
                    title="Next page"
                  >
                    <Icon.ChevronRight />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}