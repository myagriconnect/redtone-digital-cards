import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL  = 'https://omuopaupndqxwsuyvtoy.supabase.co'
const SUPABASE_ANON = 'sb_publishable_BLHChJRx8gdjb9-jaI2WBA_zClJtSqy'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// IMPORTANT: Keep this file in sync with src/index.js.
// With run_worker_first:true in wrangler.jsonc, the Worker always runs for card
// paths and these static files are only used as a fallback. Still keep them in
// sync so the fallback also reflects the latest design.

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

  const initData = JSON.stringify({
    full_name: s.full_name, position: s.position,
    mobile: s.mobile || '', email: s.email || '',
    photo_url: s.photo_url || '', social_links: s.social_links || null
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${s.full_name} - ${orgName}</title>
  <meta property="og:title" content="${s.full_name}"/>
  <meta property="og:description" content="${s.position}${deptName ? ' - ' + deptName : ''}"/>
  ${s.photo_url ? `<meta property="og:image" content="${s.photo_url}"/>` : ''}
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
      /* Alpha variants of primary color — all updated together by refresh() */
      --p10:${primary}1a;
      --p12:${primary}1f;
      --p15:${primary}26;
      --p20:${primary}33;
      --p27:${primary}44;
      --p33:${primary}55;
      --p80:${primary}cc;
    }
    html,body{min-height:100vh;background:var(--dark);font-family:'Outfit',-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;background-image:radial-gradient(ellipse 80% 50% at 50% -10%,var(--p10) 0%,transparent 60%)}
    .card{background:var(--card-bg);border-radius:24px;border:1px solid rgba(255,255,255,.07);width:100%;max-width:400px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:fadeUp .6s cubic-bezier(.22,1,.36,1) both}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .logo-bar{background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);padding:18px 24px 14px;border-bottom:1px solid var(--p12)}
    .logo-bar img{height:28px;width:auto;display:block}
    .logo-text{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--text)}
    .logo-text span{color:var(--red)}
    .identity{background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);padding:20px 24px 24px;display:flex;align-items:center;gap:18px;border-bottom:1px solid var(--p15);position:relative}
    .identity::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:60px;height:2px;background:linear-gradient(90deg,transparent,var(--red),transparent)}
    .photo-ring{width:80px;height:80px;border-radius:50%;padding:3px;background:linear-gradient(135deg,var(--red),var(--gold));box-shadow:0 0 20px var(--p33);flex-shrink:0}
    .photo-ring img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg);display:block}
    .photo-initials{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#1e2e50,#0d1a2e);border:3px solid var(--card-bg);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--red)}
    .info{flex:1;min-width:0}
    .staff-name{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1.5px;color:var(--text);line-height:1.15;margin-bottom:5px;word-break:break-word}
    .staff-pos{font-size:11px;font-weight:600;color:var(--red);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px}
    .staff-meta{font-size:11px;color:var(--muted)}
    .staff-meta .dept{color:var(--gold)}
    .card-body{padding:20px 24px}
    .contact-item{display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.04);text-decoration:none;color:var(--text);transition:color .15s}
    .contact-item:last-child{border-bottom:none}
    .contact-item:hover{color:var(--red)}
    .contact-icon{width:36px;height:36px;border-radius:10px;background:var(--p10);border:1px solid var(--p20);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .contact-icon svg{width:16px;height:16px;color:var(--red)}
    .contact-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
    .contact-value{font-size:13px;font-weight:500}
    .card-footer{padding:16px 24px 28px;border-top:1px solid rgba(255,255,255,.04);text-align:center}
    .qr-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
    .qr-wrap{display:inline-block;background:white;border-radius:12px;padding:10px;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.3)}
    .save-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:linear-gradient(135deg,var(--red),var(--p80));border:none;border-radius:12px;padding:14px;color:white;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px var(--p27);transition:all .2s}
    .save-btn:hover{transform:translateY(-1px)}
    .save-btn svg{width:16px;height:16px}
    .wa-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#25D366;border:none;border-radius:12px;padding:14px;color:white;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(37,211,102,.3);transition:all .2s;margin-top:10px}
    .wa-btn:hover{transform:translateY(-1px)}
    .wa-btn svg{width:16px;height:16px}
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
  <div class="card-footer">
    <div class="qr-label">Scan to view digital card</div>
    <div class="qr-wrap">${qrImgTag(cardURL)}</div>
    <button class="save-btn" onclick="saveContact()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      Save Contact
    </button>
    <button class="wa-btn" onclick="openWhatsApp()">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      WhatsApp
    </button>
  </div>
