#!/usr/bin/env node
// generate.js — builds static HTML card pages from Supabase data
// Cards include a live-fetch script so edits in admin reflect instantly (no rebuild needed)

import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

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

// ── Build vCard string ───────────────────────────────────────────────────────
function makeVCard(s, orgName) {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${s.full_name}`,
    `N:${s.full_name.split(' ').slice(1).join(' ')};${s.full_name.split(' ')[0]};;;`,
    `ORG:${orgName}`,
    `TITLE:${s.position}`,
    s.mobile ? `TEL;TYPE=CELL:${s.mobile}` : '',
    s.email ? `EMAIL:${s.email}` : '',
    s.photo_url ? `PHOTO;VALUE=URL:${s.photo_url}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\n')
}

// ── Generate individual card HTML ────────────────────────────────────────────
async function generateCardHTML(s, org) {
  const cardURL = `${SITE_URL}/${s.card_slug}/`
  const vCard = makeVCard(s, org?.name || 'REDtone IoT')
  const qrDataURL = await makeQR(cardURL)
  const deptName = s.departments?.name || ''

  // Logo handling
  let logoHtml = ''
  const logoUrl = org?.card_templates?.[0]?.logo_url
  if (logoUrl) {
    logoHtml = `<img src="${logoUrl}" alt="${org.name}" class="org-logo" />`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${s.full_name} — ${org?.name || 'REDtone IoT'}</title>
  <meta property="og:title" content="${s.full_name}"/>
  <meta property="og:description" content="${s.position}${deptName ? ' · ' + deptName : ''}"/>
  ${s.photo_url ? `<meta property="og:image" content="${s.photo_url}"/>` : ''}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --red: #E8001D;
      --gold: #C9973A;
      --dark: #060b16;
      --card-bg: #0d1520;
      --text: #f0f2f7;
      --muted: #8892a4;
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
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
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
      to   { opacity:1; transform:translateY(0); }
    }
    .card-header {
      background: linear-gradient(160deg, #0d1a2e 0%, #060b16 100%);
      padding: 32px 28px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(232,0,29,0.15);
      position: relative;
    }
    .card-header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 50%;
      transform: translateX(-50%);
      width: 60px; height: 2px;
      background: linear-gradient(90deg, transparent, var(--red), transparent);
    }
    .org-logo {
      height: 36px;
      width: auto;
      margin-bottom: 20px;
      display: block;
      margin-left: auto;
      margin-right: auto;
      filter: brightness(1.1);
    }
    .photo-ring {
      width: 96px; height: 96px;
      border-radius: 50%;
      margin: 0 auto 16px;
      padding: 3px;
      background: linear-gradient(135deg, var(--red), var(--gold));
      box-shadow: 0 0 24px rgba(232,0,29,0.3);
    }
    .photo-ring img {
      width: 100%; height: 100%;
      border-radius: 50%;
      object-fit: cover;
      object-position: center top;
      border: 3px solid var(--card-bg);
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
      font-size: 32px;
      color: var(--red);
    }
    .staff-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 26px;
      letter-spacing: 2px;
      color: var(--text);
      margin-bottom: 4px;
    }
    .staff-position {
      font-size: 12px;
      font-weight: 500;
      color: var(--red);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 4px;
    }
    .staff-dept {
      font-size: 11px;
      color: var(--gold);
      letter-spacing: 1px;
      margin-bottom: 0;
    }
    .card-body { padding: 24px 28px; }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
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
    .contact-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    .contact-value { font-size: 14px; font-weight: 500; }
    .card-footer {
      padding: 20px 28px 28px;
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
    .qr-wrap img { width: 160px; height: 160px; display: block; }
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
    /* skeleton loader */
    .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  </style>
</head>
<body>
  <div class="card" id="card">
    <div class="card-header">
      ${logoHtml}
      <div class="photo-ring" id="photoRing">
        ${s.photo_url
          ? `<img src="${s.photo_url}" alt="${s.full_name}" id="staffPhoto"/>`
          : `<div class="photo-initials" id="staffInitials">${s.full_name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>`
        }
      </div>
      <div class="staff-name" id="staffName">${s.full_name}</div>
      <div class="staff-position" id="staffPosition">${s.position}</div>
      ${deptName ? `<div class="staff-dept" id="staffDept">${deptName}</div>` : '<div class="staff-dept" id="staffDept"></div>'}
    </div>

    <div class="card-body" id="contactBody">
      ${s.mobile ? `
      <a class="contact-item" href="tel:${s.mobile}">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
          </svg>
        </div>
        <div>
          <div class="contact-label">Mobile</div>
          <div class="contact-value" id="staffMobile">${s.mobile}</div>
        </div>
      </a>` : ''}
      ${s.email ? `
      <a class="contact-item" href="mailto:${s.email}">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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

    <div class="card-footer">
      <div class="qr-label">Scan to view digital card</div>
      <div class="qr-wrap">
        <img src="${qrDataURL}" alt="QR Code" id="qrCode"/>
      </div>
      <button class="save-btn" onclick="saveContact()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        Save Contact
      </button>
    </div>
  </div>

  <script>
    // ── Live fetch from Supabase — reflects admin edits instantly ──────────────
    const SUPABASE_URL = '${SUPABASE_URL}'
    const ANON_KEY = '${SUPABASE_ANON_KEY}'
    const CARD_SLUG = '${s.card_slug}'

    async function refreshCard() {
      try {
        const res = await fetch(
          SUPABASE_URL + '/rest/v1/staff?card_slug=eq.' + CARD_SLUG + '&select=*,departments(name)',
          { headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY } }
        )
        const [data] = await res.json()
        if (!data) return

        // Update name
        const nameEl = document.getElementById('staffName')
        if (nameEl) nameEl.textContent = data.full_name

        // Update position
        const posEl = document.getElementById('staffPosition')
        if (posEl) posEl.textContent = data.position

        // Update dept
        const deptEl = document.getElementById('staffDept')
        if (deptEl) deptEl.textContent = data.departments?.name || ''

        // Update mobile
        const mobileEl = document.getElementById('staffMobile')
        if (mobileEl) {
          mobileEl.textContent = data.mobile || ''
          mobileEl.closest('a').href = 'tel:' + (data.mobile || '')
        }

        // Update email
        const emailEl = document.getElementById('staffEmail')
        if (emailEl) {
          emailEl.textContent = data.email || ''
          emailEl.closest('a').href = 'mailto:' + (data.email || '')
        }

        // Update photo
        const photoRing = document.getElementById('photoRing')
        if (data.photo_url && photoRing) {
          photoRing.innerHTML = '<img src="' + data.photo_url + '" alt="' + data.full_name + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg)"/>'
        }

        // Store latest data for vCard
        window._staffData = data
      } catch (e) {
        // Silently fail — static baked data remains visible
      }
    }

    // Save contact as vCard
    function saveContact() {
      const d = window._staffData || {
        full_name: '${s.full_name}',
        position: '${s.position}',
        mobile: '${s.mobile || ''}',
        email: '${s.email || ''}',
        photo_url: '${s.photo_url || ''}'
      }
      const org = '${org?.name || 'REDtone IoT'}'
      const vcf = [
        'BEGIN:VCARD', 'VERSION:3.0',
        'FN:' + d.full_name,
        'ORG:' + org,
        'TITLE:' + d.position,
        d.mobile ? 'TEL;TYPE=CELL:' + d.mobile : '',
        d.email ? 'EMAIL:' + d.email : '',
        d.photo_url ? 'PHOTO;VALUE=URL:' + d.photo_url : '',
        'END:VCARD'
      ].filter(Boolean).join('\\n')
      const blob = new Blob([vcf], { type: 'text/vcard' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = d.full_name.replace(/\\s+/g, '_') + '.vcf'
      a.click()
    }

    // Fetch live data on page load
    refreshCard()
  </script>
</body>
</html>`
}

// ── Generate landing page ────────────────────────────────────────────────────
function generateLandingHTML(staff, orgs) {
  const org = orgs?.[0]
  const logoUrl = org?.card_templates?.[0]?.logo_url

  const cards = staff.map(s => `
    <a class="staff-card" href="/${s.card_slug}/">
      <div class="avatar">
        ${s.photo_url
          ? `<img src="${s.photo_url}" alt="${s.full_name}"/>`
          : `<span>${s.full_name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</span>`
        }
      </div>
      <div class="info">
        <div class="name">${s.full_name}</div>
        <div class="pos">${s.position}</div>
        ${s.departments?.name ? `<div class="dept">${s.departments.name}</div>` : ''}
      </div>
      <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </a>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${org?.name || 'REDtone IoT'} — Digital Cards</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
    body {
      min-height: 100vh;
      background: #060b16;
      font-family: 'Outfit', -apple-system, sans-serif;
      color: #f0f2f7;
      background-image: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,0,29,0.1) 0%, transparent 60%);
    }
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
    .header {
      text-align: center;
      padding: 48px 24px 32px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .header img { height: 40px; margin-bottom: 16px; }
    .header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; color: #f0f2f7; }
    .header p { font-size: 13px; color: #8892a4; margin-top: 4px; letter-spacing: 1px; }
    .list { max-width: 480px; margin: 32px auto; padding: 0 20px 48px; }
    .staff-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #0f1824;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 12px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
      animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;
    }
    .staff-card:hover { border-color: rgba(232,0,29,0.4); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .avatar {
      width: 52px; height: 52px;
      border-radius: 50%;
      border: 2px solid #E8001D;
      overflow: hidden;
      flex-shrink: 0;
      background: linear-gradient(135deg, #1e2e50, #0d1a2e);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px; color: #E8001D;
    }
    .avatar img { width:100%; height:100%; object-fit:cover; object-position:center top; }
    .info { flex: 1; min-width: 0; }
    .name { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pos { font-size: 12px; color: #8892a4; margin-top: 2px; }
    .dept { font-size: 11px; color: #C9973A; margin-top: 2px; }
    .arrow { width: 18px; height: 18px; color: #8892a4; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="${org?.name}"/>` : `<h1><span style="color:#E8001D">RED</span>tone IoT</h1>`}
    <h1>Digital Cards</h1>
    <p>${staff.length} Team Member${staff.length !== 1 ? 's' : ''}</p>
  </div>
  <div class="list">${cards}</div>
</body>
</html>`
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { orgs, staff } = await fetchData()
  const org = orgs?.[0]

  fs.mkdirSync('./dist', { recursive: true })

  let totalSize = 0
  for (const s of staff) {
    const html = await generateCardHTML(s, org)
    const dir = `./dist/${s.card_slug}`
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(`${dir}/index.html`, html)
    totalSize += html.length
    console.log(`  ✅  /${s.card_slug}/  (${(html.length/1024).toFixed(1)} KB)`)
  }

  // Landing page
  const landing = generateLandingHTML(staff, orgs)
  fs.writeFileSync('./dist/index.html', landing)
  console.log(`  ✅  / (landing)  (${(landing.length/1024).toFixed(1)} KB)`)

  console.log(`\n🎉 Done! ${staff.length} cards + landing page. Total: ${(totalSize/1024).toFixed(1)} KB`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
