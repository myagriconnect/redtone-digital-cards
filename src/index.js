// Cloudflare Worker — serves static card pages OR generates them dynamically
// from Supabase for new staff added via the admin portal (no rebuild needed)

const SUPABASE_URL     = 'https://omuopaupndqxwsuyvtoy.supabase.co'
const SUPABASE_ANON    = 'sb_publishable_BLHChJRx8gdjb9-jaI2WBA_zClJtSqy'
const ORG_NAME         = 'REDtone IoT'
const LOGO_URL         = 'https://omuopaupndqxwsuyvtoy.supabase.co/storage/v1/object/public/staff-photos/redtone-logo.png'

// ── Fetch staff by card_slug from Supabase ───────────────────────────────────
async function fetchStaff(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/staff?card_slug=eq.${slug}&select=*,departments(name)&is_active=eq.true`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
  )
  const data = await res.json()
  return data?.[0] || null
}

// ── Fetch org + logo from Supabase ───────────────────────────────────────────
async function fetchOrgLogo() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/card_templates?select=logo_url&limit=1`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    )
    const [row] = await res.json()
    return row?.logo_url || LOGO_URL
  } catch { return LOGO_URL }
}

// ── Generate QR code SVG (no external lib needed in Workers) ─────────────────
// We embed a lightweight QR via a Google Charts fallback URL in the img src
function qrImgTag(url) {
  const encoded = encodeURIComponent(url)
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encoded}" width="160" height="160" alt="QR Code" style="display:block"/>`
}

