// Demo dataset — UAE staffing / project-award scouting.
// Figures are illustrative and sized to be plausible for a mid-size manpower supplier.

export const SECTORS = [
  { id: 'construction', name: 'Construction & Engineering' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'hospitality', name: 'Hospitality & F&B' },
  { id: 'facilities', name: 'Facilities Management' },
  { id: 'logistics', name: 'Logistics & Warehousing' },
]

export const WORKFLOWS = {
  scout: {
    name: 'Award Scout — UAE',
    title: 'Project Award Scout',
    nodes: [
      { id: 'n1', type: 'trigger', x: 96, y: 20, label: 'Trigger:\nAward Detected', note: 'Polls MEED, Zawya and tender portals every 15 minutes' },
      { id: 'n2', type: 'action', x: 96, y: 124, label: 'Extract Entities', note: 'LLM pulls company, project, value, timeline, manpower' },
      { id: 'n3', type: 'decision', x: 96, y: 222, label: 'Score ≥ 70?', note: 'Qualifies on contract value, sector fit and start date' },
      { id: 'n4', type: 'yes', x: 330, y: 240, label: 'Yes' },
      { id: 'n5', type: 'no', x: 330, y: 348, label: 'No' },
      { id: 'n6', type: 'action', x: 440, y: 230, label: 'Send CVs + Intro', note: 'Personalised email with a vetted CV shortlist' },
      { id: 'n7', type: 'action', x: 440, y: 338, label: 'Nurture / Watchlist', note: 'Re-checks the account in 30 days' },
      { id: 'n8', type: 'mail', x: 680, y: 280, label: '', note: 'Logged to the CRM for follow-up' },
    ],
    edges: [['n1','n2'],['n2','n3'],['n3','n4'],['n3','n5'],['n4','n6'],['n5','n7'],['n6','n8'],['n7','n8']],
  },
  nurture: {
    name: 'Lead Nurture',
    title: 'Marketing Automation',
    nodes: [
      { id: 'm1', type: 'trigger', x: 100, y: 20, label: 'Trigger:\nLead Sign-up', note: 'Fires on every new inbound lead' },
      { id: 'm2', type: 'action', x: 92, y: 124, label: 'Send Welcome Email', note: 'Template: welcome_v3' },
      { id: 'm3', type: 'decision', x: 110, y: 222, label: 'Engaged?', note: 'Opened or clicked within 72 hours' },
      { id: 'm4', type: 'yes', x: 334, y: 240, label: 'Yes' },
      { id: 'm5', type: 'no', x: 334, y: 348, label: 'No' },
      { id: 'm6', type: 'action', x: 444, y: 230, label: 'Nurture Track', note: 'Six-touch educational sequence' },
      { id: 'm7', type: 'action', x: 444, y: 338, label: 'Re-engage', note: 'Win-back offer after 14 days' },
      { id: 'm8', type: 'mail', x: 684, y: 280, label: '', note: 'Outcome logged to the CRM' },
    ],
    edges: [['m1','m2'],['m2','m3'],['m3','m4'],['m3','m5'],['m4','m6'],['m5','m7'],['m6','m8'],['m7','m8']],
  },
  portal: {
    name: 'Portal Submission',
    title: 'Tender Portal Submission',
    nodes: [
      { id: 'p1', type: 'trigger', x: 96, y: 20, label: 'Trigger:\nTender Published', note: 'ADNOC and Emirates supplier portals' },
      { id: 'p2', type: 'action', x: 94, y: 124, label: 'Match Bench Staff', note: 'Skills, visa status and availability' },
      { id: 'p3', type: 'decision', x: 108, y: 222, label: 'Bench ≥ 5?', note: 'Enough vetted candidates ready to deploy' },
      { id: 'p4', type: 'yes', x: 332, y: 240, label: 'Yes' },
      { id: 'p5', type: 'no', x: 332, y: 348, label: 'No' },
      { id: 'p6', type: 'action', x: 442, y: 230, label: 'Prep Portal Upload', note: 'Bundles CVs with compliance documents' },
      { id: 'p7', type: 'action', x: 442, y: 338, label: 'Flag Recruiter', note: 'Assigns a sourcing task' },
      { id: 'p8', type: 'mail', x: 682, y: 280, label: '', note: 'Submission receipt logged' },
    ],
    edges: [['p1','p2'],['p2','p3'],['p3','p4'],['p3','p5'],['p4','p6'],['p5','p7'],['p6','p8'],['p7','p8']],
  },
}

