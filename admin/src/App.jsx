import { useState, useEffect, useRef } from 'react'
import { supabase, supabaseAdmin } from './supabase'
const ORG_ID = 'a1b2c3d4-0001-0001-0001-000000000001'
/*const ORG_ID = 'a1000000-0000-0000-0000-000000000001'*/

/* ─── Styles ──────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red: #E8001D;
    --red-dim: rgba(232,0,29,0.12);
    --red-glow: rgba(232,0,29,0.25);
    --dark: #060b16;
    --card: #0f1824;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(232,0,29,0.4);
    --text: #f0f2f7;
    --muted: #8892a4;
    --gold: #C9973A;
    --green: #22c55e;
    --green-dim: rgba(34,197,94,0.1);
  }

  body {
    background: var(--dark);
    font-family: 'Outfit', sans-serif;
    color: var(--text);
    min-height: 100vh;
    background-image:
      radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,0,29,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(201,151,58,0.04) 0%, transparent 50%);
  }

  /* ── Login ── */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .login-card {
    width: 400px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
    animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) both;
  }
  .login-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 3px;
    margin-bottom: 4px;
  }
  .login-logo span { color: var(--red); }
  .login-subtitle {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 32px;
  }
  .login-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
    display: block;
  }
  .login-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    margin-bottom: 16px;
    outline: none;
    transition: border-color 0.2s;
  }
  .login-input:focus { border-color: var(--red); }
  .login-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--red), #c0001a);
    border: none;
    border-radius: 10px;
    padding: 14px;
    color: white;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1px;
    cursor: pointer;
    margin-top: 8px;
    box-shadow: 0 4px 20px var(--red-glow);
    transition: all 0.2s;
  }
  .login-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(232,0,29,0.4); }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .error-msg {
    background: rgba(232,0,29,0.1);
    border: 1px solid rgba(232,0,29,0.3);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: #ff6b6b;
    margin-bottom: 16px;
  }

  /* ── Layout ── */
  .layout { display: flex; min-height: 100vh; }
  .sidebar {
    width: 240px;
    background: var(--card);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 28px 0;
    position: fixed;
    top: 0; left: 0; bottom: 0;
  }
  .sidebar-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2.5px;
    padding: 0 24px 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }
  .sidebar-logo span { color: var(--red); }
  .sidebar-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    padding: 0 24px;
    margin-bottom: 8px;
    margin-top: 8px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 24px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all 0.15s;
  }
  .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
  .nav-item.active { color: var(--red); border-left-color: var(--red); background: var(--red-dim); }
  .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; }
  .sidebar-bottom {
    margin-top: auto;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
  }
  .user-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--muted);
  }
  .user-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--green);
    flex-shrink: 0;
  }
  .logout-btn {
    margin-top: 12px;
    width: 100%;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .logout-btn:hover { border-color: var(--red); color: var(--red); }

  .main { margin-left: 240px; flex: 1; padding: 32px 36px; }

  /* ── Page header ── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .page-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 2px;
  }
  .page-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--red), #c0001a);
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    color: white;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 16px var(--red-glow);
    transition: all 0.2s;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(232,0,29,0.4); }
  .btn-primary svg { width: 16px; height: 16px; }

  /* ── Staff grid ── */
  .staff-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .staff-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.25s cubic-bezier(.22,1,.36,1);
    animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;
  }
  .staff-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
  .staff-card:hover .staff-name,
  .staff-card:hover .staff-pos,
  .staff-card:hover .staff-dept { white-space: normal; overflow: visible; text-overflow: unset; }
  .staff-card:hover .staff-name a { white-space: normal; overflow: visible; text-overflow: unset; }
  .staff-card-top { display: flex; align-items: center; gap: 14px; }
  .staff-avatar {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e2e50, #0d1a2e);
    border: 2px solid var(--red);
    object-fit: cover;
    object-position: center top;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    color: var(--red);
    flex-shrink: 0;
    overflow: hidden;
  }
  .staff-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center top; border-radius: 50%; }
  .staff-name { font-weight: 600; font-size: 14px; margin-bottom: 3px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .staff-name a { color: inherit; text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .staff-name a:hover { color: var(--red); }
  .staff-pos { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .staff-dept { font-size: 11px; color: var(--gold); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .staff-slug-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--muted); margin-bottom: 14px; font-family: monospace; }
  .btn-copy-link {
    padding: 2px 4px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    opacity: 0;
    pointer-events: none;
  }
  .staff-name-row:hover .btn-copy-link { opacity: 1; pointer-events: auto; }
  .btn-copy-link:hover { color: var(--red); }
  .btn-copy-link.copied { color: var(--green); }
  .staff-card-bottom {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.25s ease, opacity 0.2s ease, margin-top 0.25s ease;
    margin-top: 0;
  }
  .staff-card:hover .staff-card-bottom {
    max-height: 80px;
    opacity: 1;
    margin-top: 14px;
  }
  .staff-card-actions { display: flex; gap: 8px; }
  .btn-edit, .btn-delete {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-edit {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-edit:hover { border-color: var(--red); color: var(--text); }
  .btn-delete {
    background: transparent;
    border: 1px solid transparent;
    color: var(--muted);
  }
  .btn-delete:hover { border-color: rgba(232,0,29,0.3); color: var(--red); background: var(--red-dim); }
  .btn-edit svg, .btn-delete svg { width: 13px; height: 13px; }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }
  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    width: 540px;
    max-width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: fadeUp 0.3s cubic-bezier(.22,1,.36,1) both;
  }
  .modal-header {
    padding: 24px 28px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .modal-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 1.5px;
  }
  .modal-close {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .modal-close:hover { border-color: var(--red); color: var(--red); }
  .modal-body { padding: 24px 28px; }
  .modal-footer {
    padding: 16px 28px 24px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  .btn-cancel {
    padding: 10px 20px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-cancel:hover { border-color: var(--text); color: var(--text); }
  .btn-save {
    padding: 10px 24px;
    background: linear-gradient(135deg, var(--red), #c0001a);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 16px var(--red-glow);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn-save:hover { transform: translateY(-1px); }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* ── Form ── */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .form-input, .form-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-input:focus, .form-select:focus { border-color: var(--red); }
  .form-select option { background: #0f1824; }

  /* ── Photo upload ── */
  .photo-upload-area {
    border: 2px dashed var(--border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .photo-upload-area:hover { border-color: var(--red); background: var(--red-dim); }
  .photo-upload-area.has-photo { border-style: solid; border-color: var(--red); }
  .photo-preview {
    width: 64px; height: 64px;
    border-radius: 50%;
    border: 2px solid var(--red);
    overflow: hidden;
    flex-shrink: 0;
    background: linear-gradient(135deg, #1e2e50, #0d1a2e);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    color: var(--red);
  }
  .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
  .photo-upload-text { flex: 1; }
  .photo-upload-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
  .photo-upload-sub { font-size: 11px; color: var(--muted); }
  .photo-upload-btn {
    padding: 8px 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .photo-upload-btn:hover { border-color: var(--red); color: var(--red); }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: 28px;
    right: 28px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    z-index: 200;
    animation: slideUp 0.3s cubic-bezier(.22,1,.36,1) both;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .toast.success { border-color: rgba(34,197,94,0.3); }
  .toast.success .toast-dot { background: var(--green); }
  .toast.error { border-color: rgba(232,0,29,0.3); }
  .toast.error .toast-dot { background: var(--red); }
  .toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ── Badge ── */
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .badge-active { background: var(--green-dim); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }

  /* ── Stat cards ── */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
  }
  .stat-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 1px; color: var(--text); }
  .stat-value span { color: var(--red); }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
  }
  .empty-state svg { width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.3; display: block; }
  .empty-state p { font-size: 14px; }

  /* ── Spinner ── */
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding: 20px; }
    .form-row { grid-template-columns: 1fr; }
    .stats-row { grid-template-columns: 1fr; }
  }

  /* ── Search bar ── */
  .search-wrap {
    position: relative;
    margin-bottom: 24px;
  }
  .search-wrap svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px;
    color: var(--muted);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px 11px 40px;
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--red); }
  .search-input::placeholder { color: var(--muted); }

  /* ── Department group ── */
  .dept-group { margin-bottom: 28px; }
  .dept-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 12px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;
  }
  .dept-header:hover { border-color: var(--border-hover); }
  .dept-header-left { display: flex; align-items: center; gap: 10px; }
  .dept-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); flex-shrink: 0; }
  .dept-name-label { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; color: var(--text); }
  .dept-count {
    font-size: 11px; color: var(--muted);
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 20px; padding: 2px 8px;
  }
  .dept-chevron { width: 16px; height: 16px; color: var(--muted); transition: transform 0.2s; flex-shrink: 0; }
  .dept-chevron.open { transform: rotate(180deg); }

  /* ── CSV Import ── */
  .btn-secondary { display:flex; align-items:center; gap:8px; background:transparent; border:1px solid var(--border); border-radius:10px; padding:10px 16px; color:var(--muted); font-family:'Outfit',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .btn-secondary:hover { border-color:var(--text); color:var(--text); }
  .btn-secondary svg { width:15px; height:15px; flex-shrink:0; }
  .import-drop-zone { border:2px dashed var(--border); border-radius:12px; padding:40px 20px; text-align:center; cursor:pointer; transition:all 0.2s; }
  .import-drop-zone:hover, .import-drop-zone.drag-over { border-color:var(--red); background:var(--red-dim); }
  .import-drop-icon { width:40px; height:40px; margin:0 auto 14px; opacity:0.4; display:block; }
  .import-drop-title { font-size:14px; font-weight:600; margin-bottom:6px; }
  .import-drop-sub { font-size:12px; color:var(--muted); }
  .import-preview-table { width:100%; border-collapse:collapse; font-size:12px; }
  .import-preview-table th { text-align:left; padding:8px 10px; font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--border); white-space:nowrap; }
  .import-preview-table td { padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.03); vertical-align:middle; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .import-preview-table tr.is-duplicate td { background:rgba(232,0,29,0.03); }
  .import-preview-table tr.is-skip td { opacity:0.4; }
  .import-row-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; letter-spacing:0.5px; }
  .import-row-badge.new { background:var(--green-dim); color:var(--green); border:1px solid rgba(34,197,94,0.2); }
  .import-row-select { background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:6px; padding:4px 8px; color:var(--text); font-size:11px; cursor:pointer; outline:none; }
  .import-row-select:focus { border-color:var(--red); }
  .import-row-select option { background:#0f1824; }
  .import-summary { display:flex; align-items:center; gap:20px; padding:12px 16px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid var(--border); flex-wrap:wrap; }
  .import-summary-item { font-size:12px; color:var(--muted); }
  .import-summary-item span { color:var(--text); font-weight:600; }
`

/* ─── Icons ──────────────────────────────────────────────────────────── */
const Icon = {
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  shieldUser: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>,
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`toast ${type}`}>
      <div className="toast-dot"/>
      {msg}
    </div>
  )
}

/* ─── Photo Upload ───────────────────────────────────────────────────── */
function PhotoUpload({ value, onChange, initials }) {
  const fileRef = useRef()
  const [preview, setPreview] = useState(value || null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    onChange(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className={`photo-upload-area ${preview ? 'has-photo' : ''}`} onClick={() => fileRef.current.click()}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
      <div className="photo-preview">
        {preview ? <img src={preview} alt="preview"/> : initials}
      </div>
      <div className="photo-upload-text">
        <div className="photo-upload-title">{preview ? 'Photo selected' : 'Upload photo'}</div>
        <div className="photo-upload-sub">JPG or PNG, max 5MB</div>
      </div>
      <div className="photo-upload-btn">{preview ? 'Change' : 'Browse'}</div>
    </div>
  )
}

/* ─── Staff Modal ────────────────────────────────────────────────────── */
const genCode = () => {
  const num = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0')
  return `rt-${num}`
}

function StaffModal({ staff, departments, onClose, onSaved, showToast }) {
  const isEdit = !!staff?.id
  const [form, setForm] = useState({
    full_name: staff?.full_name || '',
    position: staff?.position || '',
    email: staff?.email || '',
    mobile: staff?.mobile || '',
    dept_id: staff?.dept_id || '',
    department_name: staff?.departments?.name || '',
    card_slug: staff?.card_slug || (staff?.id ? '' : genCode()),
    is_active: staff?.is_active ?? true,
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const initials = form.full_name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.full_name || !form.position || !form.email) {
      showToast('Name, position and email are required', 'error'); return
    }
    setSaving(true)
    try {
      let photo_url = staff?.photo_url || null

      // Upload photo using service role key (bypasses storage policies)
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const filename = `${form.card_slug}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('staff-photos')
          .upload(filename, photoFile, { upsert: true })
        if (upErr) {
          console.error('Photo upload error:', upErr.message)
          showToast('Photo upload failed — staff saved without photo', 'error')
        } else {
          photo_url = `https://omuopaupndqxwsuyvtoy.supabase.co/storage/v1/object/public/staff-photos/${filename}`
        }
      }
// Resolve department name → dept_id (create if new)
let resolvedDeptId = null
if (form.department_name.trim()) {
  const existing = departments.find(
    d => d.name.toLowerCase() === form.department_name.toLowerCase().trim()
  )
  if (existing) {
    resolvedDeptId = existing.id
  } else {
    const { data: newDept } = await supabase
      .from('departments')
      .insert({ name: form.department_name.trim(), org_id: ORG_ID })
      .select()
      .single()
    if (newDept) resolvedDeptId = newDept.id
  }
}
      const { department_name, dept_id: _d, ...formData } = form
      const payload = {
      ...formData,
      org_id: ORG_ID,
      photo_url,
      dept_id: resolvedDeptId,
      }
      let error
      if (isEdit) {
        ;({ error } = await supabase.from('staff').update(payload).eq('id', staff.id))
      } else {
        ;({ error } = await supabase.from('staff').insert(payload))
      }

      if (error) throw error
      showToast(isEdit ? 'Staff updated!' : 'Staff added!', 'success')
      onSaved()
      onClose()
    } catch (e) {
      showToast(e.message || 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Staff' : 'Add New Staff'}</div>
          <button className="modal-close" onClick={onClose}>{Icon.x}</button>
        </div>
        <div className="modal-body">
          {/* Photo */}
          <div className="form-group">
            <label className="form-label">Photo</label>
            <PhotoUpload
              value={staff?.photo_url}
              onChange={setPhotoFile}
              initials={initials || '?'}
            />
          </div>
          {/* Name + Position */}
          <div className="form-row">
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ahmad Bin Abdullah"/>
            </div>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Position *</label>
              <input className="form-input" value={form.position} onChange={e => set('position', e.target.value)} placeholder="Senior Engineer"/>
            </div>
          </div>
          {/* Email + Mobile */}
          <div className="form-row">
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ahmad@redtone.com"/>
            </div>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Mobile</label>
              <input className="form-input" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+601X-XXXXXXX"/>
            </div>
          </div>
          {/* Department + Slug */}
          <div className="form-row">
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Department</label>
              <input className="form-input" list="dept-suggestions" value={form.department_name} onChange={e => set('department_name', e.target.value)} placeholder="e.g. Technology Division"/>   
              <datalist id="dept-suggestions"> {departments.map(d => <option key={d.id} value={d.name}/>)}
              </datalist>
            </div>
            <div className="form-group" style={{margin:0}}>
              <label className="form-label">Card Slug</label>
              <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                <input
                  className="form-input"
                  style={{margin:0, flex:1, fontFamily:'monospace', fontSize:'13px'}}
                  value={form.card_slug}
                  onChange={e => set('card_slug', e.target.value)}
                  placeholder="rt-00000"
                />
                <button
                  type="button"
                  title="Generate new code"
                  onClick={() => set('card_slug', genCode())}
                  style={{
                    flexShrink:0, height:'42px', padding:'0 12px',
                    background:'transparent', border:'1px solid var(--border)',
                    borderRadius:'10px', color:'var(--muted)', cursor:'pointer',
                    fontSize:'11px', fontFamily:'Outfit,sans-serif', fontWeight:600,
                    letterSpacing:'0.5px', whiteSpace:'nowrap', transition:'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--red)'; e.currentTarget.style.color='var(--red)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)' }}
                >
                  ↻ New Code
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner"/></> : <>{isEdit ? 'Save Changes' : 'Add Staff'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── CSV Import Modal ───────────────────────────────────────────────── */
function CSVImportModal({ existingStaff, departments, onClose, onImported, showToast }) {
  const fileRef = useRef()
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const downloadTemplate = () => {
    const csv = 'name,position,email,mobile,department\nAhmad Bin Abdullah,Senior Engineer,ahmad@redtone.com,+60123456789,Technology Division'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'staff_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text) => {
    // Strip BOM (added by Excel when saving as CSV) and normalise line endings
    const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = clean.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = []
      let cur = '', inQ = false
      for (const c of line) {
        if (c === '"') { inQ = !inQ; continue }
        if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue }
        cur += c
      }
      cols.push(cur.trim())
      const row = {}
      headers.forEach((h, i) => { row[h] = (cols[i] || '').replace(/"/g, '') })
      return row
    })
  }

  const processFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result)
      const withMeta = parsed.map(row => {
        const name = (row.name || row.full_name || '').trim()
        const email = (row.email || '').toLowerCase().trim()
        const isDuplicate = existingStaff.some(s => s.email?.toLowerCase() === email && email !== '')
        return {
          full_name: name,
          position: (row.position || '').trim(),
          email,
          mobile: (row.mobile || row.phone || '').trim(),
          department_name: (row.department || row.dept || '').trim(),
          card_slug: slugify(name),
          isDuplicate,
          action: isDuplicate ? 'skip' : 'import',
        }
      })
      setRows(withMeta)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const setRowAction = (idx, action) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, action } : r))

  const toImport = rows.filter(r => r.action !== 'skip')
  const toSkip = rows.filter(r => r.action === 'skip')
  const duplicates = rows.filter(r => r.isDuplicate)

  // Resolve dept name → id: check cache → DB lookup (ilike) → insert → re-fetch on conflict
  const resolveDept = async (deptName, deptCache) => {
    const lower = deptName.toLowerCase().trim()
    // 1. Check local cache first (avoids repeated DB calls in same import batch)
    const cached = deptCache.find(d => d.name.toLowerCase() === lower)
    if (cached) return cached.id
    // 2. Case-insensitive lookup directly in DB (catches mismatches the cache might miss)
    const { data: found } = await supabase
      .from('departments')
      .select('id, name')
      .eq('org_id', ORG_ID)
      .ilike('name', deptName.trim())
      .maybeSingle()
    if (found) { deptCache.push(found); return found.id }
    // 3. Insert new department
    const { data: created, error: insertErr } = await supabase
      .from('departments')
      .insert({ name: deptName.trim(), org_id: ORG_ID })
      .select().single()
    if (created) { deptCache.push(created); return created.id }
    // 4. If insert failed (e.g. unique constraint race), try fetching once more
    if (insertErr) {
      const { data: retry } = await supabase
        .from('departments')
        .select('id, name')
        .eq('org_id', ORG_ID)
        .ilike('name', deptName.trim())
        .maybeSingle()
      if (retry) { deptCache.push(retry); return retry.id }
    }
    return null
  }

  const handleImport = async () => {
    if (toImport.length === 0) { showToast('No rows selected to import', 'error'); return }
    setImporting(true)
    let success = 0, failed = 0
    // Shared cache so departments created mid-import are reused for subsequent rows
    const deptCache = [...departments]

    for (const row of toImport) {
      try {
        let resolvedDeptId = null
        if (row.department_name.trim()) {
          resolvedDeptId = await resolveDept(row.department_name, deptCache)
        }

        const payload = {
          full_name: row.full_name,
          position: row.position,
          email: row.email,
          mobile: row.mobile,
          dept_id: resolvedDeptId,
          card_slug: row.card_slug,
          org_id: ORG_ID,
          is_active: true,
        }

        if (row.action === 'overwrite') {
          const match = existingStaff.find(s => s.email?.toLowerCase() === row.email)
          if (match) {
            const { error } = await supabase.from('staff').update(payload).eq('id', match.id)
            if (error) throw error
          }
        } else {
          const { error } = await supabase.from('staff').insert(payload)
          if (error) throw error
        }
        success++
      } catch (e) {
        console.error('Row failed:', row.email, e.message)
        failed++
      }
    }

    showToast(
      `Imported ${success} staff${failed ? `, ${failed} failed` : ''}`,
      success > 0 ? 'success' : 'error'
    )
    onImported()
    onClose()
    setImporting(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '780px' }}>
        <div className="modal-header">
          <div className="modal-title">Import Staff CSV</div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button className="btn-secondary" onClick={downloadTemplate}>
              {Icon.download} Download Template
            </button>
            <button className="modal-close" onClick={onClose}>{Icon.x}</button>
          </div>
        </div>

        <div className="modal-body">
          {rows.length === 0 ? (
            <div
              className={`import-drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }}
                onChange={e => e.target.files[0] && processFile(e.target.files[0])}/>
              <svg className="import-drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className="import-drop-title">Drop your CSV file here</div>
              <div className="import-drop-sub">or click to browse · columns: name, position, email, mobile, department</div>
            </div>
          ) : (
            <>
              <div className="import-summary">
                <div className="import-summary-item">Total: <span>{rows.length}</span></div>
                <div className="import-summary-item">To import: <span style={{color:'var(--green)'}}>{toImport.length}</span></div>
                {toSkip.length > 0 && <div className="import-summary-item">Skipping: <span>{toSkip.length}</span></div>}
                {duplicates.length > 0 && <div className="import-summary-item">Duplicates: <span style={{color:'var(--red)'}}>{duplicates.length} — choose skip or overwrite</span></div>}
                <button className="btn-secondary" style={{marginLeft:'auto',padding:'4px 12px',fontSize:'11px'}} onClick={() => setRows([])}>
                  Clear
                </button>
              </div>

              <div style={{ overflowX:'auto', maxHeight:'360px', overflowY:'auto', marginTop:16 }}>
                <table className="import-preview-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Department</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className={`${row.isDuplicate ? 'is-duplicate' : ''} ${row.action === 'skip' ? 'is-skip' : ''}`}>
                        <td title={row.full_name}>{row.full_name}</td>
                        <td title={row.position}>{row.position}</td>
                        <td style={{fontFamily:'monospace',fontSize:'11px'}} title={row.email}>{row.email}</td>
                        <td>{row.mobile}</td>
                        <td title={row.department_name}>{row.department_name}</td>
                        <td>
                          {row.isDuplicate ? (
                            <select className="import-row-select" value={row.action} onChange={e => setRowAction(idx, e.target.value)}>
                              <option value="skip">Skip (duplicate)</option>
                              <option value="overwrite">Overwrite</option>
                            </select>
                          ) : (
                            <span className="import-row-badge new">New</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          {rows.length > 0 && (
            <button className="btn-save" onClick={handleImport} disabled={importing || toImport.length === 0}>
              {importing
                ? <><div className="spinner"/> Importing…</>
                : <>Import {toImport.length} Staff</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Staff List ─────────────────────────────────────────────────────── */
function StaffPage({ showToast, userRole, viewerProfile }) {
  const isHR = userRole === 'admin' || userRole === 'super_admin'
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const [importModal, setImportModal] = useState(false)

  const load = async () => {
    setLoading(true)
    let staffQuery = supabase.from('staff').select('*, departments(name)').eq('org_id', ORG_ID).order('full_name')
    if (!isHR && viewerProfile && !viewerProfile.can_view_all && viewerProfile.dept_id) {
      staffQuery = staffQuery.eq('dept_id', viewerProfile.dept_id)
    }
    const [s, d] = await Promise.all([
      staffQuery,
      supabase.from('departments').select('*').eq('org_id', ORG_ID)
    ])
    setStaff(s.data || [])
    setDepartments(d.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (s) => {
    if (!confirm(`Remove ${s.full_name}?`)) return
    const { error } = await supabase.from('staff').delete().eq('id', s.id)
    if (error) { showToast('Delete failed', 'error'); return }
    showToast(`${s.full_name} removed`, 'success')
    load()
  }

  const initials = (name) => name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
  const toggleCollapse = (dept) => setCollapsed(prev => ({ ...prev, [dept]: !prev[dept] }))

  // Filter by search query
  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.departments?.name || '').toLowerCase().includes(q) ||
      s.position.toLowerCase().includes(q)
    )
  })

  // Group filtered staff by department
  const grouped = filtered.reduce((acc, s) => {
    const dept = s.departments?.name || 'Uncategorized'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(s)
    return acc
  }, {})

  const deptKeys = Object.keys(grouped).sort()

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Staff Management</div>
          <div className="page-sub">
            {staff.length} staff members · REDtone IoT
            {!isHR && <span style={{marginLeft:8,padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',background:'rgba(201,151,58,0.12)',color:'var(--gold)',border:'1px solid rgba(201,151,58,0.25)'}}>View Only</span>}
          </div>
        </div>
        {isHR && (
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-secondary" onClick={() => setImportModal(true)}>
              {Icon.upload} Import CSV
            </button>
            <button className="btn-primary" onClick={() => setModal('add')}>
              {Icon.plus} Add Staff
            </button>
          </div>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Staff</div>
          <div className="stat-value"><span>{staff.length}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Cards</div>
          <div className="stat-value"><span>{staff.filter(s => s.is_active).length}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Departments</div>
          <div className="stat-value"><span>{departments.length}</span></div>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="search-input"
          placeholder="Search by name, position or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}/></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {Icon.users}
          <p>{search ? `No results for "${search}"` : 'No staff yet. Add your first staff member!'}</p>
        </div>
      ) : (
        deptKeys.map(dept => {
          const members = grouped[dept]
          const isOpen = !collapsed[dept]
          return (
            <div className="dept-group" key={dept}>
              {/* Department header — click to collapse/expand */}
              <div className="dept-header" onClick={() => toggleCollapse(dept)}>
                <div className="dept-header-left">
                  <div className="dept-dot"/>
                  <span className="dept-name-label">{dept}</span>
                  <span className="dept-count">{members.length} staff</span>
                </div>
                <svg className={`dept-chevron ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {/* Staff cards — hidden when collapsed */}
              {isOpen && (
                <div className="staff-grid">
                  {members.map((s, i) => (
                    <div className="staff-card" key={s.id} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="staff-card-top">
                        <div className="staff-avatar">
                          {s.photo_url
                            ? <img src={s.photo_url} alt={s.full_name}/>
                            : initials(s.full_name)
                          }
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <div className="staff-name-row" style={{display:'flex',alignItems:'center',gap:'4px'}}>
                            <div className="staff-name" style={{flex:1,minWidth:0}}>
                              <a href={`/${s.card_slug}/`} target="_blank" rel="noopener noreferrer" title="View card">
                                {s.full_name.toUpperCase()}
                              </a>
                            </div>
                            <button
                              className="btn-copy-link"
                              title="Copy card link"
                              onClick={(e) => {
                                e.stopPropagation()
                                const btn = e.currentTarget
                                const url = `${window.location.origin}/${s.card_slug}/`
                                navigator.clipboard.writeText(url).then(() => {
                                  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                                  btn.classList.add('copied')
                                  setTimeout(() => {
                                    btn.innerHTML = '<img src="https://img.icons8.com/ios7/96/FFFFFF/link.png" width="13" height="13" style="display:block;opacity:0.5" />'
                                    btn.classList.remove('copied')
                                  }, 2000)
                                })
                              }}
                            >
                              <img src="https://img.icons8.com/ios7/96/FFFFFF/link.png" width="13" height="13" style={{display:'block',opacity:0.5}}/>
                            </button>
                          </div>
                          <div className="staff-pos">{s.position.toUpperCase()}</div>
                          {s.departments && <div className="staff-dept">{s.departments.name.toUpperCase()}</div>}
                        </div>
                        <span className="badge badge-active">Active</span>
                      </div>
                      <div className="staff-card-bottom">
                        <div className="staff-slug-row" style={{fontSize:'12px',color:'var(--muted)',marginBottom:'10px',fontFamily:'monospace'}}>
                          /{s.card_slug}
                        </div>
                        {isHR ? (
                          <div className="staff-card-actions">
                            <button className="btn-edit" onClick={() => setModal(s)}>
                              {Icon.edit} Edit
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(s)}>
                              {Icon.trash}
                            </button>
                          </div>
                        ) : (
                          <div style={{fontSize:11,color:'var(--muted)',letterSpacing:'0.5px'}}>View only access</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {modal && (
        <StaffModal
          staff={modal === 'add' ? null : modal}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={load}
          showToast={showToast}
        />
      )}

      {importModal && (
        <CSVImportModal
          existingStaff={staff}
          departments={departments}
          onClose={() => setImportModal(false)}
          onImported={load}
          showToast={showToast}
        />
      )}
    </>
  )
}

/* ─── Set Password (invite + reset flow) ────────────────────────────── */
function SetPassword({ onDone, mode }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSet = async (e) => {
    e.preventDefault()
    if (pass.length < 8) { setError('Password must be at least 8 characters'); return }
    if (pass !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) { setError(error.message); setLoading(false) }
    else onDone()
  }

  const isInvite = mode === 'invite'

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><span>RED</span>tone Admin</div>
        <div className="login-subtitle">{isInvite ? 'Set Your Password' : 'Reset Your Password'}</div>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:24,textAlign:'center',lineHeight:1.6}}>
          {isInvite
            ? 'Welcome! Please set a password to complete your account setup.'
            : 'Enter a new password for your account.'}
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSet}>
          <label className="login-label">New Password</label>
          <input className="login-input" type="password" value={pass}
            onChange={e => setPass(e.target.value)} placeholder="Min. 8 characters" autoFocus/>
          <label className="login-label">Confirm Password</label>
          <input className="login-input" type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"/>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isInvite ? 'Set Password & Continue' : 'Reset Password & Continue')}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Login ──────────────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('login')       // 'login' | 'forgot' | 'forgot_sent'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setError(error.message); setLoading(false) }
    else onLogin()
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + window.location.pathname,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setView('forgot_sent'); setLoading(false) }
  }

  // ── Forgot sent confirmation ──
  if (view === 'forgot_sent') return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><span>RED</span>tone Admin</div>
        <div className="login-subtitle">Check Your Email</div>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:16}}>📬</div>
          <div style={{fontSize:14,color:'var(--text)',lineHeight:1.6,marginBottom:8}}>
            We sent a password reset link to
          </div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--red)',marginBottom:16}}>
            {email}
          </div>
          <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.6}}>
            Check your inbox and click the link to reset your password. The link expires in 1 hour.
          </div>
        </div>
        <button
          className="login-btn"
          style={{background:'transparent',border:'1px solid var(--border)',color:'var(--muted)',boxShadow:'none'}}
          onClick={() => { setView('login'); setError('') }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )

  // ── Forgot password form ──
  if (view === 'forgot') return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><span>RED</span>tone Admin</div>
        <div className="login-subtitle">Reset Password</div>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:24,textAlign:'center',lineHeight:1.6}}>
          Enter your email and we'll send you a reset link.
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleForgot}>
          <label className="login-label">Email</label>
          <input className="login-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="admin@redtone.com" autoFocus/>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <button
          onClick={() => { setView('login'); setError('') }}
          style={{
            width:'100%', marginTop:12, background:'transparent', border:'none',
            color:'var(--muted)', fontSize:13, cursor:'pointer', padding:'8px',
          }}
        >
          ← Back to Sign In
        </button>
      </div>
    </div>
  )

  // ── Normal login form ──
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><span>RED</span>tone Admin</div>
        <div className="login-subtitle">HR Portal · Digital Cards</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleLogin}>
          <label className="login-label">Email</label>
          <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@redtone.com" autoFocus/>
          <label className="login-label">Password</label>
          <input className="login-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"/>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => { setView('forgot'); setError('') }}
          style={{
            width:'100%', marginTop:12, background:'transparent', border:'none',
            color:'var(--muted)', fontSize:13, cursor:'pointer', padding:'8px',
            transition:'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--muted)'}
        >
          Forgot password?
        </button>
      </div>
    </div>
  )
}