// ── Generate card HTML dynamically ───────────────────────────────────────────
function buildCardHTML(s, logoUrl, siteUrl) {
  const orgName  = ORG_NAME
  const deptName = s.departments?.name || ''
  const initials = s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const cardURL  = `${siteUrl}/${s.card_slug}/`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${s.full_name} — ${orgName}</title>
  <meta property="og:title" content="${s.full_name}"/>
  <meta property="og:description" content="${s.position}${deptName ? ' · ' + deptName : ''}"/>
  ${s.photo_url ? `<meta property="og:image" content="${s.photo_url}"/>` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--red:#E8001D;--gold:#C9973A;--dark:#060b16;--card-bg:#0d1520;--text:#f0f2f7;--muted:#8892a4}
    html,body{min-height:100vh;background:var(--dark);font-family:'Outfit',-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(232,0,29,.12) 0%,transparent 60%)}
    .card{background:var(--card-bg);border-radius:24px;border:1px solid rgba(255,255,255,.07);width:100%;max-width:400px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04);animation:fadeUp .6s cubic-bezier(.22,1,.36,1) both}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .logo-bar{background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);padding:18px 24px 14px;border-bottom:1px solid rgba(232,0,29,.12)}
    .logo-bar img{height:28px;width:auto;display:block}
    .logo-text{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--text)}
    .logo-text span{color:var(--red)}
    .identity{background:linear-gradient(160deg,#0d1a2e 0%,#060b16 100%);padding:20px 24px 24px;display:flex;align-items:center;gap:18px;border-bottom:1px solid rgba(232,0,29,.15);position:relative}
    .identity::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:60px;height:2px;background:linear-gradient(90deg,transparent,var(--red),transparent)}
    .photo-ring{width:80px;height:80px;border-radius:50%;padding:3px;background:linear-gradient(135deg,var(--red),var(--gold));box-shadow:0 0 20px rgba(232,0,29,.35);flex-shrink:0}
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
    .contact-icon{width:36px;height:36px;border-radius:10px;background:rgba(232,0,29,.1);border:1px solid rgba(232,0,29,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .contact-icon svg{width:16px;height:16px;color:var(--red)}
    .contact-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
    .contact-value{font-size:13px;font-weight:500}
    .card-footer{padding:16px 24px 28px;border-top:1px solid rgba(255,255,255,.04);text-align:center}
    .qr-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
    .qr-wrap{display:inline-block;background:white;border-radius:12px;padding:10px;margin-bottom:16px;box-shadow:0 4px 20px rgba(0,0,0,.3)}
    .save-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:linear-gradient(135deg,var(--red),#c0001a);border:none;border-radius:12px;padding:14px;color:white;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(232,0,29,.3);transition:all .2s}
    .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(232,0,29,.4)}
    .save-btn svg{width:16px;height:16px}
    .wa-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#25D366;border:none;border-radius:12px;padding:14px;color:white;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(37,211,102,.3);transition:all .2s;margin-top:10px}
    .wa-btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(37,211,102,.4)}
    .wa-btn svg{width:16px;height:16px}
  </style>
</head>
<body>
<div class="card">
  <div class="logo-bar">
    ${logoUrl
      ? `<img src="${logoUrl}" alt="${orgName}"/>`
      : `<div class="logo-text"><span>RED</span>tone</div>`
    }
  </div>
  <div class="identity">
    <div class="photo-ring">
      ${s.photo_url
        ? `<img src="${s.photo_url}" alt="${s.full_name}" id="staffPhoto"/>`
        : `<div class="photo-initials">${initials}</div>`
      }
    </div>
    <div class="info">
      <div class="staff-name"     id="staffName">${s.full_name}</div>
      <div class="staff-pos"      id="staffPos">${s.position}</div>
      <div class="staff-meta">
        ${orgName}${deptName ? ` · <span class="dept" id="staffDept">${deptName}</span>` : ''}
      </div>
    </div>
  </div>
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
  <div class="card-footer">
    <div class="qr-label">Scan to view digital card</div>
    <div class="qr-wrap">${qrImgTag(cardURL)}</div>
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
  const SUPABASE_URL = '${SUPABASE_URL}'
  const ANON_KEY     = '${SUPABASE_ANON}'
  const SLUG         = '${s.card_slug}'
  const CARD_URL     = '${cardURL}'
  window._d = ${JSON.stringify({ full_name: s.full_name, position: s.position, mobile: s.mobile || '', email: s.email || '', photo_url: s.photo_url || '' })}

  async function refresh() {
    try {
      const [d] = await fetch(SUPABASE_URL+'/rest/v1/staff?card_slug=eq.'+SLUG+'&select=*,departments(name)',
        {headers:{apikey:ANON_KEY,Authorization:'Bearer '+ANON_KEY}}).then(r=>r.json())
      if (!d) return
      window._d = d
      const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v}
      s('staffName',d.full_name); s('staffPos',d.position)
      s('staffMobile',d.mobile||''); s('staffEmail',d.email||'')
      const ml=document.getElementById('mobileLink'); if(ml&&d.mobile) ml.href='tel:'+d.mobile
      const el=document.getElementById('emailLink');  if(el&&d.email)  el.href='mailto:'+d.email
      if(d.photo_url){const r=document.querySelector('.photo-ring');if(r)r.innerHTML='<img src="'+d.photo_url+'" alt="'+d.full_name+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--card-bg);display:block"/>'}
    } catch(_){}
  }

  function saveContact() {
    const d = window._d
    const vcf = [
      'BEGIN:VCARD', 'VERSION:3.0',
      'FN:' + d.full_name,
      'ORG:${ORG_NAME}',
      'TITLE:' + d.position,
      d.mobile    ? 'TEL;TYPE=CELL:' + d.mobile    : '',
      d.email     ? 'EMAIL:' + d.email              : '',
      d.photo_url ? 'PHOTO;VALUE=URL:' + d.photo_url : '',
      'END:VCARD'
    ].filter(Boolean).join('\\r\\n')

    if (navigator.share && navigator.canShare) {
      const file = new File([vcf], d.full_name.replace(/\\s+/g, '_') + '.vcf', { type: 'text/vcard' })
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).catch(() => fallbackDownload(vcf, d.full_name))
        return
      }
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
    const mobile = (window._d.mobile || '').replace(/[^0-9]/g, '')
    const msg = encodeURIComponent('Hi! Here is my digital card: ' + CARD_URL)
    window.open('https://wa.me/' + mobile + '?text=' + msg, '_blank')
  }

  refresh()
</script>
</body>
</html>`
}

// ── Worker entry point ───────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url  = new URL(request.url)
    const path = url.pathname

    // Always serve /admin/* and static assets directly
    const staticPrefixes = ['/admin', '/assets', '/favicon']
    if (path === '/' || staticPrefixes.some(p => path.startsWith(p))) {
      return env.ASSETS.fetch(request)
    }

    // Try static asset first (existing staff cards baked at build time)
    const staticResponse = await env.ASSETS.fetch(request)
    if (staticResponse.status !== 404) return staticResponse

    // Static file not found — check if it's a staff card slug
    const slug = path.replace(/^\/|\/$/g, '') // strip leading/trailing slashes
    if (!slug || slug.includes('/') || slug.includes('.')) {
      return staticResponse // not a slug pattern
    }

    // Fetch staff from Supabase
    const staff = await fetchStaff(slug)
    if (!staff) return staticResponse // still 404

    // Dynamically generate and return the card
    const logoUrl = await fetchOrgLogo()
    const siteUrl = `${url.protocol}//${url.host}`
    const html    = buildCardHTML(staff, logoUrl, siteUrl)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60', // cache for 60s, then revalidate
      }
    })
  }
}