export const METRICS = [
  { id: 'leads', value: 1248, label: 'Awards Tracked', delta: 12 },
  { id: 'conv', value: 310, label: 'Qualified Leads', delta: 8.4 },
  { id: 'pipe', value: 845000, label: 'Pipeline', delta: 6.1, money: true },
]

export const STAGES = [
  { name: 'New', color: '#4E8EA8', value: 1248, label: 'Awards Seen' },
  { name: 'Qualified', color: '#7C3AED', value: 200, label: 'Scored ≥ 70' },
  { name: 'Proposal', color: '#2563EB', value: 310, label: 'CVs Sent' },
  { name: 'Negotiation', color: '#1D4ED8', value: 84000, label: 'Deal Value', money: true },
  { name: 'Closed Won', color: '#10B981', value: 845000, label: 'Deal Pipeline', money: true },
]

export const SOURCES = [
  { name: 'News Feeds', value: 45, color: '#38BDF8', on: true },
  { name: 'Tender Portals', value: 30, color: '#C084FC', on: true },
  { name: 'Referral', value: 25, color: '#2DD4BF', on: true },
]

export const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const REVENUE = [28, 44, 38, 62, 52, 88]
export const EMAIL_BARS = [[18, 30], [38, 26], [30, 22], [52, 30], [44, 28], [40, 24]]

export const LEADS = [
  { company: 'ADNOC', project: 'Ruwais refinery expansion', sector: 'construction', value: 2100000000, staff: 400, score: 92, start: 'Q4 2026', status: 'CVs sent' },
  { company: 'Clemenceau Medical Center', project: 'New inpatient wing', sector: 'healthcare', value: 96000000, staff: 90, score: 84, start: 'Q1 2027', status: 'CVs sent' },
  { company: 'Emirates Airlines', project: 'Cabin crew intake 2026', sector: 'hospitality', value: 45000000, staff: 320, score: 81, start: 'Q3 2026', status: 'Outreach queued' },
  { company: 'DP World', project: 'Jebel Ali yard expansion', sector: 'logistics', value: 610000000, staff: 260, score: 78, start: 'Q4 2026', status: 'Outreach queued' },
  { company: 'Aldar Properties', project: 'Yas Island resort', sector: 'hospitality', value: 380000000, staff: 180, score: 74, start: 'Q2 2027', status: 'Watchlist' },
  { company: 'Al Naboodah Construction', project: 'Dubai metro blue line civils', sector: 'construction', value: 720000000, staff: 540, score: 71, start: 'Q1 2027', status: 'CVs sent' },
  { company: 'Emaar Facilities', project: 'Downtown FM contract renewal', sector: 'facilities', value: 54000000, staff: 210, score: 63, start: 'Q3 2026', status: 'Watchlist' },
]

export const ACTIVITY = [
  { head: 'ADNOC awards $2.1B Ruwais expansion', sub: 'Est. 400 technicians · Q4 start', time: '2m ago', color: '#FBBF24' },
  { head: 'Clemenceau Medical — 90 nurse roles', sub: 'CV shortlist sent to HR', time: '15m ago', color: '#C084FC' },
  { head: 'Reply received — Al Naboodah Construction', sub: 'Requested 15 more CVs', time: '1h ago', color: '#34D399' },
  { head: 'Workflow "Award Scout" config updated', sub: 'Score threshold raised to 70', time: '3h ago', color: '#38BDF8' },
]

export const NOTIFICATIONS = [
  { id: 1, title: 'ADNOC award matched your filters', body: 'Ruwais expansion · scored 92', time: '2m', unread: true, kind: 'lead' },
  { id: 2, title: 'Al Naboodah replied to your outreach', body: 'Requested 15 more CVs', time: '1h', unread: true, kind: 'reply' },
  { id: 3, title: 'Emirates portal submission accepted', body: 'Cabin crew intake 2026', time: '4h', unread: true, kind: 'portal' },
  { id: 4, title: 'Weekly scout digest ready', body: '38 awards detected across 5 sectors', time: '1d', unread: false, kind: 'digest' },
  { id: 5, title: 'Bench dropped below threshold', body: 'Healthcare · 3 nurses available', time: '2d', unread: false, kind: 'alert' },
]

