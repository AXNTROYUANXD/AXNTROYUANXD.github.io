---
title: "Visitors"
permalink: /visitors/
author_profile: true
---

<div class="visitor-dashboard" data-stats-url="{{ '/assets/data/visitor-stats.json' | relative_url }}">
  <p class="visitor-dashboard__intro">
    An approximate, privacy-preserving view of this website's audience. Locations are aggregated at country or region level; raw IP addresses are neither stored here nor displayed.
  </p>

  <div class="visitor-dashboard__summary" aria-label="Visitor summary">
    <section class="visitor-stat-card">
      <span class="visitor-stat-card__label">Total visits</span>
      <strong class="visitor-stat-card__value" id="visitor-total" aria-live="polite">—</strong>
    </section>
    <section class="visitor-stat-card">
      <span class="visitor-stat-card__label">Countries / regions</span>
      <strong class="visitor-stat-card__value" id="visitor-country-count">—</strong>
    </section>
    <section class="visitor-stat-card">
      <span class="visitor-stat-card__label">Last updated</span>
      <strong class="visitor-stat-card__value visitor-stat-card__value--time" id="visitor-updated">—</strong>
    </section>
  </div>

  <section class="visitor-map-panel" aria-labelledby="visitor-map-title">
    <div class="visitor-map-panel__heading">
      <div>
        <h2 id="visitor-map-title">Visitor map</h2>
        <p>Colour intensity represents aggregated visit counts.</p>
      </div>
      <span class="visitor-map-panel__status" id="visitor-map-status" role="status">Loading data…</span>
    </div>
    <div id="visitor-map" class="visitor-map" role="img" aria-label="World map showing visitor counts by country or region"></div>
    <div class="visitor-map__empty" id="visitor-map-empty" hidden>
      Visitor statistics will appear here after the analytics source is activated.
    </div>
  </section>

  <section class="visitor-locations" aria-labelledby="visitor-locations-title">
    <h2 id="visitor-locations-title">Top locations</h2>
    <ol class="visitor-locations__list" id="visitor-location-list">
      <li class="visitor-locations__placeholder">Waiting for visitor data…</li>
    </ol>
  </section>

  <p class="visitor-dashboard__privacy">
    IP-derived locations are approximate and may be affected by VPNs or proxies. Only aggregate counts are published.
  </p>
</div>

<script defer src="https://cdn.plot.ly/plotly-3.6.0.min.js" charset="utf-8"></script>
<script defer src="{{ '/assets/js/visitors.js' | relative_url }}"></script>
