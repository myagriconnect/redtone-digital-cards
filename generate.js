const { createClient } = require('@supabase/supabase-js')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://omuopaupndqxwsuyvtoy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_BLHChJRx8gdjb9-jaI2WBA_zClJtSqy'
const SITE_URL = 'https://redtoneconnect.netlify.app'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const OUT = path.join(__dirname, 'dist')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

function cardHTML({ staff, template, qrDataUrl }) {
  const primary   = template?.primary_color   || '#E8001D'
  const secondary = template?.secondary_color || '#0a0f1e'
  const accent    = template?.accent_color    || '#C9973A'
  const cardUrl   = `${SITE_URL}/${staff.card_slug}`
  const orgName   = staff.organizations?.name || ''
  const deptName  = staff.departments?.name   || ''
  const initials  = staff.full_name.split(' ').map(n => n[0]).slice(0,2).join('')

  const photoHtml = staff.photo_url
    ? `<img src="${staff.photo_url}" alt="${staff.full_name}" class="photo-img"/>`
    : `<div class="photo-initials">${initials}</div>`

  const mobileHtml = staff.mobile ? `
    <a class="contact-item" href="tel:${staff.mobile}">
      <div class="icon-box"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
      <div><div class="contact-label">Mobile</div><div class="contact-value">${staff.mobile}</div></div>
    </a>` : ''

  const emailHtml = staff.email ? `
    <a class="contact-item" href="mailto:${staff.email}">
      <div class="icon-box"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
      <div><div class="contact-label">Email</div><div class="contact-value">${staff.email}</div></div>
    </a>` : ''

  const websiteHtml = staff.organizations?.website ? `
    <a class="contact-item" href="${staff.organizations.website}" target="_blank">
      <div class="icon-box"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div>
      <div><div class="contact-label">Website</div><div class="contact-value">${staff.organizations.website.replace(/^https?:\/\//, '')}</div></div>
    </a>` : ''

  const nameParts = staff.full_name.split(' ')
  const nameLine1 = nameParts.slice(0,2).join(' ')
  const nameLine2 = nameParts.slice(2).join(' ')

  const vcard = [
    'BEGIN:VCARD','VERSION:3.0',
    `FN:${staff.full_name}`,`ORG:${orgName}`,`TITLE:${staff.position}`,
    staff.mobile ? `TEL;TYPE=CELL:${staff.mobile}` : '',
    staff.email  ? `EMAIL:${staff.email}` : '',
    'END:VCARD'
  ].filter(Boolean).join('\\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="theme-color" content="${primary}"/>
  <title>${staff.full_name} — ${orgName}</title>
  <meta property="og:title" content="${staff.full_name}"/>
  <meta property="og:description" content="${staff.position} at ${orgName}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    :root{--red:${primary};--dark:${secondary};--gold:${accent};--light:#f0f2f7;--muted:#8892a4;--darker:#060b16}
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:var(--darker);font-family:'Outfit',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
      background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(232,0,29,.12) 0%,transparent 70%)}
    .wrap{display:flex;flex-direction:column;align-items:center}
    .card{width:420px;max-width:100%;background:linear-gradient(160deg,#111827 0%,#0d1520 60%,#0a0f1e 100%);border-radius:24px;overflow:hidden;
      box-shadow:0 0 0 1px rgba(255,255,255,.06),0 32px 80px rgba(0,0,0,.7),0 0 60px rgba(232,0,29,.08);animation:rise .7s cubic-bezier(.22,1,.36,1) both}
    @keyframes rise{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
    .hero{padding:28px 28px 20px;display:flex;align-items:flex-start;gap:20px;border-bottom:1px solid rgba(255,255,255,.06)}
    .photo-ring{flex-shrink:0;width:86px;height:86px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--gold));padding:3px}
    .photo-img,.photo-initials{width:100%;height:100%;border-radius:50%;border:2px solid #0d1520;display:block}
    .photo-img{object-fit:cover;object-position:center top}
    .photo-initials{background:linear-gradient(135deg,#1a2a4a,#0d1a2e);display:flex;align-items:center;justify-content:center;
      font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:var(--red)}
    .hero-text{flex:1;padding-top:4px}
    .name{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1.5px;color:var(--light);line-height:1.1;margin-bottom:6px}
    .title-pos{font-size:11px;font-weight:500;color:var(--red);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
    .dept{font-size:11px;color:var(--muted)}
    .logo-row{padding:14px 28px 0}
    .org-name-text{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;color:var(--light)}
    .contacts{padding:18px 28px 22px;display:flex;flex-direction:column;gap:12px}
    .contact-item{display:flex;align-items:center;gap:14px;text-decoration:none}
    .contact-item:hover .icon-box{background:var(--red)}
    .contact-item:hover .icon-box svg{stroke:white}
    .icon-box{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s}
    .icon-box svg{width:16px;height:16px;stroke:var(--muted);stroke-width:1.8;fill:none;transition:stroke .2s}
    .contact-label{font-size:10px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
    .contact-value{font-size:14px;color:var(--light)}
    .divider{height:1px;margin:0 28px;background:rgba(255,255,255,.06)}
    .qr-section{padding:22px 28px;display:flex;align-items:center;gap:20px}
    .qr-box{background:white;border-radius:14px;padding:10px 10px 6px;flex-shrink:0;box-shadow:0 4px 20px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;gap:4px}
    .qr-box img{border-radius:4px;display:block;width:110px;height:110px}
    .qr-url{font-size:6.5px;color:#555;text-align:center;max-width:110px;word-break:break-all;line-height:1.4}
    .qr-headline{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:var(--light);margin-bottom:6px;line-height:1.2}
    .qr-sub{font-size:11px;color:var(--muted);line-height:1.6}
    .qr-sub strong{color:var(--gold);font-weight:500}
    .save-wrap{padding:0 28px 22px}
    .save-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px 0;
      background:linear-gradient(135deg,var(--red) 0%,#c0001a 100%);border:none;border-radius:14px;cursor:pointer;
      box-shadow:0 4px 20px rgba(232,0,29,.35);transition:all .2s;text-decoration:none}
    .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(232,0,29,.5)}
    .save-btn svg{width:18px;height:18px;stroke:white;stroke-width:2;fill:none}
    .save-btn-text{font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:white;letter-spacing:.8px}
    .bottom-bar{background:rgba(232,0,29,.08);border-top:1px solid rgba(232,0,29,.15);padding:12px 28px;display:flex;align-items:center;justify-content:space-between}
    .bottom-bar span{font-size:10px;color:var(--muted)}
    .dot{color:var(--red);margin:0 6px}
    .back-link{margin-top:20px}
    .back-link a{font-size:12px;color:var(--muted);text-decoration:none;letter-spacing:1px;text-transform:uppercase}
    .back-link a:hover{color:var(--red)}
    @media(max-width:460px){.card{width:100%}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <div class="photo-ring">${photoHtml}</div>
        <div class="hero-text">
          <div class="name">${nameLine1}${nameLine2 ? `<br/>${nameLine2}` : ''}</div>
          <div class="title-pos">${staff.position}</div>
          <div class="dept">${deptName ? `${orgName} · ${deptName}` : orgName}</div>
        </div>
      </div>
      <div class="logo-row">
        ${template?.logo_url ? `<img style="height:22px" src="${template.logo_url}" alt="${orgName}"/>` : `<span class="org-name-text">${orgName}</span>`}
      </div>
      <div class="contacts">${mobileHtml}${emailHtml}${websiteHtml}</div>
      <div class="divider"></div>
      <div class="qr-section">
        <div class="qr-box">
          <img src="${qrDataUrl}" alt="QR"/>
          <div class="qr-url">${cardUrl.replace('https://', '')}</div>
        </div>
        <div>
          <div class="qr-headline">Scan to Open<br/>My Card</div>
          <div class="qr-sub">Point your camera, then tap <strong>Add to Home Screen</strong>.</div>
        </div>
      </div>
      <div class="save-wrap">
        <button class="save-btn" onclick="saveContact()">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          <span class="save-btn-text">Save Contact</span>
        </button>
      </div>
      <div class="bottom-bar">
        <span>${template?.footer_text || orgName}</span>
        ${template?.website_display ? `<span><span class="dot">●</span>${template.website_display}</span>` : ''}
      </div>
    </div>
    <div class="back-link"><a href="/">← Back to Directory</a></div>
  </div>
  <script>
    function saveContact(){
      var v="${vcard}".split('\\n').join('\n');
      var b=new Blob([v],{type:'text/vcard'});
      var u=URL.createObjectURL(b);
      var a=document.createElement('a');
      a.href=u;a.download='${staff.full_name.replace(/\s+/g,'_')}.vcf';
      document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
    }
  </script>
</body>
</html>`
}

function landingHTML({ org, staff, template }) {
  const primary = template?.primary_color || '#E8001D'
  const cards = staff.map(s => {
    const init = s.full_name.split(' ').map(n=>n[0]).slice(0,2).join('')
    const av = s.photo_url
      ? `<img class="avatar" src="${s.photo_url}" alt="${s.full_name}"/>`
      : `<div class="avatar-init">${init}</div>`
    return `<a class="staff-card" href="/${s.card_slug}">${av}<div class="info"><div class="sname">${s.full_name}</div><div class="spos">${s.position}</div></div><div class="arr">›</div></a>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${org.name} — Digital Cards</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#060b16;font-family:'Outfit',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;
      background-image:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(232,0,29,.12) 0%,transparent 70%)}
    .org{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:3px;color:#f0f2f7;margin-bottom:4px}
    .org span{color:${primary}}
    .sub{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#8892a4;margin-bottom:40px}
    .list{display:flex;flex-direction:column;gap:12px;width:100%;max-width:380px}
    .staff-card{display:flex;align-items:center;gap:16px;background:#111827;border:1px solid rgba(255,255,255,.07);
      border-radius:16px;padding:14px 18px;text-decoration:none;transition:all .2s}
    .staff-card:hover{border-color:${primary};transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,0,29,.15)}
    .avatar{width:52px;height:52px;border-radius:50%;border:2px solid ${primary};object-fit:cover;object-position:center top;flex-shrink:0}
    .avatar-init{width:52px;height:52px;border-radius:50%;border:2px solid ${primary};background:linear-gradient(135deg,#1e2e50,#0d1a2e);
      display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:18px;color:${primary};flex-shrink:0}
    .info{flex:1}
    .sname{color:#f0f2f7;font-weight:600;font-size:15px}
    .spos{color:#8892a4;font-size:11px;margin-top:3px}
    .arr{color:${primary};font-size:22px}
    .footer{margin-top:48px;color:#3a4458;font-size:11px;letter-spacing:.5px}
  </style>
</head>
<body>
  <div class="org"><span>${org.name.slice(0,3)}</span>${org.name.slice(3)}</div>
  <div class="sub">Digital Business Cards</div>
  <div class="list">${cards}</div>
  <div class="footer">${org.name} · ${template?.website_display || ''}</div>
</body>
</html>`
}

async function main() {
  let orgs, template, allStaff
  try {
    console.log('🔄 Fetching from Supabase...')
    const r1 = await supabase.from('organizations').select('*').eq('slug','redtone-iot').single()
    if (r1.error) throw r1.error
    orgs = r1.data
    const r2 = await supabase.from('card_templates').select('*').eq('org_id',orgs.id).eq('is_active',true).single()
    template = r2.data
    const r3 = await supabase.from('staff').select('*,organizations(id,name,slug,website),departments(id,name)').eq('org_id',orgs.id).eq('is_active',true).order('full_name')
    allStaff = r3.data
    console.log('✅ Live data from Supabase')
  } catch(e) {
    console.log('⚠️  Using local data.json')
    const local = JSON.parse(fs.readFileSync(path.join(__dirname,'data.json'),'utf8'))
    orgs = local.org; template = local.template; allStaff = local.staff
  }

  if (!allStaff?.length) { console.error('❌ No staff'); process.exit(1) }
  console.log(`📋 Generating ${allStaff.length} cards...`)

  for (const staff of allStaff) {
    const qrDataUrl = await QRCode.toDataURL(`${SITE_URL}/${staff.card_slug}`, {
      width:110, margin:1, color:{dark:'#0a1628',light:'#ffffff'}
    })
    const html = cardHTML({ staff, template, qrDataUrl })
    const dir = path.join(OUT, staff.card_slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html)
    const size = (html.length / 1024).toFixed(1)
    console.log(`  ✅ /${staff.card_slug}/  (${size} KB)`)
  }

  fs.writeFileSync(path.join(OUT,'index.html'), landingHTML({ org:orgs, staff:allStaff, template }))
  console.log(`  ✅ /index.html (landing)`)

  // Netlify _redirects for /card/:slug → /:slug
  const redirects = allStaff.map(s => `/card/${s.card_slug}  /${s.card_slug}/  200`).join('\n') + '\n'
  fs.writeFileSync(path.join(OUT,'_redirects'), redirects)

  // Count total size
  const total = fs.readdirSync(OUT,{recursive:true}).filter(f=>f.endsWith('.html'))
    .reduce((sum,f)=>{ try{return sum+fs.statSync(path.join(OUT,f.toString())).size}catch{return sum} },0)
  console.log(`\n🎉 Done! Total HTML: ${(total/1024).toFixed(1)} KB vs React bundle 400 KB`)
  console.log(`📁 Output: ${OUT}`)
}

main().catch(console.error)
