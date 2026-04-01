#!/usr/bin/env node
// generate.js — builds static HTML card pages from Supabase data
// Cards include a live-fetch script so edits in admin reflect instantly (no rebuild needed)


import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import fs from 'fs'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://omuopaupndqxwsuyvtoy.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BLHChJRx8gdjb9-jaI2WBA_zClJtSqy'
const SITE_URL = process.env.SITE_URL || 'https://redtone-digital-cards.my-agriconnect.workers.dev'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Fetch data from Supabase ─────────────────────────────────────────────────
async function fetchData() {
  console.log('📡 Fetching data from Supabase...')
  const { data: orgs } = await supabase.from('organizations').select('*, card_templates(*)')
  const { data: staff } = await supabase
    .from('staff')
    .select('*, departments(name)')
    .eq('is_active', true)
    .order('full_name')

  if (!staff?.length) {
    console.warn('⚠️  No staff found in Supabase, trying data.json fallback...')
    try {
      const fallback = JSON.parse(fs.readFileSync('./data.json', 'utf8'))
      return fallback
    } catch {
      console.error('❌  No data.json either. Exiting.')
      process.exit(1)
    }
  }
  console.log(`✅  Found ${staff.length} staff across ${orgs?.length || 0} org(s)`)
  return { orgs: orgs || [], staff }
}

