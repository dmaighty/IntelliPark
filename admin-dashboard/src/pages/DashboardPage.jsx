import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/AuthContext";
import * as api from "../api/client";

const EMPTY_FORM = {
  name: "",
  lot_type: "garage",
  address: "",
  latitude: "",
  longitude: "",
  rating: "",
  rate_per_hour: "",
  details: "",
  schedule: "",
  spots_open: "",
  total_spaces: "0",
  camera_feed_url: "",
};

function toOptionalNumber(value) {
  if (value === "" || value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listLots(token);
      setLots(data);
    } catch (err) {
      setError(err.message || "Failed to load garages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body = {
        name: form.name.trim(),
        lot_type: form.lot_type,
        address: form.address.trim(),
        latitude: toOptionalNumber(form.latitude),
        longitude: toOptionalNumber(form.longitude),
        rating: toOptionalNumber(form.rating),
        rate_per_hour: form.rate_per_hour.trim() || null,
        details: form.details.trim() || null,
        schedule: form.schedule.trim() || null,
        spots_open: toOptionalNumber(form.spots_open),
        total_spaces: toOptionalNumber(form.total_spaces) ?? 0,
        camera_feed_url: form.camera_feed_url.trim() || null,
      };
      await api.createLot(token, body);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setMessage("Garage created");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to create garage");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Garages"
      subtitle={<p className="breadcrumb">Manage lots, cameras, and spot maps</p>}
      actions={
        <button
          type="button"
          className="btn"
          onClick={() => {
            setShowForm((v) => !v);
            setMessage("");
            setError("");
          }}
        >
          {showForm ? "Close form" : "+ Add garage"}
        </button>
      }
    >
      {error && !showForm && <p className="alert-error" style={{ marginBottom: 14 }}>{error}</p>}
      {message && !showForm && <p className="alert-ok" style={{ marginBottom: 14 }}>{message}</p>}

      {showForm && (
        <div className="card collapsible">
          <div className="card-head">
            <h2>Add garage</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
          <p className="hint">
            Optional camera URL creates Level 1 automatically. Add more levels later.
          </p>
          <form className="stack" onSubmit={onCreate}>
            <fieldset className="field-group">
              <legend>Basics</legend>
              <div className="grid-2">
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Lot type
                  <select
                    value={form.lot_type}
                    onChange={(e) => setField("lot_type", e.target.value)}
                  >
                    <option value="garage">Garage</option>
                    <option value="open_lot">Open lot</option>
                  </select>
                </label>
              </div>
              <label>
                Address
                <input
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  required
                />
              </label>
            </fieldset>

            <fieldset className="field-group">
              <legend>Location & pricing</legend>
              <div className="grid-2">
                <label>
                  Latitude
                  <input
                    value={form.latitude}
                    onChange={(e) => setField("latitude", e.target.value)}
                    placeholder="37.33"
                  />
                </label>
                <label>
                  Longitude
                  <input
                    value={form.longitude}
                    onChange={(e) => setField("longitude", e.target.value)}
                    placeholder="-121.88"
                  />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Rating
                  <input
                    value={form.rating}
                    onChange={(e) => setField("rating", e.target.value)}
                    placeholder="4.5"
                  />
                </label>
                <label>
                  Rate per hour
                  <input
                    value={form.rate_per_hour}
                    onChange={(e) => setField("rate_per_hour", e.target.value)}
                    placeholder="$4/hr"
                  />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Spots open
                  <input
                    value={form.spots_open}
                    onChange={(e) => setField("spots_open", e.target.value)}
                  />
                </label>
                <label>
                  Total spaces
                  <input
                    value={form.total_spaces}
                    onChange={(e) => setField("total_spaces", e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="field-group">
              <legend>Details</legend>
              <label>
                Details
                <textarea
                  value={form.details}
                  onChange={(e) => setField("details", e.target.value)}
                />
              </label>
              <label>
                Schedule
                <textarea
                  value={form.schedule}
                  onChange={(e) => setField("schedule", e.target.value)}
                />
              </label>
              <label>
                Camera feed URL (optional)
                <input
                  value={form.camera_feed_url}
                  onChange={(e) => setField("camera_feed_url", e.target.value)}
                  placeholder="http://camera/snapshot.jpg"
                />
              </label>
            </fieldset>

            {error && <p className="alert-error">{error}</p>}
            {message && <p className="alert-ok">{message}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create garage"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>All garages</h2>
          <span className="badge">{lots.length} total</span>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : lots.length === 0 ? (
          <div className="empty-state">
            <strong>No garages yet</strong>
            Create your first garage to attach cameras and define spots.
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn" onClick={() => setShowForm(true)}>
                + Add garage
              </button>
            </div>
          </div>
        ) : (
          <div className="list">
            {lots.map((lot) => {
              const levels = lot.levels?.length ?? 0;
              const spots = (lot.levels || []).reduce(
                (sum, lv) => sum + (lv.spot_count || 0),
                0
              );
              return (
                <div className="list-item" key={lot.id}>
                  <div className="list-item-main">
                    <h3 className="list-item-title">{lot.name}</h3>
                    <div className="list-item-meta">
                      <span className="badge badge-teal">
                        {lot.lot_type === "open_lot" ? "Open lot" : "Garage"}
                      </span>
                      <span>{lot.address}</span>
                      <span>·</span>
                      <span>{levels} level{levels === 1 ? "" : "s"}</span>
                      <span>·</span>
                      <span>{spots} defined spots</span>
                      {lot.total_spaces != null && (
                        <>
                          <span>·</span>
                          <span>{lot.total_spaces} spaces</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <Link className="btn btn-secondary btn-sm" to={`/garages/${lot.id}`}>
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
