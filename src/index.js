const SUPABASE_URL = 'https://omuopaupndqxwsuyvtoy.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdW9wYXVwbmRxeHdzdXl2dG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTA3OTgsImV4cCI6MjA5MDI4Njc5OH0.b2IjAivQbCMtamvkHEZ_RYo1g0t9HILiRHW_PfM_23o'

async function sbFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`
    },
    cache: 'no-store'
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error(`[sbFetch] ${res.status} — ${errText}`)
    return null
  }
  const data = await res.json()
  return data
}

async function fetchOrg(slug) {
  const data = await sbFetch(
    `organizations?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug,logo_url,primary_color,secondary_color&limit=1`
  )
  return data?.[0] || null
}

async function fetchStaff(cardSlug, orgId) {
  const filter = orgId
    ? `card_slug=eq.${cardSlug}&org_id=eq.${orgId}`
    : `card_slug=eq.${cardSlug}`
  const data = await sbFetch(
    `staff?${filter}&select=*,departments(name)&limit=1`
  )
  return data?.[0] || null
}

function buildHTML(s, org, cardURL) {
  const orgName = org?.name || 'Company'
  const primary = org?.primary_color || '#E8001D'
  const secondary = org?.secondary_color || '#C9973A'
  const initData = JSON.stringify(s)
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${s.full_name}</title>
<style>
:root{
  --red:${primary};
  --gold:${secondary};
}
body{
  font-family:sans-serif;
  background:#060b16;
  color:white;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
}
.card{
  background:#0d1520;
  padding:20px;
  border-radius:12px;
  width:320px;
}
</style>
</head>
<body>
<div class="card">
  <h2 id="name">${s.full_name}</h2>
  <p id="pos">${s.position}</p>
  <p id="mobile">${s.mobile || ''}</p>
  <p id="email">${s.email || ''}</p>
</div>
<script>
const SUPABASE_URL='${SUPABASE_URL}'
const KEY='${SUPABASE_ANON}'
const SLUG='${s.card_slug}'
const ORG_ID='${s.org_id}'
const H={
  apikey:KEY,
  Authorization:'Bearer '+KEY
}
function $(id){return document.getElementById(id)}
async function refresh(){
  try{
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/staff?card_slug=eq.'+SLUG+'&org_id=eq.'+ORG_ID+'&select=*',
      {
        headers:H,
        cache:'no-store'
      }
    )
    const data = await res.json()
    if(!Array.isArray(data) || data.length === 0) return
    const d = data[0]
    $('name').textContent = d.full_name
    $('pos').textContent = d.position
    $('mobile').textContent = d.mobile || ''
    $('email').textContent = d.email || ''
  }catch(e){
    console.error('refresh error', e)
  }
}
refresh()
setInterval(refresh, 5000)
</script>
</body>
</html>`
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/|\/$/g, '')
    const parts = path.split('/')
    if (parts.length === 2) {
      const [orgSlug, cardSlug] = parts
      const org = await fetchOrg(orgSlug)
      if (!org) return new Response('Org not found')
      const staff = await fetchStaff(cardSlug, org.id)
      if (!staff) return new Response('Staff not found')
      const html = buildHTML(
        staff,
        org,
        `${url.origin}/${orgSlug}/${cardSlug}`
      )
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      })
    }
    return env.ASSETS.fetch(request)
  }
}
