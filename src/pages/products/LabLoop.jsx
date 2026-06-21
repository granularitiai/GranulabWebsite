import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Atom,
  Building2,
  Clock,
  Database,
  Filter,
  FlaskConical,
  Microscope,
  Recycle,
  Search,
  ShieldAlert,
  Sparkles,
  University,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_LABLOOP_API_BASE_URL || "http://127.0.0.1:8010";
const DISCLAIMER =
  "External auction listings are provided for discovery only. LabLoop does not own, verify, certify, transport, or guarantee this equipment. Users must verify condition, ownership, calibration status, bidding rules, pickup terms, safety requirements, and source terms directly with GSA Auctions.";

const categories = [
  "All",
  "Centrifuge",
  "Microscope",
  "PCR Machine",
  "Freezer",
  "Refrigerator",
  "Incubator",
  "Biosafety Cabinet",
  "Analytical Instrument",
  "HPLC",
  "Mass Spectrometer",
  "Plate Reader",
  "Other",
];

const sortOptions = [
  ["ending_soonest", "Ending soonest (next 7 days)"],
  ["newest_synced", "Newest synced"],
  ["highest_relevance", "Highest relevance (next 7 days)"],
  ["lowest_current_bid", "Lowest current bid (next 7 days)"],
  ["highest_current_bid", "Highest current bid (next 7 days)"],
  ["most_bidders", "Most bidders (next 7 days)"],
];

