const SUPABASE_URL = 'https://omuopaupndqxwsuyvtoy.supabase.co'
// Use the legacy JWT anon key — required for server-side PostgREST calls from Workers
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdW9wYXVwbmRxeHdzdXl2dG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTA3OTgsImV4cCI6MjA5MDI4Njc5OH0.b2IjAivQbCMtamvkHEZ_RYo1g0t9HILiRHW_PfM_23o'

async function sbFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache'
    },
    // Tell Cloudflare's edge cache to never cache this subrequest
    cf: { cacheEverything: false, cacheTtl: 0 }
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error(`[sbFetch] HTTP ${res.status} for /${path} — ${errText}`)
    return null
  }
  return res.json()
}

async function isOrgActive(orgId) {
  try {
    const data = await sbFetch(`subscriptions?org_id=eq.${orgId}&select=plan,status,trial_ends_at&limit=1`)
    const sub = data?.[0]
    if (!sub) return true
    if (sub.status === 'suspended') return false
    if (sub.status === 'expired') return false
    if (sub.plan === 'trial' && sub.trial_ends_at) {
      return new Date() <= new Date(sub.trial_ends_at)
    }
    return sub.status === 'active'
  } catch { return true }
}

function buildOpenInSafariHTML(targetUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Open in Safari</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#060b16;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;padding:32px;text-align:center}
    .box{max-width:320px;width:100%}
    .icon{font-size:56px;margin-bottom:20px}
    h1{color:#f0f2f7;font-size:22px;font-weight:700;margin-bottom:10px}
    p{color:#8892a4;font-size:14px;line-height:1.7;margin-bottom:28px}
    .btn{display:block;background:#E8001D;color:white;padding:15px 24px;border-radius:14px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:20px}
    .hint{color:#8892a4;font-size:12px;line-height:1.8}
    .hint strong{color:#f0f2f7}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">🌐</div>
    <h1>Open in Safari</h1>
    <p>This digital card needs to be opened in Safari for the full experience.</p>
    <a class="btn" href="${targetUrl}" target="_blank" rel="noopener">Tap here to Open in Safari</a>
    <p class="hint">Or tap <strong>···</strong> at the top right of WhatsApp<br/>then select <strong>"Open in Safari"</strong></p>
  </div>
</body>
</html>`
}

function buildExpiredHTML(orgName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Card Unavailable</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" media="print" onload="this.media='all'"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#060b16;font-family:'Outfit',sans-serif;display:flex;align-items:center;justify-content:center;padding:24px}
    .box{background:#0d1520;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:48px 40px;max-width:400px;width:100%;text-align:center}
    .icon{font-size:48px;margin-bottom:20px}
    h1{color:#f0f2f7;font-size:20px;font-weight:700;margin-bottom:8px}
    p{color:#8892a4;font-size:14px;line-height:1.6}
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">🔒</div>
    <h1>Card Unavailable</h1>
    <p>This digital card is currently unavailable.<br/>Please contact <strong style="color:#f0f2f7">${orgName}</strong> for more information.</p>
  </div>
</body>
</html>`
}

async function fetchOrg(slug) {
  try {
    const data = await sbFetch(
      `organizations?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug,logo_url,primary_color,secondary_color,tagline&is_active=eq.true&limit=1`
    )
    if (!data) return null
    const org = data?.[0] || null
    if (!org) console.error(`[fetchOrg] no org found for slug="${slug}"`)
    return org
  } catch (e) {
    console.error('[fetchOrg] threw:', e)
    return null
  }
}

async function fetchStaffBySlug(cardSlug, orgId) {
  try {
    const filter = orgId
      ? `card_slug=eq.${cardSlug}&org_id=eq.${orgId}`
      : `card_slug=eq.${cardSlug}`
    const data = await sbFetch(
      `staff?${filter}&select=*,departments(name)&is_active=eq.true&limit=1`
    )
    if (!data) return null
    const staff = data?.[0] || null
    if (!staff) console.error(`[fetchStaffBySlug] no staff found for card_slug="${cardSlug}" org_id="${orgId}"`)
    return staff
  } catch (e) {
    console.error('[fetchStaffBySlug] threw:', e)
    return null
  }
}

// ── Social link icon SVGs ─────────────────────────────────────────────────────
const SOCIAL_ICONS = {
  linkedin:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  twitter:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  website:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  youtube:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  tiktok:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z"/></svg>`,
  github:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
}

// Social link labels for screen readers / tooltips
const SOCIAL_LABELS = {
  linkedin:'LinkedIn', instagram:'Instagram', twitter:'X (Twitter)',
  facebook:'Facebook', website:'Website', youtube:'YouTube',
  tiktok:'TikTok', github:'GitHub'
}

function buildSocialLinksHtml(socialLinks) {
  if (!socialLinks || typeof socialLinks !== 'object') return ''
  const entries = Object.entries(socialLinks).filter(([k, v]) => v && SOCIAL_ICONS[k])
  if (!entries.length) return ''
  const buttons = entries.map(([key, url]) => {
    const icon  = SOCIAL_ICONS[key]
    const label = SOCIAL_LABELS[key] || key
    return `<a class="social-btn" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon}</a>`
  }).join('')
  return `<div class="social-row" id="socialRow">${buttons}</div>`
}

function qrImgTag(url) {
  const encoded = encodeURIComponent(url)
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=ffffff&color=000000&data=${encoded}" width="180" height="180" alt="QR Code" style="display:block"/>`
}

function buildCardHTML(s, org, cardURL) {
  const orgName   = org?.name || 'REDtone'
  const logoUrl   = org?.logo_url || ''
  const primary   = org?.primary_color || '#E8001D'
  const secondary = org?.secondary_color || '#C9973A'
  const deptName  = s.departments?.name || ''
  const initials  = s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const logoBar = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" id="orgLogo"/>`
    : `<div class="logo-text" id="orgLogoText"><span>${orgName.slice(0,3).toUpperCase()}</span>${orgName.slice(3)}</div>`

  const photoHtml = s.photo_url
    ? `<img src="${s.photo_url}" alt="${s.full_name}" id="staffPhoto"/>`
    : `<div class="photo-initials">${initials}</div>`

  const mobileHtml = s.mobile ? `
    <a class="contact-item" href="tel:${s.mobile}" id="mobileLink">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
      <div><div class="contact-label">Mobile</div><div class="contact-value" id="staffMobile">${s.mobile}</div></div>
    </a>` : ''

  const emailHtml = s.email ? `
    <a class="contact-item" href="mailto:${s.email}" id="emailLink">
      <div class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
      <div><div class="contact-label">Email</div><div class="contact-value" id="staffEmail">${s.email}</div></div>
    </a>` : ''

  const deptMeta = deptName
    ? ` &middot; <span class="dept" id="staffDept">${deptName}</span>`
    : ''

  const socialHtml = buildSocialLinksHtml(s.social_links)

  // Pre-compute WhatsApp URL server-side so the button works as a plain <a> link
  // (avoids window.open popup blocking on iOS/Android Cloudflare deployments)
  let waPhone = (s.mobile || '').replace(/[\s\-\(\)\.]/g, '')
  if (waPhone.startsWith('+')) waPhone = waPhone.slice(1)
  if (waPhone.startsWith('0')) waPhone = '60' + waPhone.slice(1)
  waPhone = waPhone.replace(/[^0-9]/g, '')
  const waUrl  = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent('Hi! Here is my digital card: ' + cardURL)}` : ''
  const vcardUrl = `${cardURL}vcard`

  const initData = JSON.stringify({
    full_name: s.full_name, position: s.position,
    mobile: s.mobile || '', email: s.email || '',
    photo_url: s.photo_url || '', social_links: s.social_links || null
  })

  // NOTE: All primary-color alpha variants are defined as CSS custom properties
  // so the client-side refreshOrg() can apply any live changes during the session.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>${s.full_name} - ${orgName}</title>
  <meta name="description" content="${s.position}${deptName ? ' · ' + deptName : ''} at ${orgName}"/>
  <meta property="og:title" content="${s.full_name}"/>
  <meta property="og:description" content="${s.position}${deptName ? ' - ' + deptName : ''}"/>
  ${s.photo_url ? `<meta property="og:image" content="${s.photo_url}"/>` : ''}
  <meta name="theme-color" content="#060b16"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --red:${primary};
      --gold:${secondary};
      --dark:#060b16;
      --card-bg:#0d1520;
      --text:#f0f2f7;
      --muted:#8892a4;
      --p10:${primary}1a;
      --p12:${primary}1f;
      --p15:${primary}26;
      --p20:${primary}33;
      --p27:${primary}44;
      --p33:${primary}55;
      --p80:${primary}cc;
    }

    /* ── Base layout ───────────────────────────────────────────────────────── */
    html{
      min-height:100%;
      min-height:-webkit-fill-available;
    }
    body{
      min-height:100vh;
      background:var(--dark);
      font-family:'Outfit',-apple-system,sans-serif;
      color:var(--text);
      display:flex;
      align-items:flex-start;
      justify-content:center;
      background-image:radial-gradient(ellipse 100% 40% at 50% 0%,var(--p10) 0%,transparent 60%);
      padding:0;
    }
    @media(min-width:480px){
      body{align-items:center;padding:24px}
    }

    /* ── Card shell ─────────────────────────────────────────────────────────── */
    .card{
      background:var(--card-bg);
      border:1px solid rgba(255,255,255,.07);
      width:100%;
      max-width:430px;
      border-radius:0;
      overflow:hidden;
      box-shadow:0 32px 80px rgba(0,0,0,.7);
      animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
    }
    @media(min-width:480px){
      .card{border-radius:24px}
    }
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

    /* ── Logo bar ───────────────────────────────────────────────────────────── */
    .logo-bar{
      background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);
      padding:clamp(14px,3.5vw,20px) clamp(18px,5vw,28px) clamp(12px,3vw,16px);
      border-bottom:1px solid var(--p12);
      flex-shrink:0;
    }
    .logo-bar img{height:clamp(24px,5vw,32px);width:auto;display:block}
    .logo-text{font-family:'Bebas Neue',sans-serif;font-size:clamp(20px,5vw,26px);letter-spacing:2px;color:var(--text)}
    .logo-text span{color:var(--red)}

    /* ── Identity hero ──────────────────────────────────────────────────────── */
    .identity{
      background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);
      padding:clamp(18px,5vw,28px) clamp(18px,5vw,28px) clamp(22px,5.5vw,32px);
      display:flex;
      align-items:center;
      gap:clamp(14px,4vw,22px);
      border-bottom:1px solid var(--p15);
      position:relative;
      flex-shrink:0;
    }
    .identity::after{
      content:'';
      position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:60px;height:2px;
      background:linear-gradient(90deg,transparent,var(--red),transparent);
    }
    .photo-ring{
      width:clamp(72px,18vw,96px);
      height:clamp(72px,18vw,96px);
      border-radius:50%;
      padding:3px;
      background:linear-gradient(135deg,var(--red),var(--gold));
      box-shadow:0 0 24px var(--p33);
      flex-shrink:0;
    }
    .photo-ring img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg);display:block}
    .photo-initials{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#1e2e50,#0d1a2e);border:3px solid var(--card-bg);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:clamp(22px,5vw,32px);color:var(--red)}
    .info{flex:1;min-width:0}
    .staff-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(20px,5.5vw,28px);letter-spacing:1.5px;color:var(--text);line-height:1.1;margin-bottom:6px;word-break:break-word}
    .staff-pos{font-size:clamp(9px,2.5vw,11px);font-weight:600;color:var(--red);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;line-height:1.3}
    .staff-meta{font-size:clamp(10px,2.5vw,12px);color:var(--muted);line-height:1.4}
    .staff-meta .dept{color:var(--gold)}

    /* ── Contact list ───────────────────────────────────────────────────────── */
    .card-body{
      padding:clamp(14px,4vw,22px) clamp(18px,5vw,28px);
    }
    .contact-item{
      display:flex;align-items:center;gap:14px;
      padding:clamp(10px,2.5vw,14px) 0;
      border-bottom:1px solid rgba(255,255,255,.05);
      text-decoration:none;color:var(--text);
      transition:color .15s;
    }
    .contact-item:last-child{border-bottom:none}
    .contact-item:active,.contact-item:hover{color:var(--red)}
    .contact-icon{
      width:clamp(34px,8.5vw,42px);height:clamp(34px,8.5vw,42px);
      border-radius:10px;
      background:var(--p10);border:1px solid var(--p20);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .contact-icon svg{width:clamp(14px,3.5vw,18px);height:clamp(14px,3.5vw,18px);color:var(--red)}
    .contact-label{font-size:clamp(9px,2.2vw,10px);color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
    .contact-value{font-size:clamp(12px,3.2vw,14px);font-weight:500}

    /* ── Social links ───────────────────────────────────────────────────────── */
    .social-row{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      padding:clamp(14px,4vw,20px) clamp(18px,5vw,28px);
      border-top:1px solid rgba(255,255,255,.05);
      justify-content:center;
    }
    .social-btn{
      width:clamp(38px,9vw,46px);height:clamp(38px,9vw,46px);
      border-radius:12px;
      background:var(--p10);
      border:1px solid var(--p20);
      display:flex;align-items:center;justify-content:center;
      color:var(--muted);
      text-decoration:none;
      transition:background .15s,color .15s,border-color .15s,transform .15s;
    }
    .social-btn:hover,.social-btn:active{
      background:var(--p20);
      border-color:var(--p33);
      color:var(--red);
      transform:translateY(-2px);
    }
    .social-btn svg{width:clamp(15px,3.8vw,19px);height:clamp(15px,3.8vw,19px)}

    /* ── QR + footer ────────────────────────────────────────────────────────── */
    .card-footer{
      padding:clamp(16px,4vw,24px) clamp(18px,5vw,28px) clamp(20px,5vw,32px);
      border-top:1px solid rgba(255,255,255,.05);
      text-align:center;
      flex-shrink:0;
    }
    .qr-label{font-size:clamp(9px,2.2vw,10px);letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
    .qr-wrap{display:inline-block;background:white;border-radius:14px;padding:10px;margin-bottom:20px;box-shadow:0 6px 24px rgba(0,0,0,.35)}
    .qr-wrap img{display:block;width:clamp(140px,36vw,180px);height:clamp(140px,36vw,180px)}

    /* ── Action buttons ─────────────────────────────────────────────────────── */
    .btn-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .save-btn{
      display:flex;align-items:center;justify-content:center;gap:8px;
      width:100%;
      background:linear-gradient(135deg,var(--red),var(--p80));
      border:none;border-radius:14px;
      padding:clamp(12px,3.5vw,15px) 12px;
      color:white;font-family:'Outfit',sans-serif;
      font-size:clamp(12px,3.2vw,14px);font-weight:600;
      cursor:pointer;text-decoration:none;
      box-shadow:0 4px 20px var(--p27);
      transition:transform .18s,box-shadow .18s;
      -webkit-tap-highlight-color:transparent;
    }
    .save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px var(--p33)}
    .save-btn:active{transform:translateY(0)}
    .save-btn svg{width:15px;height:15px;flex-shrink:0}
    .wa-btn{
      display:flex;align-items:center;justify-content:center;gap:8px;
      width:100%;
      background:#25D366;
      border:none;border-radius:14px;
      padding:clamp(12px,3.5vw,15px) 12px;
      color:white;font-family:'Outfit',sans-serif;
      font-size:clamp(12px,3.2vw,14px);font-weight:600;
      cursor:pointer;text-decoration:none;
      box-shadow:0 4px 20px rgba(37,211,102,.25);
      transition:transform .18s,box-shadow .18s;
      -webkit-tap-highlight-color:transparent;
    }
    .wa-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(37,211,102,.35)}
    .wa-btn:active{transform:translateY(0)}
    .wa-btn svg{width:15px;height:15px;flex-shrink:0}
  </style>
</head>
<body>
<div class="card">
  <div class="logo-bar" id="logoBar">${logoBar}</div>
  <div class="identity">
    <div class="photo-ring">${photoHtml}</div>
    <div class="info">
      <div class="staff-name" id="staffName">${s.full_name}</div>
      <div class="staff-pos"  id="staffPos">${s.position}</div>
      <div class="staff-meta" id="staffMeta">${orgName}${deptMeta}</div>
    </div>
  </div>
  <div class="card-body">${mobileHtml}${emailHtml}</div>
  ${socialHtml}
  <div class="card-footer">
    <div class="qr-label">Scan to view digital card</div>
    <div class="qr-wrap">${qrImgTag(cardURL)}</div>
    <div class="btn-row">
      <a class="save-btn" href="${vcardUrl}" id="vcardLink">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Save Contact
      </a>
      <a class="wa-btn" href="${waUrl || '#'}" id="waLink" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
    </div>
  </div>
</div>
<script>
  const SUPABASE_URL='${SUPABASE_URL}'
  const ANON_KEY='${SUPABASE_ANON}'
  const SLUG='${s.card_slug}'
  const CARD_URL='${cardURL}'
  const ORG_ID='${s.org_id}'
  window._d=${initData}

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const H={apikey:ANON_KEY,Authorization:'Bearer '+ANON_KEY}
  const $=(id)=>document.getElementById(id)
  const upd=(id,v)=>{const e=$(id);if(e&&v!=null)e.textContent=v}
  const root=document.documentElement

  function setPrimary(p){
    root.style.setProperty('--red',p)
    root.style.setProperty('--p10',p+'1a')
    root.style.setProperty('--p12',p+'1f')
    root.style.setProperty('--p15',p+'26')
    root.style.setProperty('--p20',p+'33')
    root.style.setProperty('--p27',p+'44')
    root.style.setProperty('--p33',p+'55')
    root.style.setProperty('--p80',p+'cc')
  }

  // Social icons map (mirrors server-side SOCIAL_ICONS keys)
  const SOCIAL_ICONS_CLIENT={
    linkedin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    twitter:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    facebook:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    website:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    youtube:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z"/></svg>',
    github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
  }

  function rebuildSocialRow(links){
    if(!links||typeof links!=='object')return
    const entries=Object.entries(links).filter(([k,v])=>v&&SOCIAL_ICONS_CLIENT[k])
    let row=$('socialRow')
    if(!entries.length){if(row)row.remove();return}
    const html=entries.map(([k,v])=>'<a class="social-btn" href="'+v+'" target="_blank" rel="noopener noreferrer" aria-label="'+k+'">'+SOCIAL_ICONS_CLIENT[k]+'</a>').join('')
    if(row){row.innerHTML=html}else{
      const footer=document.querySelector('.card-footer')
      if(footer){const d=document.createElement('div');d.className='social-row';d.id='socialRow';d.innerHTML=html;footer.parentNode.insertBefore(d,footer)}
    }
  }

  // ── Refresh staff data ───────────────────────────────────────────────────────
  async function refreshStaff(){
    try{
      const [d]=await fetch(
        SUPABASE_URL+'/rest/v1/staff?card_slug=eq.'+SLUG+'&org_id=eq.'+ORG_ID+'&select=*,departments(name)',
        {headers:H}
      ).then(r=>r.json())
      if(!d)return
      window._d=d
      upd('staffName',d.full_name)
      upd('staffPos',d.position)
      upd('staffMobile',d.mobile||'')
      upd('staffEmail',d.email||'')
      const ml=$('mobileLink');if(ml&&d.mobile)ml.href='tel:'+d.mobile
      const el=$('emailLink');if(el&&d.email)el.href='mailto:'+d.email
      // Keep WhatsApp href in sync with refreshed phone number
      if(d.mobile){
        let m=d.mobile.replace(/[\s\-\(\)\.]/g,'')
        if(m.startsWith('+'))m=m.slice(1)
        if(m.startsWith('0'))m='60'+m.slice(1)
        m=m.replace(/[^0-9]/g,'')
        if(m){const wa=$('waLink');if(wa)wa.href='https://wa.me/'+m+'?text='+encodeURIComponent('Hi! Here is my digital card: '+CARD_URL)}
      }
      if(d.photo_url){
        const r=document.querySelector('.photo-ring')
        if(r)r.innerHTML='<img src="'+d.photo_url+'" alt="'+d.full_name+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg);display:block"/>'
      }
      if(d.departments?.name){const dept=$('staffDept');if(dept)dept.textContent=d.departments.name}
      rebuildSocialRow(d.social_links)
    }catch(_){}
  }

  // ── Refresh org branding ─────────────────────────────────────────────────────
  async function refreshOrg(){
    try{
      const [o]=await fetch(
        SUPABASE_URL+'/rest/v1/organizations?id=eq.'+ORG_ID+'&select=name,logo_url,primary_color,secondary_color',
        {headers:H}
      ).then(r=>r.json())
      if(!o)return
      if(o.primary_color)setPrimary(o.primary_color)
      if(o.secondary_color)root.style.setProperty('--gold',o.secondary_color)
      const lb=$('logoBar')
      if(lb&&o.logo_url){
        lb.innerHTML='<img src="'+o.logo_url+'" alt="'+o.name+'" id="orgLogo" style="height:clamp(24px,5vw,32px);width:auto;display:block"/>'
      }else if(lb&&o.name&&!o.logo_url){
        lb.innerHTML='<div class="logo-text" id="orgLogoText"><span>'+o.name.slice(0,3).toUpperCase()+'</span>'+o.name.slice(3)+'</div>'
      }
      const sm=$('staffMeta')
      if(sm&&o.name){
        const dept=sm.querySelector('.dept')
        sm.innerHTML=o.name+(dept?' &middot; <span class="dept" id="staffDept">'+dept.textContent+'</span>':'')
      }
    }catch(_){}
  }

  refreshStaff()
  refreshOrg()
</script>
</body>
</html>`
}

export default {
  async fetch(request, env, ctx) {
    const url  = new URL(request.url)
    const path = url.pathname
    const ua   = request.headers.get('user-agent') || ''

    // ── WhatsApp iOS in-app browser — redirect to Safari ─────────────────────
    // WhatsApp's built-in browser on iPhone/iPad cannot render Cloudflare Worker
    // pages and shows "Loading Error". Intercept and serve a simple prompt page
    // so the user can open the card in Safari with one tap.
    if (/WhatsApp/.test(ua) && /iPhone|iPad|iPod/.test(ua)) {
      return new Response(buildOpenInSafariHTML(url.href), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
      })
    }

    // ── Static-only routes — always serve from pre-built assets ──────────────
    const staticPrefixes = ['/admin', '/assets', '/favicon']
    if (staticPrefixes.some(p => path.startsWith(p))) {
      return env.ASSETS.fetch(request)
    }

    if (path.startsWith('/signup')) {
      const adminUrl = new URL(request.url)
      adminUrl.pathname = '/admin/'
      return env.ASSETS.fetch(new Request(adminUrl.toString(), request))
    }

    if (path === '/') {
      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request))
    }

    if (path === '/super' || path.startsWith('/super/')) {
      return env.ASSETS.fetch(new Request(`${url.origin}/super/index.html`, request))
    }

    const segments = path.replace(/^\/|\/$/g, '').split('/')

    // ── Card pages: always generate dynamically from Supabase ─────────────────
    // We intentionally skip env.ASSETS for card paths so that logo/color
    // changes made by HR take effect on every new page load — no rebuild needed.
    if (segments.length === 2) {
      const [orgSlug, cardSlug] = segments
      if (!orgSlug || !cardSlug || cardSlug.includes('.')) return env.ASSETS.fetch(request)

      try {
        const org = await fetchOrg(orgSlug)
        if (!org) {
          console.error(`[Worker] falling back to static — org not found for slug="${orgSlug}"`)
          return env.ASSETS.fetch(request)
        }

        const staff = await fetchStaffBySlug(cardSlug, org.id)
        if (!staff) {
          console.error(`[Worker] falling back to static — staff not found for card_slug="${cardSlug}"`)
          return env.ASSETS.fetch(request)
        }

        const active = await isOrgActive(org.id)
        if (!active) {
          return new Response(buildExpiredHTML(org.name), {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
          })
        }

        const cardURL = `${url.protocol}//${url.host}/${orgSlug}/${cardSlug}/`
        console.log(`[Worker] serving dynamic card: ${orgSlug}/${cardSlug} — "${staff.full_name}"`)
        return new Response(buildCardHTML(staff, org, cardURL), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Surrogate-Control': 'no-store',
            'CDN-Cache-Control': 'no-store'
          }
        })
      } catch (e) {
        console.error('[Worker] unhandled error in card generation:', e)
        return env.ASSETS.fetch(request)
      }
    }

    if (segments.length === 1) {
      const cardSlug = segments[0]
      if (!cardSlug || cardSlug.includes('.')) return env.ASSETS.fetch(request)

      const staff = await fetchStaffBySlug(cardSlug, null)
      if (!staff) return env.ASSETS.fetch(request)

      const orgData = await sbFetch(`organizations?id=eq.${staff.org_id}&select=slug&limit=1`)
      const orgSlug = orgData?.[0]?.slug

      if (!orgSlug) {
        const orgFull = { id: staff.org_id, name: 'REDtone', logo_url: '', primary_color: '#E8001D', secondary_color: '#C9973A' }
        return new Response(buildCardHTML(staff, orgFull, `${url.protocol}//${url.host}/${cardSlug}/`), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Surrogate-Control': 'no-store',
            'CDN-Cache-Control': 'no-store'
          }
        })
      }

      return Response.redirect(`${url.origin}/${orgSlug}/${cardSlug}/`, 301)
    }

    // ── vCard download: /:org/:slug/vcard ──────────────────────────────────────
    // Server-side endpoint so mobile browsers (iOS Safari, Android) get a proper
    // Content-Disposition attachment download instead of a blob URL workaround.
    if (segments.length === 3 && segments[2] === 'vcard') {
      const [orgSlug, cardSlug] = segments
      try {
        const org   = await fetchOrg(orgSlug)
        const staff = org ? await fetchStaffBySlug(cardSlug, org.id) : null
        if (!staff) return new Response('Not found', { status: 404 })

        const orgName = org?.name || 'REDtone'
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          'FN:' + (staff.full_name || ''),
          'ORG:' + orgName,
          'TITLE:' + (staff.position || ''),
          staff.mobile    ? 'TEL;TYPE=CELL:' + staff.mobile    : '',
          staff.email     ? 'EMAIL:'         + staff.email     : '',
          staff.photo_url ? 'PHOTO;VALUE=URL:' + staff.photo_url : '',
        ].filter(Boolean).join('\r\n')
        const vcf = lines + '\r\nEND:VCARD\r\n'
        const filename = (staff.full_name || 'contact').replace(/\s+/g, '_') + '.vcf'

        return new Response(vcf, {
          headers: {
            'Content-Type': 'text/vcard; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store'
          }
        })
      } catch (e) {
        console.error('[Worker] vCard error:', e)
        return new Response('Error', { status: 500 })
      }
    }

    // Fallback — serve anything else from static assets
    return env.ASSETS.fetch(request)
  }
}
