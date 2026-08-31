import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const siteCode = String(process.env.GOATCOUNTER_SITE_CODE || "")
  .trim()
  .toLowerCase();
const apiToken = String(process.env.GOATCOUNTER_API_TOKEN || "").trim();
const outputPath = resolve("assets/data/visitor-stats.json");

if (!/^[a-z0-9-]+$/.test(siteCode) || !apiToken) {
  console.log(
    "Visitor analytics is not configured. Set GOATCOUNTER_SITE_CODE and GOATCOUNTER_API_TOKEN."
  );
  process.exit(0);
}

const apiRoot = `https://${siteCode}.goatcounter.com/api/v0`;
const start = "2020-01-01T00:00:00Z";
const endDate = new Date();
endDate.setUTCMinutes(0, 0, 0);
const end = endDate.toISOString();
const headers = {
  Accept: "application/json",
  Authorization: `Bearer ${apiToken}`
};

class ApiError extends Error {
  constructor(path, status) {
    super(`${path} returned HTTP ${status}`);
    this.path = path;
    this.status = status;
  }
}

async function getJson(path, parameters = {}) {
  const url = new URL(`${apiRoot}/${path}`);
  Object.entries(parameters).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new ApiError(path, response.status);
  }
  return response.json();
}

async function getAllLocations() {
  const locations = [];
  let offset = 0;

  while (true) {
    let page;
    try {
      page = await getJson("stats/locations", {
        start,
        end,
        limit: 100,
        offset
      });
    } catch (error) {
      // Some GoatCounter installations do not expose the locations report.
      // Keep publishing total traffic in that case instead of failing the job.
      if (error instanceof ApiError && error.status === 404) {
        console.warn(
          "GoatCounter stats/locations is unavailable (HTTP 404); publishing totals without location data."
        );
        return [];
      }
      throw error;
    }
    const rows = Array.isArray(page.stats) ? page.stats : [];
    locations.push(...rows);

    if (!page.more || rows.length === 0) {
      break;
    }
    offset += rows.length;
  }

  return locations;
}

const [totalPayload, rawLocations] = await Promise.all([
  getJson("stats/total", { start, end }),
  getAllLocations()
]);

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryTotals = new Map();

for (const location of rawLocations) {
  const rawId = String(location.id || "").trim().toUpperCase();
  const countryCode = rawId.split("-")[0];
  const count = Number(location.count);

  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === "ZZ" || !Number.isFinite(count) || count <= 0) {
    continue;
  }

  let countryName;
  try {
    countryName = displayNames.of(countryCode);
  } catch {
    countryName = "";
  }
  if (!countryName || countryName === countryCode || countryName === "Unknown Region") {
    continue;
  }

  const current = countryTotals.get(countryCode) || {
    code: countryCode,
    name: countryName,
    count: 0
  };
  current.count += count;
  countryTotals.set(countryCode, current);
}

const publicStats = {
  configured: true,
  site_code: siteCode,
  total: Number(totalPayload.total) || 0,
  locations: Array.from(countryTotals.values()).sort((a, b) => b.count - a.count),
  updated_at: new Date().toISOString()
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(publicStats, null, 2)}\n`, "utf8");
console.log(`Published aggregate statistics for ${publicStats.locations.length} locations.`);