</div>
<script>
  const SUPABASE_URL='${SUPABASE_URL}'
  const ANON_KEY='${SUPABASE_ANON}'
  const SLUG='${s.card_slug}'
  const CARD_URL='${cardURL}'
  const ORG_ID='${s.org_id}'
  window._d=${initData}

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
      if(d.photo_url){
        const r=document.querySelector('.photo-ring')
        if(r)r.innerHTML='<img src="'+d.photo_url+'" alt="'+d.full_name+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg);display:block"/>'
      }
      if(d.departments?.name){const dept=$('staffDept');if(dept)dept.textContent=d.departments.name}
    }catch(_){}
  }

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
      if(lb){
        if(o.logo_url)lb.innerHTML='<img src="'+o.logo_url+'" alt="'+o.name+'" id="orgLogo" style="height:28px;width:auto;display:block"/>'
        else if(o.name)lb.innerHTML='<div class="logo-text" id="orgLogoText"><span>'+o.name.slice(0,3).toUpperCase()+'</span>'+o.name.slice(3)+'</div>'
      }
      const sm=$('staffMeta')
      if(sm&&o.name){
        const dept=sm.querySelector('.dept')
        sm.innerHTML=o.name+(dept?' &middot; <span class="dept" id="staffDept">'+dept.textContent+'</span>':'')
      }
    }catch(_){}
  }

  function saveContact(){
    const d=window._d
    const vcf=[
      'BEGIN:VCARD','VERSION:3.0',
      'FN:'+d.full_name,
      'ORG:${orgName}',
      'TITLE:'+d.position,
      d.mobile?'TEL;TYPE=CELL:'+d.mobile:'',
      d.email?'EMAIL:'+d.email:'',
      d.photo_url?'PHOTO;VALUE=URL:'+d.photo_url:'',
      'END:VCARD'
    ].filter(Boolean).join('\r\n')
    if(navigator.share){
      const file=new File([vcf],d.full_name.replace(/\s+/g,'_')+'.vcf',{type:'text/vcard'})
      navigator.share({files:[file]}).catch(()=>dl(vcf,d.full_name))
      return
    }
    dl(vcf,d.full_name)
  }
  function dl(vcf,name){
    const b=new Blob([vcf],{type:'text/vcard'})
    const u=URL.createObjectURL(b)
    const a=document.createElement('a')
    a.href=u;a.download=name.replace(/\s+/g,'_')+'.vcf'
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u)
  }
  function openWhatsApp(){
    const d=window._d
    let m=(d.mobile||'').replace(/[\s\-\(\)\.]/g,'')
    if(m.startsWith('+'))m=m.slice(1)
    if(m.startsWith('0'))m='60'+m.slice(1)
    m=m.replace(/[^0-9]/g,'')
    if(!m)return
    window.open('https://wa.me/'+m+'?text='+encodeURIComponent('Hi! Here is my digital card: '+CARD_URL),'_blank')
  }

  refreshStaff()
  refreshOrg()
</script>
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'"/>
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
    btn.disabled = true; btn.textContent = 'Signing in...'; err.textContent = ''
    try {
      const authRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({ email, password })
      })
      const auth = await authRes.json()
      if (!auth.access_token) throw new Error(auth.error_description || 'Invalid credentials')
      const token = auth.access_token
      const H = { apikey: ANON_KEY, Authorization: 'Bearer ' + token }

      // Check Super Admin first
      const sa = await fetch(SUPABASE_URL + '/rest/v1/super_admins?select=id&limit=1', { headers: H }).then(r => r.json())
      if (sa?.length > 0) { window.location.href = '/super/'; return }

      // Check HR Admin / Viewer
      const hr = await fetch(SUPABASE_URL + '/rest/v1/hr_admins?select=role,organizations(slug)&limit=1', { headers: H }).then(r => r.json())
      if (hr?.length > 0) {
        const orgSlug = hr[0]?.organizations?.slug || 'redtone-iot'
        window.location.href = '/' + orgSlug + '/admin/'
        return
      }
      throw new Error('No access found for this account.')
    } catch(e) {
      err.textContent = e.message
      btn.disabled = false; btn.textContent = 'Sign In'
    }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin() })
</script>
</body>
</html>`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const SITE_URL = 'https://redtone-digital-cards.my-agriconnect.workers.dev'

  console.log('🔄 Fetching organizations...')

  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color, secondary_color, tagline')
    .eq('is_active', true)

  if (orgErr) {
    console.error('❌ Failed to fetch orgs:', orgErr.message)
    process.exit(1)
  }

  console.log(`✅ Found ${orgs.length} organization(s)`)

  const distDir = path.join(__dirname, 'dist')
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })

  let totalGenerated = 0

  for (const org of orgs) {
    console.log(`\n📂 Processing org: ${org.name} (${org.slug})`)

    const { data: staffList, error: staffErr } = await supabase
      .from('staff')
      .select('*, departments(name)')
      .eq('org_id', org.id)
      .eq('is_active', true)

    if (staffErr) {
      console.error(`  ❌ Failed to fetch staff for ${org.slug}:`, staffErr.message)
      continue
    }

    console.log(`  👥 ${staffList.length} active staff`)

    const orgDir = path.join(distDir, org.slug)
    if (!fs.existsSync(orgDir)) fs.mkdirSync(orgDir, { recursive: true })

    for (const s of staffList) {
      const cardDir = path.join(orgDir, s.card_slug)
      if (!fs.existsSync(cardDir)) fs.mkdirSync(cardDir, { recursive: true })

      const cardURL = `${SITE_URL}/${org.slug}/${s.card_slug}/`
      const html = buildCardHTML(s, org, cardURL)

      fs.writeFileSync(path.join(cardDir, 'index.html'), html)
      console.log(`  ✅ Generated: /${org.slug}/${s.card_slug}/`)
      totalGenerated++
    }
  }

  console.log(`\n🎉 Done — ${totalGenerated} card(s) generated across ${orgs.length} org(s)`)

  // Generate smart login page at dist/index.html
  const loginHTML = generateLoginHTML()
  fs.writeFileSync(path.join(distDir, 'index.html'), loginHTML)
  console.log('✅  / (login page)')
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
