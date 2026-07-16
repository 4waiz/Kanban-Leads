# Kanban AI Leads — Project Award Scout

A React dashboard for a proactive lead-generation agent: it watches news and tender
portals for project awards, extracts the entities, scores the lead, and triggers
outreach with vetted CVs. Built by **Kanban Studios**.

The whole app is a single fixed screen — nothing scrolls but inner panes, and the
flow diagram auto-fits whatever space it has, so it looks right on any projector
or laptop without zooming.

Demo data covers the UAE market across the five priority sectors — construction and
engineering, healthcare, hospitality and F&B, facilities management, and logistics.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build && npm run preview   # production build
```

## The workflow canvas

The node graph is fully interactive, not a picture:

| Action | How |
|---|---|
| Move a node | Drag it |
| Connect two nodes | Drag from a teal port onto another node |
| Cut a connection | Click the wire |
| Edit label / type / note | Double-click a node |
| Add, duplicate, delete | Toolbar, or `Delete` on a selected node |
| Run the flow | **Run workflow** — walks the graph, lighting each step |
| Pan / zoom | Drag the background / scroll wheel |
| Switch workflow | The chip top-right cycles the three flows |

Three workflows ship with it: **Award Scout — UAE**, **Lead Nurture**, and
**Portal Submission**.

## Pages

The sidebar switches between six working pages:

| Page | What's there |
|---|---|
| **Home** | Morning briefing, headline stats, hot leads |
| **Dashboard** | The main screen — canvas, metrics, pipeline, awards, email stats |
| **Metrics** | Edit each figure and its trend; drag the month sliders to reshape revenue |
| **Pipeline** | Rename stages, recolour them, drag to reorder, add or remove |
| **Email stats** | Open-rate and per-month sliders, source colours and shares |
| **Leads** | Award cards with score rings and fee potential; filter by sector and score |
| **History** | A timeline of agent runs — expand any one for its detail |
| **Outreach** | Sent emails with opens, replies and follow-up |
| **Settings** | Rules with live consequences, and a preview of who they'd contact |

Every panel on the dashboard has a matching detail page in the sidebar where its
data is fully editable — edits show up on the dashboard immediately.

## Run the workflow — the demo moment

**Run** doesn't just animate the canvas. Each step reports what it did, and the whole
screen reacts:

- The canvas dims to the active path, dashes march along the live wire, and the
  current node pulses — you can watch the data move.
- A badge names the client being scouted and counts the steps.
- The activity feed narrates each step ("award detected" → "entities extracted" →
  "scored 92 — qualified" → "CVs sent").
- Metric and pipeline cards light up and tick over as their step lands; the pipeline
  stage pops and the open rate climbs.
- When the run reaches the final node, **confetti bursts from that node** and a card
  reports the outcome: who qualified, at what score, and the fee it's worth.

Every run picks the next client, so it tells a different story each time. All of it
respects `prefers-reduced-motion`.

## Fullscreen

The expand button beside the workflow picker blows the canvas up to the full screen —
the diagram re-fits automatically. `Esc` exits.

## Everything is clickable

The bell and inbox open real dropdowns with unread state; the avatar opens a profile
menu. Click any metric, pipeline stage, or `•••` menu to change values. The legend
toggles donut segments, table headers sort, and search filters the feed and awards.
The activity feed streams new events on a timer.

## Layout

```
src/
  App.jsx               shell, routing, state, demo interactions
  components/
    FlowCanvas.jsx      node graph — drag, link, pan, zoom, auto-fit, run
    NodeEditor.jsx      node edit modal
    Charts.jsx          revenue, email and donut charts (canvas)
    Menus.jsx           notification / inbox / profile / workflow dropdowns
    Pages.jsx           Home, Leads, History, Outreach, Settings
  data/seed.js          all demo data — edit here to re-theme the pitch
  styles.css            tokens and layout
  assets/               KS logo + embedded Space Grotesk / JetBrains Mono
```

Fonts and the logo are bundled as local assets, so the app renders identically
offline — no CDN, no font fallback surprises during a demo.
