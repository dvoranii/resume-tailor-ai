import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Folder } from "lucide-react";
import { API_BASE, type Collection } from "../../types/jobs";

export default function NewCollectionForm({
  onCreated,
}: {
  onCreated: (c: Collection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    searchQuery: "",
    location: "",
    maxItems: "25",
  });

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.searchQuery) {
      setError("Collection name and search query are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          searchQuery: form.searchQuery,
          location: form.location || null,
          maxItems: Number(form.maxItems) || 25,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create collection");
        return;
      }
      onCreated({
        id: data.id,
        name: form.name,
        searchQuery: form.searchQuery,
        location: form.location || null,
        jobCount: 0,
        lastScrapedAt: null,
        totalJobsFound: 0,
      });
      setForm({ name: "", searchQuery: "", location: "", maxItems: "25" });
      setExpanded(false);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-input transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Folder size={15} />
          New Collection (Auto-Scrape from LinkedIn)
        </div>
        {expanded ? (
          <ChevronUp size={15} className="text-text-muted" />
        ) : (
          <ChevronDown size={15} className="text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 px-4 pb-4 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">
                Collection Name<span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Toronto Frontend Roles"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">
                Search Query<span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={form.searchQuery}
                onChange={set("searchQuery")}
                placeholder="Full Stack Developer"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={set("location")}
                placeholder="Toronto, ON"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">
                Max Jobs (min 10)
              </label>
              <input
                type="number"
                min={10}
                value={form.maxItems}
                onChange={set("maxItems")}
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              <Plus size={14} />
              {submitting ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