export default function LabLoop() {
  const [view, setView] = useState("home");
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [matches, setMatches] = useState([]);
  const [health, setHealth] = useState(null);
  const [syncSummary, setSyncSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    category: "All",
    state: "",
    city: "",
    agency: "",
    auction_status: "",
    min_relevance: "",
    min_confidence: "",
    sort: "newest_synced",
  });

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (view === "browse") loadListings();
  }, [view]);

  async function loadHealth() {
    try {
      setHealth(await apiGet("/api/health"));
    } catch {
      setHealth(null);
    }
  }

  async function loadListings(nextFilters = filters) {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (!value || value === "All") return;
        params.set(key, value);
      });
      const data = await apiGet(`/api/listings?${params.toString()}`);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load listings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function syncGsaAuctions() {
    setView("admin");
    setIsLoading(true);
    setError(null);
    setSyncSummary(null);
    try {
      const data = await apiGet("/api/ingest/gsa-auctions");
      setSyncSummary(data);
      await loadHealth();
      await loadListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "GSA sync failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function seedDemoData() {
    setIsLoading(true);
    setError(null);
    try {
      await apiPost("/api/dev/seed", {});
      await loadHealth();
      setView("browse");
      await loadListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not seed demo data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitNeed(event) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      requester_name: form.get("requester_name"),
      organization_name: form.get("organization_name"),
      organization_type: form.get("organization_type"),
      email: form.get("email"),
      city: form.get("city"),
      state: form.get("state"),
      needed_equipment: form.get("needed_equipment"),
      intended_use: form.get("intended_use"),
      max_budget: form.get("max_budget") ? Number(form.get("max_budget")) : null,
      preferred_states: String(form.get("preferred_states") || "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
      urgency: form.get("urgency"),
    };

    try {
      const need = await apiPost("/api/needs", payload);
      const matchData = await apiGet(`/api/match-needs/${need.id}`);
      setMatches(matchData);
      setView("matches");
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create need.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#f7faf8] text-slate-950">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <button className="flex items-center gap-3 text-left" onClick={() => setView("home")}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FlaskConical size={24} />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">LabLoop</span>
              <span className="block text-sm text-slate-600">GSA lab equipment discovery</span>
            </span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["home", "Home"],
              ["browse", "Browse Equipment"],
              ["needs", "Needs"],
              ["admin", "Admin"],
              ["about", "About"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view === key ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-5 max-w-7xl px-5 sm:px-6 lg:px-8">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {view === "home" && (
        <HomeView setView={setView} onSync={syncGsaAuctions} health={health} isLoading={isLoading} />
      )}
      {view === "browse" && (
        <BrowseView
          listings={listings}
          filters={filters}
          setFilters={setFilters}
          onApplyFilters={loadListings}
          isLoading={isLoading}
          onSelect={setSelectedListing}
          onSeed={seedDemoData}
        />
      )}
      {view === "needs" && <NeedsView onSubmit={submitNeed} isLoading={isLoading} />}
      {view === "matches" && (
        <MatchesView matches={matches} onSelect={(listing) => setSelectedListing(listing)} />
      )}
      {view === "admin" && (
        <AdminView
          health={health}
          summary={syncSummary}
          onSync={syncGsaAuctions}
          onSeed={seedDemoData}
          isLoading={isLoading}
        />
      )}
      {view === "about" && <AboutView />}

      {selectedListing && (
        <EquipmentModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}
    </section>
  );
}

function HomeView({ setView, onSync, health, isLoading }) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(#dbeafe_1px,transparent_1px),linear-gradient(90deg,#dbeafe_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
              Powered by GSA Auctions API
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 lg:text-6xl">
              Find surplus lab equipment from federal auctions.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              LabLoop helps biotech startups, universities, and research teams discover lab equipment from GSA Auctions faster.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LabButton onClick={() => setView("browse")}>Browse Equipment</LabButton>
              <LabButton variant="secondary" onClick={onSync} disabled={isLoading}>
                {isLoading ? "Syncing..." : "Sync GSA Auctions"}
              </LabButton>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Discovery Layer</p>
                <Recycle className="text-emerald-700" />
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  ["GSA Sync", Database],
                  ["GSA Lab Equipment Category", Filter],
                  ["AI / Rules Categorization", Sparkles],
                  ["Need Matching", Search],
                ].map(([label, Icon]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="font-semibold text-slate-900">{label}</span>
                    <Icon size={20} className="text-blue-700" />
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Listings" value={health?.total_listings ?? 0} />
                <Metric label="Lab listings" value={health?.scientific_listings ?? 0} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Discover hidden lab surplus", "Find GSA Lab Equipment category listings without digging through broad government surplus pages.", Microscope],
            ["Filter by GSA category", "Sync the public GSA Lab Equipment category, then enrich each item with practical metadata.", Atom],
            ["Match equipment to lab needs", "Create equipment needs and see relevant GSA auction matches.", University],
          ].map(([title, copy, Icon]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <Icon className="text-emerald-700" size={28} />
              <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-950">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {[
              "Sync listings from the GSA Auctions API",
              "Filter for lab equipment",
              "AI or rules categorize and enrich each listing",
              "Browse, search, filter, and match listings",
              "Verify details and bid directly on GSA",
            ].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-[#f7faf8] p-5">
                <span className="text-sm font-black text-blue-700">0{index + 1}</span>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function BrowseView({ listings, filters, setFilters, onApplyFilters, isLoading, onSelect, onSeed }) {
  const states = useMemo(() => [...new Set(listings.map((item) => item.location_state).filter(Boolean))].sort(), [listings]);

  function update(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Browse GSA Equipment</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Lab equipment listings</h1>
        </div>
        <div className="flex gap-2">
          <LabButton onClick={() => onApplyFilters()}>Refresh Listings</LabButton>
          <LabButton variant="secondary" onClick={onSeed}>Load Demo Data</LabButton>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Input label="Keyword" value={filters.q} onChange={(value) => update("q", value)} placeholder="microscope, freezer..." />
          <Select label="Category" value={filters.category} onChange={(value) => update("category", value)} options={categories} />
          <Input label="State" value={filters.state} onChange={(value) => update("state", value.toUpperCase())} placeholder={states[0] || "MD"} />
          <Input label="City" value={filters.city} onChange={(value) => update("city", value)} placeholder="Bethesda" />
          <Input label="Agency" value={filters.agency} onChange={(value) => update("agency", value)} placeholder="NIH, VA..." />
          <Input label="Auction Status" value={filters.auction_status} onChange={(value) => update("auction_status", value)} placeholder="Active" />
          <Input label="Min Relevance" value={filters.min_relevance} onChange={(value) => update("min_relevance", value)} placeholder="70" />
          <Input label="Min Confidence" value={filters.min_confidence} onChange={(value) => update("min_confidence", value)} placeholder="70" />
          <Select label="Sort" value={filters.sort} onChange={(value) => update("sort", value)} options={sortOptions.map(([value, label]) => ({ value, label }))} />
        </div>
        <div className="mt-4">
          <LabButton onClick={() => onApplyFilters(filters)} disabled={isLoading}>
            {isLoading ? "Filtering..." : "Apply Filters"}
          </LabButton>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} onSelect={onSelect} />
        ))}
      </div>
      {!listings.length && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Database className="mx-auto text-blue-700" size={32} />
          <h2 className="mt-3 text-lg font-bold text-slate-950">No listings loaded yet</h2>
          <p className="mt-2 text-sm text-slate-700">Sync GSA Auctions from Admin, or load demo data to preview the interface.</p>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onSelect }) {
  const preview = listingPreview(listing);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[16/9] bg-slate-100">
        {listing.image_url ? (
          <img src={listing.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Microscope size={42} />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>GSA Auction</Badge>
          <Badge>{listing.auction_status || "External"}</Badge>
          <Badge>{listing.category || "Other"}</Badge>
        </div>
        <h2 className="mt-4 text-lg font-black leading-6 text-slate-950">{listing.cleaned_title || listing.title}</h2>
        <div className="mt-3 min-h-24 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="line-clamp-4 text-sm leading-6 text-slate-700">{preview}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Metric label="Relevance" value={`${listing.scientific_relevance_score || 0}%`} />
          <Metric label="Confidence" value={`${listing.equipment_confidence_score || 0}%`} />
          <Metric label="Current bid" value={money(listing.current_bid)} />
          <Metric label="Bidders" value={listing.bidders_count ?? "N/A"} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {[listing.location_city, listing.location_state].filter(Boolean).join(", ") || "Location unavailable"} · {listing.agency_name || "Agency unavailable"}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <LabButton onClick={() => onSelect(listing)}>View Details</LabButton>
          {listing.source_url && (
            <a className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50" href={listing.source_url} target="_blank" rel="noreferrer">
              View Original <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function NeedsView({ onSubmit, isLoading }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Needs / Saved Search</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Create an equipment need</h1>
      <p className="mt-3 text-slate-700">This creates buyer search preferences only. It does not create seller listings.</p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2">
        <Input name="requester_name" label="Requester name" required />
        <Input name="organization_name" label="Organization name" required />
        <Select name="organization_type" label="Organization type" required options={["Biotech startup", "University research lab", "Community college", "Academic researcher", "Lab manager", "Incubator", "STEM education program", "Small R&D team"]} />
        <Input name="email" label="Email" type="email" required />
        <Input name="city" label="City" />
        <Input name="state" label="State" />
        <Input name="needed_equipment" label="Needed equipment" required placeholder="CO2 incubator, -80 freezer..." />
        <Input name="max_budget" label="Max budget" type="number" />
        <Input name="preferred_states" label="Preferred states" placeholder="MD, VA, NC" />
        <Select name="urgency" label="Urgency" options={["Low", "Medium", "High"]} />
        <label className="md:col-span-2">
          <span className="text-sm font-bold text-slate-800">Intended use</span>
          <textarea name="intended_use" className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-600" />
        </label>
        <div className="md:col-span-2">
          <LabButton disabled={isLoading}>{isLoading ? "Matching..." : "Create Need and Match"}</LabButton>
        </div>
      </form>
    </div>
  );
}

function MatchesView({ matches, onSelect }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Match Results</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Top GSA Auction Matches</h1>
      <div className="mt-8 grid gap-4">
        {matches.map((match) => (
          <div key={match.listing_id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800">{match.match_score}% match</span>
                <h2 className="mt-3 text-xl font-black text-slate-950">{match.listing_title}</h2>
                <p className="mt-2 text-sm text-slate-700">{match.location || "Location unavailable"} · {match.agency_name || "Agency unavailable"}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {match.why_it_matched.map((reason) => (
                    <li key={reason} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <LabButton onClick={() => onSelect(match.listing)}>View Details</LabButton>
                {match.source_url && <a href={match.source_url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900">View Original</a>}
              </div>
            </div>
          </div>
        ))}
        {!matches.length && <Notice>No matches yet. Create an equipment need after syncing or loading demo data.</Notice>}
      </div>
    </div>
  );
}

function AdminView({ health, summary, onSync, onSeed, isLoading }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Admin / Sync</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">Developer controls</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black text-slate-950">Sync GSA Auctions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">Requires `GSA_API_KEY` in the backend environment. OpenAI enrichment is optional.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LabButton onClick={onSync} disabled={isLoading}>{isLoading ? "Syncing..." : "Sync GSA Auctions"}</LabButton>
            <LabButton variant="secondary" onClick={onSeed} disabled={isLoading}>Load Demo Data</LabButton>
          </div>
          {!health?.gsa_api_key_present && (
            <div className="mt-5">
              <Notice tone="error">`GSA_API_KEY` is not visible to the backend. Sync will return a missing-key error until it is set.</Notice>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Total listings" value={health?.total_listings ?? 0} />
          <MetricCard label="Lab equipment listings" value={health?.scientific_listings ?? 0} />
          <MetricCard label="GSA key" value={health?.gsa_api_key_present ? "Present" : "Missing"} />
          <MetricCard label="OpenAI key" value={health?.openai_api_key_present ? "Present" : "Fallback ready"} />
        </div>
      </div>
      {summary && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black text-slate-950">Latest sync summary</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Retrieved", summary.total_listings_retrieved],
              ["Lab equipment found", summary.scientific_listings_found],
              ["Added", summary.listings_added],
              ["Updated", summary.listings_updated],
              ["Duplicates skipped", summary.duplicates_skipped],
              ["Errors", summary.errors?.length || 0],
            ].map(([label, value]) => <Metric key={label} label={label} value={value} />)}
          </div>
          {!!summary.errors?.length && <div className="mt-4"><Notice tone="error">{summary.errors.join(" ")}</Notice></div>}
        </div>
      )}
    </div>
  );
}

function AboutView() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">About LabLoop</p>
      <h1 className="mt-2 text-4xl font-black text-slate-950">A serious discovery layer for lab equipment surplus.</h1>
      <p className="mt-5 text-lg leading-8 text-slate-700">
        LabLoop is a lightweight discovery platform for surplus lab equipment listed through GSA Auctions. The goal is to help startups, universities, and research teams find relevant lab equipment faster.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          "LabLoop helps users discover and categorize GSA auction listings",
          "LabLoop does not sell equipment",
          "LabLoop does not verify equipment",
          "LabLoop does not process bids or payments",
          "LabLoop redirects users to original GSA Auctions listings",
          "Users must perform due diligence before bidding or purchasing",
        ].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 font-semibold text-slate-900">{item}</div>
        ))}
      </div>
      <div className="mt-8">
        <Notice tone="warning">{DISCLAIMER}</Notice>
      </div>
    </div>
  );
}

function EquipmentModal({ listing, onClose }) {
  if (!listing) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
      <div className="mx-auto my-8 max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{listing.category || "Other"}</Badge>
              <Badge>{listing.auction_status || "External"}</Badge>
              <Badge>Lab Equipment</Badge>
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950">{listing.cleaned_title || listing.title}</h2>
          </div>
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-900" onClick={onClose}>Close</button>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="aspect-[16/10] rounded-2xl bg-slate-100">
              {listing.image_url ? <img src={listing.image_url} alt="" className="h-full w-full rounded-2xl object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Microscope size={54} /></div>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Current bid" value={money(listing.current_bid)} />
              <Metric label="Bidders" value={listing.bidders_count ?? "N/A"} />
              <Metric label="Reserve" value={money(listing.reserve_price)} />
              <Metric label="Bid increment" value={money(listing.bid_increment)} />
            </div>
          </div>
          <div className="space-y-5">
            <Section title="Improved Description">{cleanDescription(listing.improved_description) || "No improved description available."}</Section>
            <Section title="Original Lot Description">{cleanDescription(listing.lot_description || listing.description) || "No lot description available."}</Section>
            <DetailGrid listing={listing} />
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ListBlock title="Buyer use cases" items={listing.buyer_use_cases || []} />
          <ListBlock title="Recommended tags" items={listing.recommended_tags || []} />
          <ListBlock title="Risk notes" items={listing.risk_notes || []} icon={ShieldAlert} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {listing.source_url && <a href={listing.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">View Original GSA Auction <ArrowUpRight size={16} /></a>}
        </div>
        <div className="mt-6"><Notice tone="warning">{DISCLAIMER}</Notice></div>
      </div>
    </div>
  );
}

function DetailGrid({ listing }) {
  const rows = {
    "Auction start": listing.auction_start_date,
    "Auction end": listing.auction_end_date,
    "Agency": listing.agency_name,
    "Bureau": listing.bureau_name,
    "Property location": [listing.location_city, listing.location_state, listing.location_zip].filter(Boolean).join(", "),
    "Sale location": [listing.sale_location_city, listing.sale_location_state, listing.sale_location_zip].filter(Boolean).join(", "),
    "Inspection": [listing.inspection_instruction_1, listing.inspection_instruction_2, listing.inspection_instruction_3].filter(Boolean).join(" "),
    "Contact": [listing.contract_officer, listing.contact_email, listing.contact_phone].filter(Boolean).join(" | "),
  };
  return <div className="grid gap-2">{Object.entries(rows).map(([key, value]) => <Metric key={key} label={key} value={value || "Not provided"} />)}</div>;
}

function Input({ label, value, onChange, name, type = "text", required = false, placeholder = "" }) {
  return (
    <label>
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-600"
      />
    </label>
  );
}

function Select({ label, value, onChange, name, options, required = false }) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  return (
    <label>
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <select
        name={name}
        value={value}
        required={required}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-600"
      >
        {normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function LabButton({ children, onClick, variant = "primary", disabled = false }) {
  const classes = variant === "secondary"
    ? "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
    : "bg-slate-950 text-white hover:bg-blue-900";
  return (
    <button type="submit" onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}>
      {children}
    </button>
  );
}

function Badge({ children }) {
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">{children}</span>;
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-950">{value}</p></div>;
}

function MetricCard({ label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold uppercase text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-slate-950">{value}</p></div>;
}

function Notice({ children, tone = "info" }) {
  const classes = tone === "error" ? "border-red-200 bg-red-50 text-red-800" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900";
  const Icon = tone === "error" ? AlertTriangle : tone === "warning" ? ShieldAlert : Building2;
  return <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${classes}`}><Icon className="mt-0.5 shrink-0" size={18} /><span>{children}</span></div>;
}

function Section({ title, children }) {
  return <div><h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-800">{children}</p></div>;
}

function ListBlock({ title, items, icon: Icon = Sparkles }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 font-black text-slate-950"><Icon size={18} /> {title}</div><ul className="mt-3 space-y-2">{items.length ? items.map((item) => <li key={item} className="text-sm leading-6 text-slate-700">{item}</li>) : <li className="text-sm text-slate-600">Not provided.</li>}</ul></div>;
}

function money(value) {
  if (value === null || value === undefined || value === "") return "Unknown";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

function listingPreview(listing) {
  const text = cleanDescription(
    listing.improved_description || listing.lot_description || listing.description,
  );
  return truncateText(text || "No description available.", 180);
}

function cleanDescription(value) {
  if (!value) return "";
  let text = String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(h[1-6]|p|li|ul|ol|br|div)>/gi, ". ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = decodeHtmlEntities(text)
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.!?]){2,}/g, "$1")
    .replace(/^\s*(overview|description|specifications|condition)\s*[:.-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function decodeHtmlEntities(value) {
  if (typeof document === "undefined") {
    return value
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength).trimEnd();
  const sentenceEnd = Math.max(trimmed.lastIndexOf("."), trimmed.lastIndexOf("!"), trimmed.lastIndexOf("?"));
  if (sentenceEnd >= 80) return trimmed.slice(0, sentenceEnd + 1);
  return `${trimmed.replace(/[.,;:\s]+$/, "")}...`;
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json();
}

async function apiPost(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json();
}

async function readApiError(response) {
  try {
    const payload = await response.json();
    return payload.detail || "Request failed.";
  } catch {
    return "Request failed.";
  }
}