/* ─── Users Page (HR only) ───────────────────────────────────────────── */
function UsersPage({ showToast, isSuperAdmin }) {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteDeptId, setInviteDeptId] = useState('')
  const [inviteAll, setInviteAll] = useState(false)
  const [inviting, setInviting] = useState(false)

  const load = async () => {
    setLoading(true)
    const [u, d, a] = await Promise.all([
      supabase.from('org_users_with_email').select('*, departments(name)').eq('org_id', ORG_ID).order('created_at', { ascending: false }),
      supabase.from('departments').select('*').eq('org_id', ORG_ID).order('name'),
      supabase.from('hr_admins_with_email').select('*').eq('org_id', ORG_ID).order('created_at', { ascending: false }),
    ])
    const viewers = (u.data || []).map(x => ({ ...x, isAdmin: false }))
    const admins  = (a.data || []).map(x => ({ ...x, isAdmin: true }))
    setUsers([...admins, ...viewers])
    setDepartments(d.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { showToast('Email is required', 'error'); return }
    setInviting(true)
    try {
      // 1. Create auth user via invite
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(inviteEmail.trim())
      if (inviteErr) throw inviteErr
      const newUserId = inviteData.user.id
      // 2. Insert into org_users
      const { error: insertErr } = await supabase.from('org_users').insert({
        org_id: ORG_ID,
        user_id: newUserId,
        role: 'viewer',
        dept_id: inviteAll ? null : (inviteDeptId || null),
        can_view_all: inviteAll,
      })
      if (insertErr) throw insertErr
      showToast(`Invite sent to ${inviteEmail}`, 'success')
      setInviteEmail(''); setInviteDeptId(''); setInviteAll(false)
      load()
    } catch (e) {
      showToast(e.message || 'Invite failed', 'error')
    } finally {
      setInviting(false)
    }
  }

  const toggleViewAll = async (u) => {
    const newVal = !u.can_view_all
    const { error } = await supabase.from('org_users')
      .update({ can_view_all: newVal, dept_id: newVal ? null : u.dept_id })
      .eq('id', u.id)
    if (error) { showToast('Update failed', 'error'); return }
    showToast(newVal ? 'Granted all-department access' : 'Restricted to department only', 'success')
    load()
  }

  const changeDept = async (u, deptId) => {
    const { error } = await supabase.from('org_users').update({ dept_id: deptId || null }).eq('id', u.id)
    if (error) { showToast('Update failed', 'error'); return }
    showToast('Department updated', 'success')
    load()
  }

  const removeUser = async (u) => {
    const label = u.isAdmin ? 'admin access' : 'viewer access'
    if (!confirm(`Remove ${label} for ${u.email}?`)) return
    const table = u.isAdmin ? 'hr_admins' : 'org_users'
    const { error } = await supabaseAdmin.from(table).delete().eq('id', u.id)
    if (error) { showToast('Remove failed', 'error'); return }
    showToast('Access removed', 'success')
    load()
  }

  const toggleAdminRole = async (u) => {
    if (u.isAdmin) {
      if (!confirm(`Demote ${u.email} to Viewer? They will lose edit access.`)) return
      try {
        const { error: insertErr } = await supabaseAdmin.from('org_users').insert({
          org_id: ORG_ID, user_id: u.user_id, role: 'viewer',
          dept_id: null, can_view_all: true,
        })
        if (insertErr) throw insertErr
        const { error: deleteErr } = await supabaseAdmin.from('hr_admins').delete().eq('id', u.id)
        if (deleteErr) throw deleteErr
        showToast(`${u.email} demoted to Viewer`, 'success')
        load()
      } catch (e) { showToast(e.message || 'Demote failed', 'error') }
    } else {
      if (!confirm(`Promote ${u.email} to Admin? They will get full edit access.`)) return
      try {
        const { error: insertErr } = await supabaseAdmin.from('hr_admins').insert({
          org_id: ORG_ID, user_id: u.user_id, role: 'hr_admin',
        })
        if (insertErr) throw insertErr
        const { error: deleteErr } = await supabaseAdmin.from('org_users').delete().eq('id', u.id)
        if (deleteErr) throw deleteErr
        showToast(`${u.email} promoted to Admin`, 'success')
        load()
      } catch (e) { showToast(e.message || 'Promote failed', 'error') }
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">User Access</div>
          <div className="page-sub">Manage viewers and admins</div>
        </div>
      </div>

      {/* Invite panel */}
      <div className="stat-card" style={{marginBottom:28}}>
        <div className="stat-label" style={{marginBottom:16}}>Invite New Viewer</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'end'}}>
          <div>
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="staff@redtone.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Department Access</label>
            <select
              className="form-select"
              value={inviteAll ? '__all__' : inviteDeptId}
              onChange={e => {
                if (e.target.value === '__all__') { setInviteAll(true); setInviteDeptId('') }
                else { setInviteAll(false); setInviteDeptId(e.target.value) }
              }}
            >
              <option value="">Select department…</option>
              <option value="__all__">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleInvite} disabled={inviting} style={{height:42}}>
            {inviting ? <div className="spinner"/> : <>{Icon.plus} Send Invite</>}
          </button>
        </div>
        <div style={{fontSize:12,color:'var(--muted)',marginTop:10}}>
          An invite email will be sent. The viewer can only browse staff cards — no edit or delete access.
        </div>
      </div>

      {/* Viewers table */}
      {loading ? (
        <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}/></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          {Icon.users}
          <p>No viewers yet. Invite someone above.</p>
        </div>
      ) : (
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border)'}}>
                <th style={{textAlign:'left',padding:'12px 20px',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',fontWeight:600}}>User</th>
                <th style={{textAlign:'left',padding:'12px 20px',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',fontWeight:600}}>Department</th>
                <th style={{textAlign:'left',padding:'12px 20px',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',fontWeight:600}}>Access Level</th>
                {isSuperAdmin && <th style={{textAlign:'left',padding:'12px 20px',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',fontWeight:600}}>Admin</th>}
                <th style={{textAlign:'right',padding:'12px 20px',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',fontWeight:600}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{borderBottom: i < users.length-1 ? '1px solid var(--border)' : 'none'}}>
                  <td style={{padding:'14px 20px'}}>
                    <div style={{fontSize:13,fontWeight:500}}>{u.email || u.user_id}</div>
                    <div style={{fontSize:11,color: u.isAdmin ? 'var(--red)' : 'var(--muted)',marginTop:2}}>{u.isAdmin ? 'Admin' : 'Viewer'}</div>
                  </td>
                  <td style={{padding:'14px 20px'}}>
                    {u.isAdmin ? (
                      <span style={{color:'var(--red)',fontSize:12}}>Full Access</span>
                    ) : u.can_view_all ? (
                      <span style={{color:'var(--gold)',fontSize:12}}>All Departments</span>
                    ) : (
                      <select
                        className="import-row-select"
                        value={u.dept_id || ''}
                        onChange={e => changeDept(u, e.target.value)}
                      >
                        <option value="">— No dept —</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{padding:'14px 20px'}}>
                    {u.isAdmin ? (
                      <span style={{fontSize:12,color:'var(--muted)'}}>—</span>
                    ) : (
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
                        <div
                          onClick={() => toggleViewAll(u)}
                          style={{
                            width:36, height:20, borderRadius:10,
                            background: u.can_view_all ? 'var(--green)' : 'rgba(255,255,255,0.1)',
                            position:'relative', transition:'background 0.2s', cursor:'pointer', flexShrink:0
                          }}
                        >
                          <div style={{
                            width:14, height:14, borderRadius:'50%', background:'white',
                            position:'absolute', top:3,
                            left: u.can_view_all ? 19 : 3,
                            transition:'left 0.2s'
                          }}/>
                        </div>
                        <span style={{fontSize:12,color: u.can_view_all ? 'var(--green)' : 'var(--muted)'}}>
                          {u.can_view_all ? 'All departments' : 'Own dept only'}
                        </span>
                      </label>
                    )}
                  </td>
                  {isSuperAdmin && (
                    <td style={{padding:'14px 20px'}}>
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
                        <div
                          onClick={() => toggleAdminRole(u)}
                          title={u.isAdmin ? 'Demote to Viewer' : 'Promote to Admin'}
                          style={{
                            width:36, height:20, borderRadius:10,
                            background: u.isAdmin ? 'var(--red)' : 'rgba(255,255,255,0.1)',
                            position:'relative', transition:'background 0.2s', cursor:'pointer', flexShrink:0
                          }}
                        >
                          <div style={{
                            width:14, height:14, borderRadius:'50%', background:'white',
                            position:'absolute', top:3,
                            left: u.isAdmin ? 19 : 3,
                            transition:'left 0.2s'
                          }}/>
                        </div>
                        <span style={{fontSize:12, color: u.isAdmin ? 'var(--red)' : 'var(--muted)'}}>
                          {u.isAdmin ? 'Admin' : 'Viewer'}
                        </span>
                      </label>
                    </td>
                  )}
                  <td style={{padding:'14px 20px',textAlign:'right'}}>
                    <button
                      onClick={() => removeUser(u)}
                      style={{
                        background:'transparent', border:'1px solid transparent',
                        borderRadius:8, padding:'6px 10px', color:'var(--muted)',
                        fontSize:12, cursor:'pointer', transition:'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(232,0,29,0.3)'; e.currentTarget.style.color='var(--red)'; e.currentTarget.style.background='var(--red-dim)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.background='transparent' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* ─── App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [passwordMode, setPasswordMode] = useState('invite')  // 'invite' | 'recovery'
  const [userRole, setUserRole] = useState(null)      // 'super_admin' | 'admin' | 'viewer'
  const [viewerProfile, setViewerProfile] = useState(null) // { dept_id, can_view_all }
  const [page, setPage] = useState('staff')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const hash = window.location.hash
    const isInvite = hash.includes('type=invite')
    const isRecovery = hash.includes('type=recovery')

    if (isInvite || isRecovery) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setSession(data.session)
          setPasswordMode(isInvite ? 'invite' : 'recovery')
          setNeedsPassword(true)
          setChecking(false)
          window.history.replaceState(null, '', window.location.pathname)
        } else {
          setChecking(false)
        }
      })
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session)
        detectRole(data.session.user.id)
      } else {
        setChecking(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      if (s) detectRole(s.user.id)
      else { setUserRole(null); setViewerProfile(null); setChecking(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const detectRole = async (userId) => {
    // Check super_admins first
    const { data: superRecord } = await supabase
      .from('super_admins').select('id').eq('user_id', userId).maybeSingle()
    if (superRecord) {
      setUserRole('super_admin')
      setChecking(false)
      return
    }
    // Check hr_admins (admin)
    const { data: adminRecord } = await supabase
      .from('hr_admins').select('id').eq('user_id', userId).maybeSingle()
    if (adminRecord) {
      setUserRole('admin')
      setChecking(false)
      return
    }
    // Check org_users (viewer)
    const { data: viewerRecord } = await supabase
      .from('org_users').select('dept_id, can_view_all').eq('user_id', userId).maybeSingle()
    if (viewerRecord) {
      setUserRole('viewer')
      setViewerProfile({ dept_id: viewerRecord.dept_id, can_view_all: viewerRecord.can_view_all })
      setChecking(false)
      return
    }
    setUserRole('viewer')
    setChecking(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() })
  }

  if (checking) return null

  if (!session) return (
    <>
      <style>{css}</style>
      <Login onLogin={() => {}}/>
    </>
  )

  if (needsPassword) return (
    <>
      <style>{css}</style>
      <SetPassword mode={passwordMode} onDone={() => {
        setNeedsPassword(false)
        detectRole(session.user.id)
      }}/>
    </>
  )

  const isSuperAdmin = userRole === 'super_admin'
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const roleBadgeColor = isSuperAdmin ? 'var(--gold)' : isAdmin ? 'var(--red)' : 'var(--muted)'
  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Viewer'

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo"><span>RED</span>tone</div>
          <div className="sidebar-label">Management</div>
          <div className={`nav-item ${page==='staff' ? 'active' : ''}`} onClick={() => setPage('staff')}>
            {Icon.users} Staff
          </div>
          <div className={`nav-item ${page==='dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
            {Icon.dashboard} Dashboard
          </div>
          {isAdmin && (
            <div className={`nav-item ${page==='users' ? 'active' : ''}`} onClick={() => setPage('users')}>
              {Icon.shieldUser} User Access
            </div>
          )}
          <div className="sidebar-bottom">
            <div style={{marginBottom:8}}>
              <span style={{
                display:'inline-block', padding:'2px 8px', borderRadius:6,
                fontSize:10, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase',
                background: isSuperAdmin ? 'rgba(201,151,58,0.12)' : isAdmin ? 'rgba(232,0,29,0.12)' : 'rgba(255,255,255,0.06)',
                color: roleBadgeColor,
                border: `1px solid ${isSuperAdmin ? 'rgba(201,151,58,0.25)' : isAdmin ? 'rgba(232,0,29,0.25)' : 'rgba(255,255,255,0.12)'}`,
              }}>{roleLabel}</span>
            </div>
            <div className="user-badge">
              <div className="user-dot"/>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {session.user.email}
              </span>
            </div>
            <button className="logout-btn" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {page === 'staff' && <StaffPage showToast={showToast} userRole={userRole} isAdmin={isAdmin} viewerProfile={viewerProfile}/>}
          {page === 'dashboard' && (
            <div>
              <div className="page-title" style={{marginBottom:8}}>Dashboard</div>
              <div className="page-sub" style={{marginBottom:28}}>Coming in Phase 5</div>
              <div className="stat-card" style={{maxWidth:300}}>
                <div className="stat-label">Analytics</div>
                <div style={{fontSize:13,color:'var(--muted)',marginTop:8}}>Card scan tracking and analytics will be available in Phase 5.</div>
              </div>
            </div>
          )}
          {page === 'users' && isAdmin && <UsersPage showToast={showToast} isSuperAdmin={isSuperAdmin}/>}
        </main>
      </div>

      {toast && (
        <Toast key={toast.id} msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>
      )}
    </>
  )
}