// ── Generate QR code as base64 ───────────────────────────────────────────────
async function makeQR(text) {
  return await QRCode.toDataURL(text, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

// ── Generate individual card HTML ────────────────────────────────────────────
async function generateCardHTML(s, org) {
  const orgSlug  = org?.slug || 'redtone-iot'
  const cardURL  = `${SITE_URL}/${orgSlug}/${s.card_slug}/`
  const qrDataURL = await makeQR(cardURL)
  const deptName = s.departments?.name || ''
  const orgName  = org?.name || 'REDtone IoT'
  const logoUrl  = org?.card_templates?.[0]?.logo_url || ''
  const initials = s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${s.full_name} — ${orgName}</title>
  <meta property="og:title" content="${s.full_name}"/>
  <meta property="og:description" content="${s.position}${deptName ? ' · ' + deptName : ''}"/>
  ${s.photo_url ? `<meta property="og:image" content="${s.photo_url}"/>` : ''}
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --red:    #E8001D;
      --gold:   #C9973A;
      --dark:   #060b16;
      --card-bg:#0d1520;
      --text:   #f0f2f7;
      --muted:  #8892a4;
    }
    html, body {
      min-height: 100vh;
      background: var(--dark);
      font-family: 'Outfit', -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,0,29,0.12) 0%, transparent 60%);
    }
    /* ── Card shell ── */
    .card {
      background: var(--card-bg);
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.07);
      width: 100%;
      max-width: 400px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
      animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(20px); }
      to   { opacity:1; transform:translateY(0);    }
    }

    /* ── Header: logo bar ── */
    .card-logo-bar {
      background: linear-gradient(160deg, #0d1a2e 0%, #060b16 100%);
      padding: 20px 24px 16px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      border-bottom: 1px solid rgba(232,0,29,0.12);
    }
    .card-logo-bar img {
      height: 30px;
      width: auto;
      display: block;
      filter: brightness(1.1);
    }
    .card-logo-text {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px;
      letter-spacing: 2px;
      color: var(--text);
    }
    .card-logo-text span { color: var(--red); }

    /* ── Header: identity row (photo left, info right) ── */
    .card-identity {
      background: linear-gradient(160deg, #0d1a2e 0%, #060b16 100%);
      padding: 20px 24px 24px;
      display: flex;
      align-items: center;
      gap: 18px;
      border-bottom: 1px solid rgba(232,0,29,0.15);
      position: relative;
    }
    .card-identity::after {
      content: '';
      position: absolute;
      bottom: 0; left: 50%;
      transform: translateX(-50%);
      width: 60px; height: 2px;
      background: linear-gradient(90deg, transparent, var(--red), transparent);
    }
    .photo-ring {
      width: 80px; height: 80px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, var(--red), var(--gold));
      box-shadow: 0 0 20px rgba(232,0,29,0.35);
      flex-shrink: 0;
    }
    .photo-ring img {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      object-position: center top;
      border: 3px solid var(--card-bg);
      display: block;
    }
    .photo-initials {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e2e50, #0d1a2e);
      border: 3px solid var(--card-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 26px;
      color: var(--red);
    }
    .identity-info { flex: 1; min-width: 0; }
    .staff-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px;
      letter-spacing: 1.5px;
      color: var(--text);
      line-height: 1.15;
      margin-bottom: 5px;
      word-break: break-word;
    }
    .staff-position {
      font-size: 11px;
      font-weight: 600;
      color: var(--red);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 4px;
    }
    .staff-org-dept {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.5px;
    }
    .staff-org-dept .dept-sep { color: rgba(255,255,255,0.2); margin: 0 4px; }
    .staff-org-dept .dept-name { color: var(--gold); }

    /* ── Contact items ── */
    .card-body { padding: 20px 24px; }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 11px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      text-decoration: none;
      color: var(--text);
      transition: color 0.15s;
    }
    .contact-item:last-child { border-bottom: none; }
    .contact-item:hover { color: var(--red); }
    .contact-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: rgba(232,0,29,0.1);
      border: 1px solid rgba(232,0,29,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .contact-icon svg { width: 16px; height: 16px; color: var(--red); }
    .contact-label  { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    .contact-value  { font-size: 13px; font-weight: 500; }

    /* ── Footer: QR + Save button ── */
    .card-footer {
      padding: 16px 24px 28px;
      border-top: 1px solid rgba(255,255,255,0.04);
      text-align: center;
    }
    .qr-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 12px;
    }
    .qr-wrap {
      display: inline-block;
      background: white;
      border-radius: 12px;
      padding: 10px;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .qr-wrap img { width: 150px; height: 150px; display: block; }
    .save-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: linear-gradient(135deg, var(--red), #c0001a);
      border: none;
      border-radius: 12px;
      padding: 14px;
      color: white;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(232,0,29,0.3);
      transition: all 0.2s;
    }
    .save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(232,0,29,0.4); }
    .save-btn svg { width: 16px; height: 16px; }
    .wa-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: #25D366;
      border: none;
      border-radius: 12px;
      padding: 14px;
      color: white;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      cursor: pointer;
      margin-top: 10px;
      box-shadow: 0 4px 20px rgba(37,211,102,0.3);
      transition: all 0.2s;
    }
    .wa-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(37,211,102,0.4); }
    .wa-btn svg { width: 16px; height: 16px; }
  </style>
