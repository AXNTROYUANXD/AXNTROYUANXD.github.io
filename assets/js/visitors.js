(function () {
  "use strict";

  var dashboard = document.querySelector(".visitor-dashboard");
  if (!dashboard) {
    return;
  }

  var totalElement = document.getElementById("visitor-total");
  var countryCountElement = document.getElementById("visitor-country-count");
  var updatedElement = document.getElementById("visitor-updated");
  var mapElement = document.getElementById("visitor-map");
  var emptyElement = document.getElementById("visitor-map-empty");
  var statusElement = document.getElementById("visitor-map-status");
  var locationList = document.getElementById("visitor-location-list");
  var statsUrl = dashboard.getAttribute("data-stats-url");
  var numberFormatter = new Intl.NumberFormat("en");

  function setEmptyState(message, status) {
    mapElement.hidden = true;
    emptyElement.hidden = false;
    emptyElement.textContent = message;
    statusElement.textContent = status || "Not configured";
    locationList.innerHTML = "";
    var item = document.createElement("li");
    item.className = "visitor-locations__placeholder";
    item.textContent = "No aggregate location data yet.";
    locationList.appendChild(item);
  }

  function formatUpdatedTime(value) {
    if (!value) {
      return "Not yet";
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(date);
  }

  function renderLocationList(locations) {
    locationList.innerHTML = "";
    locations.slice(0, 10).forEach(function (location) {
      var item = document.createElement("li");
      var name = document.createElement("span");
      var count = document.createElement("strong");

      name.textContent = location.name;
      count.textContent = numberFormatter.format(location.count);
      item.appendChild(name);
      item.appendChild(count);
      locationList.appendChild(item);
    });
  }

  function renderMap(locations) {
    if (!window.Plotly) {
      setEmptyState("The interactive map could not be loaded.");
      statusElement.textContent = "Map unavailable";
      return;
    }

    var trace = {
      type: "choropleth",
      locationmode: "country names",
      locations: locations.map(function (location) { return location.name; }),
      z: locations.map(function (location) { return location.count; }),
      text: locations.map(function (location) { return location.name; }),
      hovertemplate: "%{text}<br>%{z:,} visits<extra></extra>",
      colorscale: [
        [0, "#eaf6f9"],
        [0.25, "#b9e1ea"],
        [0.55, "#72bfd1"],
        [0.8, "#399ab5"],
        [1, "#166d89"]
      ],
      marker: {
        line: {
          color: "#ffffff",
          width: 0.5
        }
      },
      colorbar: {
        title: {
          text: "Visits"
        },
        thickness: 12,
        outlinewidth: 0
      }
    };

    var layout = {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      geo: {
        showframe: false,
        showcoastlines: true,
        coastlinecolor: "#c8d3d8",
        showland: true,
        landcolor: "#f4f6f7",
        showocean: true,
        oceancolor: "#f8fbfc",
        projection: {
          type: "natural earth"
        }
      }
    };

    mapElement.hidden = false;
    emptyElement.hidden = true;
    window.Plotly.newPlot(mapElement, [trace], layout, {
      responsive: true,
      displayModeBar: false,
      scrollZoom: false,
      showLink: false
    });
    statusElement.textContent = "Aggregated by location";
  }

  function refreshPublicTotal(siteCode, fallbackTotal) {
    totalElement.textContent = numberFormatter.format(fallbackTotal);
    if (!/^[a-z0-9-]+$/.test(siteCode)) {
      return;
    }

    var counterUrl = "https://" + siteCode + ".goatcounter.com/counter/TOTAL.json";
    fetch(counterUrl, { credentials: "omit", cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Public counter is unavailable");
        }
        return response.json();
      })
      .then(function (counter) {
        if (counter && counter.count) {
          totalElement.textContent = counter.count;
        }
      })
      .catch(function () {
        // The hourly aggregate remains visible when the public counter is disabled.
      });
  }

  fetch(statsUrl, { credentials: "omit", cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Visitor statistics are unavailable");
      }
      return response.json();
    })
    .then(function (stats) {
      var locations = Array.isArray(stats.locations)
        ? stats.locations.filter(function (location) {
            return location &&
              typeof location.name === "string" &&
              Number.isFinite(Number(location.count)) &&
              Number(location.count) > 0;
          }).map(function (location) {
            return {
              code: String(location.code || ""),
              name: location.name,
              count: Number(location.count)
            };
          })
        : [];

      locations.sort(function (a, b) { return b.count - a.count; });
      refreshPublicTotal(String(stats.site_code || ""), Number(stats.total) || 0);
      countryCountElement.textContent = numberFormatter.format(locations.length);
      updatedElement.textContent = formatUpdatedTime(stats.updated_at);

      if (!stats.configured || locations.length === 0) {
        setEmptyState(
          stats.configured
            ? "Visitor locations will appear after the first visits are recorded."
            : "Visitor statistics will appear here after the analytics source is activated.",
          stats.configured ? "Collecting data" : "Not configured"
        );
        return;
      }

      renderLocationList(locations);
      renderMap(locations);
    })
    .catch(function () {
      totalElement.textContent = "Unavailable";
      countryCountElement.textContent = "—";
      updatedElement.textContent = "—";
      setEmptyState("Visitor statistics are temporarily unavailable.");
      statusElement.textContent = "Unavailable";
    });
})();
