import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/AuthContext";
import * as api from "../api/client";

function toOptionalNumber(value) {
  if (value === "" || value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function GarageDetailPage() {
  const { lotId } = useParams();
  const { token } = useAuth();
  const [lot, setLot] = useState(null);
  const [form, setForm] = useState(null);
  const [levelForm, setLevelForm] = useState({
    level_number: "1",
    name: "",
    camera_feed_url: "",
  });
  const [cameraDrafts, setCameraDrafts] = useState({});
  const [editingCameraId, setEditingCameraId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getLot(token, lotId);
      setLot(data);
      setForm({
        name: data.name || "",
        lot_type: data.lot_type || "garage",
        address: data.address || "",
        latitude: data.latitude ?? "",
        longitude: data.longitude ?? "",
        rating: data.rating ?? "",
        rate_per_hour: data.rate_per_hour || "",
        details: data.details || "",
        schedule: data.schedule || "",
        spots_open: data.spots_open ?? "",
        total_spaces: data.total_spaces ?? 0,
      });
      const nextNum = (data.levels?.length || 0) + 1;
      setLevelForm({
        level_number: String(nextNum),
        name: `Level ${nextNum}`,
        camera_feed_url: "",
      });
    } catch (err) {
      setError(err.message || "Failed to load garage");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token, lotId]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSaveLot(e) {
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
      };
      const updated = await api.updateLot(token, lotId, body);
      setLot(updated);
      setShowEdit(false);
      setMessage("Garage updated");
    } catch (err) {
      setError(err.message || "Failed to update garage");
    } finally {
      setSaving(false);
    }
  }

  async function onAddLevel(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.createLevel(token, lotId, {
        level_number: Number(levelForm.level_number),
        name: levelForm.name.trim(),
        camera_feed_url: levelForm.camera_feed_url.trim() || null,
      });
      setShowAddLevel(false);
      setMessage("Level added");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to add level");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveLevelCamera(level) {
    const url = cameraDrafts[level.id] ?? level.camera_feed_url ?? "";
    setError("");
    setMessage("");
    try {
      await api.updateLevel(token, level.id, {
        camera_feed_url: url.trim() || null,
      });
      setEditingCameraId(null);
      setMessage("Camera URL updated");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to update level");
    }
  }

  if (loading || !form) {
    return (
      <AppShell title="Garage" subtitle={<p className="breadcrumb">Loading…</p>}>
        <div className="card">
          <p className="muted">Loading garage…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={lot?.name || "Garage"}
      subtitle={
        <p className="breadcrumb">
          <Link to="/">Garages</Link> / {lot?.name}
        </p>
      }
      actions={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowEdit((v) => !v);
              setShowAddLevel(false);
            }}
          >
            {showEdit ? "Close editor" : "Edit details"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setShowAddLevel((v) => !v);
              setShowEdit(false);
            }}
          >
            {showAddLevel ? "Close" : "+ Add level"}
          </button>
        </>
      }
    >
      {error && <p className="alert-error" style={{ marginBottom: 14 }}>{error}</p>}
      {message && <p className="alert-ok" style={{ marginBottom: 14 }}>{message}</p>}

      <div className="card">
        <div className="stats-row">
          <span className="badge badge-teal">
            {lot.lot_type === "open_lot" ? "Open lot" : "Garage"}
          </span>
          <span className="badge">{lot.levels?.length || 0} levels</span>
          <span className="badge">{lot.total_spaces ?? 0} spaces</span>
          {lot.rate_per_hour && <span className="badge">{lot.rate_per_hour}</span>}
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {lot.address}
        </p>
      </div>

      {showEdit && (
        <div className="card collapsible">
          <div className="card-head">
            <h2>Edit garage</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </button>
          </div>
          <form className="stack" onSubmit={onSaveLot}>
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
                  />
                </label>
                <label>
                  Longitude
                  <input
                    value={form.longitude}
                    onChange={(e) => setField("longitude", e.target.value)}
                  />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Rating
                  <input
                    value={form.rating}
                    onChange={(e) => setField("rating", e.target.value)}
                  />
                </label>
                <label>
                  Rate per hour
                  <input
                    value={form.rate_per_hour}
                    onChange={(e) => setField("rate_per_hour", e.target.value)}
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
            </fieldset>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEdit(false)}
              >
                Cancel
              </button>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddLevel && (
        <div className="card collapsible">
          <div className="card-head">
            <h2>Add level</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAddLevel(false)}
            >
              Cancel
            </button>
          </div>
          <form className="stack" onSubmit={onAddLevel}>
            <div className="grid-2">
              <label>
                Level number
                <input
                  value={levelForm.level_number}
                  onChange={(e) =>
                    setLevelForm((prev) => ({
                      ...prev,
                      level_number: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Name
                <input
                  value={levelForm.name}
                  onChange={(e) =>
                    setLevelForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <label>
              Camera feed URL
              <input
                value={levelForm.camera_feed_url}
                onChange={(e) =>
                  setLevelForm((prev) => ({
                    ...prev,
                    camera_feed_url: e.target.value,
                  }))
                }
                placeholder="http://camera/snapshot.jpg"
              />
            </label>
            <div className="form-actions">
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Adding…" : "Add level"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>Levels / cameras</h2>
          <span className="badge">{lot?.levels?.length || 0}</span>
        </div>

        {(lot?.levels || []).length === 0 ? (
          <div className="empty-state">
            <strong>No levels yet</strong>
            Add a level with a camera before defining spots.
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn" onClick={() => setShowAddLevel(true)}>
                + Add level
              </button>
            </div>
          </div>
        ) : (
          <div className="list">
            {lot.levels.map((level) => (
              <div className="list-item" key={level.id}>
                <div className="list-item-main">
                  <h3 className="list-item-title">
                    #{level.level_number} · {level.name}
                  </h3>
                  <div className="list-item-meta">
                    <span
                      className={`badge ${level.spot_count ? "badge-ok" : "badge-warn"}`}
                    >
                      {level.spot_count || 0} spots defined
                    </span>
                    {level.camera_feed_url ? (
                      <span className="mono muted">{level.camera_feed_url}</span>
                    ) : (
                      <span className="badge badge-warn">No camera URL</span>
                    )}
                  </div>

                  {editingCameraId === level.id && (
                    <div className="stack" style={{ marginTop: 12 }}>
                      <label>
                        Camera feed URL
                        <input
                          value={cameraDrafts[level.id] ?? level.camera_feed_url ?? ""}
                          onChange={(e) =>
                            setCameraDrafts((prev) => ({
                              ...prev,
                              [level.id]: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onSaveLevelCamera(level)}
                        >
                          Save camera
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingCameraId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="list-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      setEditingCameraId(level.id);
                      setCameraDrafts((prev) => ({
                        ...prev,
                        [level.id]: level.camera_feed_url || "",
                      }));
                    }}
                  >
                    Edit camera
                  </button>
                  <Link className="btn btn-sm" to={`/levels/${level.id}/spots`}>
                    Define spots
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
