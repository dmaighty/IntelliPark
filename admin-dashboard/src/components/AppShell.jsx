import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppShell({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-left">
            <button
              type="button"
              className="icon-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={`hamburger ${menuOpen ? "is-open" : ""}`}>
                <span />
                <span />
                <span />
              </span>
            </button>
            <Link to="/" className="brand-lockup">
              <span className="brand-mark">IP</span>
              <span className="brand-text">IntelliPark</span>
            </Link>
          </div>
          <div className="header-right">
            <span className="user-chip">{user?.email}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div
        className={`nav-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`nav-drawer ${menuOpen ? "is-open" : ""}`}>
        <div className="nav-drawer-head">
          <div className="brand-lockup">
            <span className="brand-mark">IP</span>
            <span className="brand-text">Admin</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Garages
          </NavLink>
        </nav>
        <div className="nav-footer">
          <p className="muted small">{user?.full_name || "Admin"}</p>
          <button type="button" className="btn btn-secondary btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="page-head">
          <div>
            {subtitle}
            <h1 className="page-title">{title}</h1>
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
