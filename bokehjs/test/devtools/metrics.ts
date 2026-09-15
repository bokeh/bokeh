import type {BrowserManager} from "./browser.js"

export type MetricKeys = "JSEventListeners" | "Nodes" | "Resources" | "LayoutCount" | "RecalcStyleCount" | "JSHeapUsedSize" | "JSHeapTotalSize"

export class MetricsCollector {
  private metrics: {[key in MetricKeys]: number[]} = {
    JSEventListeners: [],
    Nodes: [],
    Resources: [],
    LayoutCount: [],
    RecalcStyleCount: [],
    JSHeapUsedSize: [],
    JSHeapTotalSize: [],
  }

  async add_datapoint(browser: BrowserManager): Promise<void> {
    const data = await browser.get_metrics()
    for (const {name, value} of data) {
      if (name in this.metrics) {
        this.metrics[name as MetricKeys].push(value)
      }
    }
  }

  checkpoint(): {[key in MetricKeys]: number} {
    return Object.fromEntries(
      Object.entries(this.metrics).map(([key, values]) => [key, values.length]),
    ) as {[key in MetricKeys]: number}
  }

  restore(checkpoint: {[key in MetricKeys]: number}): void {
    for (const key of Object.keys(this.metrics) as MetricKeys[]) {
      this.metrics[key].length = checkpoint[key]
    }
  }

  get_metrics(): {[key in MetricKeys]: number[]} {
    return this.metrics
  }
}