export const MESSAGES = [
  { id: 1, from: 'Fatima Al Marzouqi', role: 'HR Director · Clemenceau Medical', subject: 'Re: 90 nurse roles — CV shortlist', preview: 'Thanks for the profiles. Can we schedule interviews for the top 12 next week?', time: '18m', unread: true },
  { id: 2, from: 'Rashid Al Naboodah', role: 'Procurement · Al Naboodah', subject: 'Re: Metro blue line civils', preview: 'Send 15 more CVs for the site engineer roles. Rates look acceptable.', time: '1h', unread: true },
  { id: 3, from: 'Sarah Chen', role: 'Talent Lead · DP World', subject: 'Jebel Ali yard — manpower plan', preview: 'We are finalising headcount. Expect an RFQ by the end of the month.', time: '3h', unread: true },
  { id: 4, from: 'Omar Haddad', role: 'Facilities · Emaar', subject: 'FM rate card request', preview: 'Could you share your latest rate card for FM staffing?', time: '1d', unread: false },
]

export const RUN_HISTORY = [
  { id: 1, workflow: 'Award Scout — UAE', started: 'Today 09:14', steps: 8, found: 12, outreach: 5, status: 'success', ms: 4820 },
  { id: 2, workflow: 'Portal Submission', started: 'Today 08:02', steps: 8, found: 3, outreach: 3, status: 'success', ms: 3110 },
  { id: 3, workflow: 'Lead Nurture', started: 'Yesterday 18:40', steps: 8, found: 24, outreach: 18, status: 'success', ms: 5290 },
  { id: 4, workflow: 'Award Scout — UAE', started: 'Yesterday 12:22', steps: 6, found: 0, outreach: 0, status: 'partial', ms: 2140 },
  { id: 5, workflow: 'Award Scout — UAE', started: 'Yesterday 06:15', steps: 8, found: 9, outreach: 4, status: 'success', ms: 4610 },
  { id: 6, workflow: 'Portal Submission', started: '2 days ago 15:31', steps: 4, found: 0, outreach: 0, status: 'failed', ms: 880 },
]

export const OUTREACH = [
  { id: 1, client: 'ADNOC', contact: 'Procurement Team', subject: 'Ruwais expansion — 400 technicians available', sent: '2m ago', opens: 3, replies: 0, state: 'Opened' },
  { id: 2, client: 'Clemenceau Medical Center', contact: 'Fatima Al Marzouqi', subject: 'Vetted nurse shortlist — 90 roles', sent: '18m ago', opens: 5, replies: 1, state: 'Replied' },
  { id: 3, client: 'Al Naboodah Construction', contact: 'Rashid Al Naboodah', subject: 'Metro blue line — site engineers', sent: '1h ago', opens: 4, replies: 1, state: 'Replied' },
  { id: 4, client: 'DP World', contact: 'Sarah Chen', subject: 'Jebel Ali yard — logistics manpower', sent: '3h ago', opens: 2, replies: 0, state: 'Opened' },
  { id: 5, client: 'Emirates Airlines', contact: 'Cabin Crew Recruitment', subject: 'Cabin crew intake 2026 — 320 candidates', sent: '6h ago', opens: 0, replies: 0, state: 'Sent' },
  { id: 6, client: 'Aldar Properties', contact: 'Hospitality HR', subject: 'Yas Island resort — pre-opening staff', sent: '1d ago', opens: 1, replies: 0, state: 'Opened' },
]

export const SETTINGS = {
  scoreThreshold: 70,
  pollMinutes: 15,
  market: 'United Arab Emirates',
  autoOutreach: true,
  cvsPerEmail: 5,
  digestEmail: 'awaiz.ahmed@kanbanstudios.com',
}

export const TICKER = [
  { head: 'Emirates Airlines — cabin crew intake 2026', sub: 'Scored 81 · outreach queued', color: '#38BDF8' },
  { head: 'DP World awards Jebel Ali yard expansion', sub: 'Est. 260 logistics staff', color: '#FBBF24' },
  { head: 'Aldar breaks ground on Yas Island resort', sub: 'Hospitality · 180 roles implied', color: '#C084FC' },
  { head: 'Reply received — Emaar Facilities', sub: 'Asked for FM rate card', color: '#34D399' },
]