</head>
<body>
  <div class="card">

    <!-- Logo bar -->
    <div class="card-logo-bar">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="${orgName}" id="orgLogo"/>`
        : `<div class="card-logo-text"><span>RED</span>tone</div>`
      }
    </div>

    <!-- Identity row: photo left, info right -->
    <div class="card-identity">
      <div class="photo-ring" id="photoRing">
        ${s.photo_url
          ? `<img src="${s.photo_url}" alt="${s.full_name}" id="staffPhoto"/>`
          : `<div class="photo-initials" id="staffInitials">${initials}</div>`
        }
      </div>
      <div class="identity-info">
        <div class="staff-name"     id="staffName">${s.full_name}</div>
        <div class="staff-position" id="staffPosition">${s.position}</div>
        <div class="staff-org-dept" id="staffOrgDept">
          ${orgName}${deptName ? `<span class="dept-sep">·</span><span class="dept-name" id="staffDept">${deptName}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Contact details -->
    <div class="card-body">
      ${s.mobile ? `
      <a class="contact-item" href="tel:${s.mobile}" id="mobileLink">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
          </svg>
        </div>
        <div>
          <div class="contact-label">Mobile</div>
          <div class="contact-value" id="staffMobile">${s.mobile}</div>
        </div>
      </a>` : ''}
      ${s.email ? `
      <a class="contact-item" href="mailto:${s.email}" id="emailLink">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <div class="contact-label">Email</div>
          <div class="contact-value" id="staffEmail">${s.email}</div>
        </div>
      </a>` : ''}
    </div>

    <!-- QR + Save -->
    <div class="card-footer">
      <div class="qr-label">Scan to view digital card</div>
      <div class="qr-wrap">
        <img src="${qrDataURL}" alt="QR Code"/>
      </div>
      <button class="save-btn" onclick="saveContact()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        Save Contact
      </button>
      <button class="wa-btn" onclick="openWhatsApp()">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </button>
    </div>
  </div>

  <script>
    const SUPABASE_URL  = '${SUPABASE_URL}'
    const ANON_KEY      = '${SUPABASE_ANON_KEY}'
    const CARD_SLUG     = '${s.card_slug}'
    const CARD_URL      = '${cardURL}'

    window._staffData = {
      full_name: "${s.full_name}",
      position:  "${s.position}",
      mobile:    "${s.mobile || ''}",
      email:     "${s.email || ''}",
      photo_url: "${s.photo_url || ''}"
    }

    async function refreshCard() {
      try {
        const res = await fetch(
          SUPABASE_URL + '/rest/v1/staff?card_slug=eq.' + CARD_SLUG + '&select=*,departments(name)',
          { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }
        )
        const [d] = await res.json()
        if (!d) return
        window._staffData = d
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
        set('staffName', d.full_name)
        set('staffPosition', d.position)
        set('staffMobile', d.mobile || '')
        set('staffEmail', d.email || '')
        const dept = d.departments?.name || ''
        const orgDept = document.getElementById('staffOrgDept')
        if (orgDept) orgDept.innerHTML = '${orgName}' + (dept ? '<span class="dept-sep">·</span><span class="dept-name">' + dept + '</span>' : '')
        const mobileLink = document.getElementById('mobileLink')
        if (mobileLink && d.mobile) mobileLink.href = 'tel:' + d.mobile
        const emailLink = document.getElementById('emailLink')
        if (emailLink && d.email) emailLink.href = 'mailto:' + d.email
        if (d.photo_url) {
          const ring = document.getElementById('photoRing')
          if (ring) ring.innerHTML = '<img src="' + d.photo_url + '" alt="' + d.full_name + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg);display:block"/>'
        }
      } catch (_) {}
    }

    function saveContact() {
      const d = window._staffData
      const vcf = [
        'BEGIN:VCARD', 'VERSION:3.0',
        'FN:' + d.full_name,
        'ORG:${orgName}',
        'TITLE:' + d.position,
        d.mobile    ? 'TEL;TYPE=CELL:' + d.mobile    : '',
        d.email     ? 'EMAIL:' + d.email              : '',
        d.photo_url ? 'PHOTO;VALUE=URL:' + d.photo_url : '',
        'END:VCARD'
      ].filter(Boolean).join('\\r\\n')

      if (navigator.share) {
        const file = new File([vcf], d.full_name.replace(/\\s+/g, '_') + '.vcf', { type: 'text/vcard' })
        navigator.share({ files: [file] }).catch(() => fallbackDownload(vcf, d.full_name))
        return
      }
      fallbackDownload(vcf, d.full_name)
    }

    function fallbackDownload(vcf, name) {
      const blob = new Blob([vcf], { type: 'text/vcard' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name.replace(/\\s+/g, '_') + '.vcf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    function openWhatsApp() {
      const mobile = (window._staffData.mobile || '').replace(/[^0-9]/g, '')
      const msg = encodeURIComponent('Hi! Here is my digital card: ' + CARD_URL)
      window.open('https://wa.me/' + mobile + '?text=' + msg, '_blank')
    }

    refreshCard()
  </script>
</body>
</html>`
}

// ── Generate landing page ────────────────────────────────────────────────────
function generateLandingHTML(staff, orgs) {
  const org     = orgs?.[0]
  const orgName = org?.name || 'REDtone IoT'
  const logoUrl = org?.card_templates?.[0]?.logo_url || ''

  const cards = staff.map((s, i) => {
    const initials = s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    return `
    <a class="staff-card" href="/${s.card_slug}/" style="animation-delay:${i * 0.06}s">
      <div class="avatar">
        ${s.photo_url
          ? `<img src="${s.photo_url}" alt="${s.full_name}"/>`
          : `<span>${initials}</span>`
        }
      </div>
      <div class="info">
        <div class="name">${s.full_name}</div>
        <div class="pos">${s.position}</div>
        ${s.departments?.name ? `<div class="dept">${s.departments.name}</div>` : ''}
      </div>
      <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </a>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${orgName} — Digital Cards</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
    body {
      min-height: 100vh;
      background: #060b16;
      font-family: 'Outfit', -apple-system, sans-serif;
      color: #f0f2f7;
      background-image: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,0,29,0.10) 0%, transparent 60%);
    }
    .header {
      text-align: center;
      padding: 44px 24px 28px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .header img  { height: 36px; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; }
    .header-logo-text { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 3px; margin-bottom: 14px; }
    .header-logo-text span { color: #E8001D; }
    .header h1   { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 3px; color: #f0f2f7; }
    .header p    { font-size: 12px; color: #8892a4; margin-top: 4px; letter-spacing: 1px; }
    .list { max-width: 480px; margin: 28px auto; padding: 0 20px 48px; }
    .staff-card {
      display: flex; align-items: center; gap: 16px;
      background: #0f1824;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 14px 18px;
      margin-bottom: 10px;
      text-decoration: none; color: inherit;
      transition: all 0.2s;
      animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;
    }
    .staff-card:hover { border-color: rgba(232,0,29,0.4); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .avatar {
      width: 50px; height: 50px; border-radius: 50%;
      border: 2px solid #E8001D; overflow: hidden; flex-shrink: 0;
      background: linear-gradient(135deg, #1e2e50, #0d1a2e);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Bebas Neue', sans-serif; font-size: 17px; color: #E8001D;
    }
    .avatar img { width:100%; height:100%; object-fit:cover; object-position:center top; }
    .info { flex: 1; min-width: 0; }
    .name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pos  { font-size: 11px; color: #8892a4; margin-top: 2px; }
    .dept { font-size: 10px; color: #C9973A; margin-top: 2px; }
    .arrow { width: 16px; height: 16px; color: #8892a4; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl
      ? `<img src="${logoUrl}" alt="${orgName}"/>`
      : `<div class="header-logo-text"><span>RED</span>tone</div>`
    }
    <h1>Digital Cards</h1>
    <p>${staff.length} Team Member${staff.length !== 1 ? 's' : ''}</p>
  </div>
  <div class="list">${cards}</div>
  <div id="wa-toast" style="display:none;opacity:0;transition:opacity 0.4s;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#25D366;color:#fff;padding:14px 20px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;align-items:center;gap:10px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:320px;text-align:center;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  Thanks! Tap here to say hi on WhatsApp 👋
</div>
</body>
</html>`
}

// ── Generate smart login page ─────────────────────────────────────────────────
function generateLoginHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Digital Cards — Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#060b16;font-family:'Outfit',-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(232,0,29,.12) 0%,transparent 60%)}
    .card{background:#0d1520;border-radius:24px;border:1px solid rgba(255,255,255,.07);width:100%;max-width:400px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:fadeUp .6s cubic-bezier(.22,1,.36,1) both}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .logo-bar{background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);padding:28px 32px 24px;border-bottom:1px solid rgba(232,0,29,.12);text-align:center}
    .logo-text{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:3px;color:#f0f2f7}.logo-text span{color:#E8001D}
    .logo-sub{font-size:11px;color:#8892a4;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
    .form-body{padding:32px}
    .field{margin-bottom:20px}
    label{display:block;font-size:11px;font-weight:600;color:#8892a4;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    input{width:100%;background:#060b16;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px 16px;color:#f0f2f7;font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s}
    input:focus{border-color:rgba(232,0,29,.5)}
    .login-btn{width:100%;background:linear-gradient(135deg,#E8001D,#c0001a);border:none;border-radius:12px;padding:14px;color:white;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;transition:all .2s}
    .login-btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(232,0,29,.4)}
    .login-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .error{font-size:12px;color:#E8001D;margin-top:12px;text-align:center;min-height:18px}
  </style>
</head>
<body>
<div class="card">
  <div class="logo-bar">
    <div class="logo-text"><span>RED</span>tone</div>
    <div class="logo-sub">Digital Cards</div>
  </div>
  <div class="form-body">
    <div class="field">
      <label>Email</label>
      <input type="email" id="email" placeholder="you@company.com" autocomplete="email"/>
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" id="password" placeholder="••••••••" autocomplete="current-password"/>
    </div>
    <button class="login-btn" id="loginBtn" onclick="handleLogin()">Sign In</button>
    <div class="error" id="error"></div>
  </div>
</div>
<script>
  const SUPABASE_URL = 'https://omuopaupndqxwsuyvtoy.supabase.co'
  const ANON_KEY     = 'sb_publishable_BLHChJRx8gdjb9-jaI2WBA_zClJtSqy'

  async function handleLogin() {
    const email    = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const btn      = document.getElementById('loginBtn')
    const err      = document.getElementById('error')

    if (!email || !password) { err.textContent = 'Please enter email and password.'; return }

    btn.disabled = true
    btn.textContent = 'Signing in...'
    err.textContent = ''

    try {
      // 1. Sign in with Supabase Auth
      const authRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ email, password })
      })
      const auth = await authRes.json()
      if (!auth.access_token) throw new Error(auth.error_description || 'Invalid credentials')

      const token = auth.access_token

      // 2. Check if Super Admin
      const saRes = await fetch(SUPABASE_URL + '/rest/v1/super_admins?select=id&limit=1', {
        headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token }
      })
      const sa = await saRes.json()
      if (sa?.length > 0) {
        window.location.href = '/super/'
        return
      }

      // 3. Check HR Admin / Viewer — find their org
      const hrRes = await fetch(SUPABASE_URL + '/rest/v1/hr_admins?select=role,organizations(slug)&limit=1', {
        headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token }
      })
      const hr = await hrRes.json()
      if (hr?.length > 0) {
        const orgSlug = hr[0]?.organizations?.slug || 'redtone-iot'
        window.location.href = '/' + orgSlug + '/admin/'
        return
      }

      throw new Error('No access found for this account.')
    } catch(e) {
      err.textContent = e.message
      btn.disabled = false
      btn.textContent = 'Sign In'
    }
  }

  // Allow Enter key to submit
  document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin() })
</script>
</body>
</html>`
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { orgs, staff } = await fetchData()

  fs.mkdirSync('./dist', { recursive: true })

  let totalSize = 0

  for (const s of staff) {
    // Find this staff member's org
    const org     = orgs.find(o => o.id === s.org_id) || orgs?.[0]
    const orgSlug = org?.slug || 'redtone-iot'
    const html    = await generateCardHTML(s, org)
    const dir     = `./dist/${orgSlug}/${s.card_slug}`
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(`${dir}/index.html`, html)
    totalSize += html.length
    console.log(`  ✅  /${orgSlug}/${s.card_slug}/  (${(html.length / 1024).toFixed(1)} KB)`)
  }

  // Landing page (smart login) — simple redirect page for now
  const loginHTML = generateLoginHTML()
  fs.writeFileSync('./dist/index.html', loginHTML)
  console.log(`  ✅  / (login page)`)

  console.log(`\n🎉 Done! ${staff.length} cards. Total: ${(totalSize / 1024).toFixed(1)} KB`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
