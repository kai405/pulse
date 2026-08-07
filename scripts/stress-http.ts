const baseUrl = process.env.PULSE_BASE_URL ?? "http://localhost:3000";
export {};
const requestCount = Number(process.env.PULSE_STRESS_REQUESTS ?? 600);
const concurrency = Number(process.env.PULSE_STRESS_CONCURRENCY ?? 25);
const paths = ["/", "/dashboard", "/practice", "/history", "/progress", "/sessions/sample-community-change"];

if (!Number.isInteger(requestCount) || requestCount < 1 || !Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error("Stress request and concurrency values must be positive integers.");
}

const timings: number[] = [];
const statuses = new Map<number, number>();
const failures: string[] = [];
let cursor = 0;
const startedAt = performance.now();

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= requestCount) return;
    const path = paths[index % paths.length]!;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const start = performance.now();
    try {
      const response = await fetch(`${baseUrl}${path}`, { signal: controller.signal, redirect: "follow", headers: { "user-agent": "pulse-local-stress/1.0" } });
      await response.arrayBuffer();
      timings.push(performance.now() - start);
      statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
      if (!response.ok) failures.push(`${path}: HTTP ${response.status}`);
    } catch (error) {
      timings.push(performance.now() - start);
      failures.push(`${path}: ${error instanceof Error ? error.message : "request failed"}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, worker));
timings.sort((a, b) => a - b);
const elapsedMs = performance.now() - startedAt;
const percentile = (value: number) => timings[Math.min(timings.length - 1, Math.floor(timings.length * value))] ?? 0;
const report = {
  baseUrl,
  requests: requestCount,
  concurrency,
  failures: failures.length,
  statuses: Object.fromEntries([...statuses.entries()].sort(([a], [b]) => a - b)),
  throughputPerSecond: Number((requestCount / (elapsedMs / 1000)).toFixed(1)),
  latencyMs: { p50: Number(percentile(0.5).toFixed(1)), p95: Number(percentile(0.95).toFixed(1)), p99: Number(percentile(0.99).toFixed(1)), max: Number((timings.at(-1) ?? 0).toFixed(1)) },
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(failures.slice(0, 10).join("\n"));
  process.exitCode = 1;
}
