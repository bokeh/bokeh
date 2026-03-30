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

  get_metrics(): {[key in MetricKeys]: number[]} {
    return this.metrics
  }
}
