import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/AuthContext";
import * as api from "../api/client";

const CORNERS_PER_SPOT = 4;

function withCacheBust(url) {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}cb=${Date.now()}`;
}

export default function DefineSpotsPage() {
  const { levelId } = useParams();
  const { token } = useAuth();
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [level, setLevel] = useState(null);
  const [spots, setSpots] = useState([]);
  const [pending, setPending] = useState([]);
  const [frameUri, setFrameUri] = useState("");
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getLevel(token, levelId);
        if (cancelled) return;
        setLevel(data);
        setSpots(Array.isArray(data.defined_spots) ? data.defined_spots : []);
        setFrameUri(withCacheBust(data.camera_feed_url || ""));
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load level");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, levelId]);

  function syncCanvasSize() {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    canvas.width = Math.max(Math.round(rect.width), 1);
    canvas.height = Math.max(Math.round(rect.height), 1);
    draw();
  }

  function toDisplay(point) {
    const { w, h } = naturalSize;
    const canvas = canvasRef.current;
    if (!canvas || !w || !h) return [0, 0];
    return [(point[0] / w) * canvas.width, (point[1] / h) * canvas.height];
  }

  function toImageCoords(clientX, clientY) {
    const canvas = canvasRef.current;
    const { w, h } = naturalSize;
    if (!canvas || !w || !h) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * w;
    const y = ((clientY - rect.top) / rect.height) * h;
    return [Math.round(x), Math.round(y)];
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const corners of spots) {
      if (!corners?.length) continue;
      ctx.beginPath();
      const [sx, sy] = toDisplay(corners[0]);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < corners.length; i += 1) {
        const [x, y] = toDisplay(corners[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "#32d74b";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (pending.length) {
      ctx.beginPath();
      const [sx, sy] = toDisplay(pending[0]);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < pending.length; i += 1) {
        const [x, y] = toDisplay(pending[i]);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#ff3b30";
      ctx.lineWidth = 2;
      ctx.stroke();
      for (const p of pending) {
        const [x, y] = toDisplay(p);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ff3b30";
        ctx.fill();
      }
    }
  }

  useEffect(() => {
    draw();
  }, [spots, pending, naturalSize, frameUri]);

  useEffect(() => {
    function onResize() {
      syncCanvasSize();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [naturalSize, spots, pending]);

  function onImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    requestAnimationFrame(syncCanvasSize);
  }

  function onCanvasClick(e) {
    if (e.button !== 0) return;
    const point = toImageCoords(e.clientX, e.clientY);
    if (!point) return;
    setPending((prev) => {
      const next = [...prev, point];
      if (next.length === CORNERS_PER_SPOT) {
        setSpots((spotsPrev) => [...spotsPrev, next]);
        return [];
      }
      return next;
    });
  }

  function onContextMenu(e) {
    e.preventDefault();
    if (pending.length) {
      setPending((prev) => prev.slice(0, -1));
    } else if (spots.length) {
      setSpots((prev) => prev.slice(0, -1));
    }
  }

  async function onSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await api.putDefinedSpots(token, levelId, spots);
      setLevel(updated);
      setSpots(Array.isArray(updated.defined_spots) ? updated.defined_spots : []);
      setMessage(`Saved ${updated.spot_count} spots`);
    } catch (err) {
      setError(err.message || "Failed to save spots");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Define spots" subtitle={<p className="breadcrumb">Loading…</p>}>
        <div className="card">
          <p className="muted">Loading level…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Define spots · ${level?.name || `Level ${levelId}`}`}
      subtitle={
        <p className="breadcrumb">
          <Link to="/">Garages</Link>
          {" / "}
          <Link to={`/garages/${level?.parking_lot_id}`}>Garage</Link>
          {" / Spots"}
        </p>
      }
      actions={
        <>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setFrameUri(withCacheBust(level?.camera_feed_url || ""))}
            disabled={!level?.camera_feed_url}
          >
            Refresh frame
          </button>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save spots"}
          </button>
        </>
      }
    >
      <div className="card">
        <div className="stats-row">
          <span className="badge badge-ok">{spots.length} spots</span>
          {pending.length > 0 && (
            <span className="badge badge-warn">{pending.length}/4 corners</span>
          )}
        </div>
        <p className="hint">
          Click 4 corners in order around each spot. Right-click undoes the last
          corner or completed spot.
        </p>

        {!level?.camera_feed_url ? (
          <p className="alert-error">
            This level has no camera feed URL. Add one on the garage page first.
          </p>
        ) : (
          <div className="spot-layout">
            <div className="spot-stage">
              <img
                ref={imgRef}
                src={frameUri}
                alt="Camera frame"
                onLoad={onImageLoad}
                draggable={false}
              />
              <canvas
                ref={canvasRef}
                onClick={onCanvasClick}
                onContextMenu={onContextMenu}
              />
            </div>
          </div>
        )}

        {error && <p className="alert-error" style={{ marginTop: 14 }}>{error}</p>}
        {message && <p className="alert-ok" style={{ marginTop: 14 }}>{message}</p>}
      </div>
    </AppShell>
  );
}
