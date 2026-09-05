import fs from "node:fs"
import path from "node:path"

import type {Box, State} from "./baselines.js"
import {create_baseline, diff_baseline} from "./baselines.js"
import type {BrowserManager} from "./browser.js"
import {Value, Failure, Timeout} from "./browser.js"
import type {TestCase} from "./discovery.js"
import {crop_image, cross_compare_images, diff_image} from "./image.js"
import type {MetricsCollector} from "./metrics.js"
import {platform} from "./sys.js"
import type {Suite, Test, Result, TestRunContext, ScreenshotMode} from "./types.js"

const MAX_TIMEOUT_RETRIES = 2 // Retry timeout failures up to 2 times

export type CrossResult = {
  name: string
  description: string[]
  pixels: number
  percent: number
  avg_distance: number
  max_distance: number
  threshold: number
  passed: boolean
  files_dir: string
}

export class TestRunner {
  private readonly ctx_json: string
  readonly cross_results: CrossResult[] = []

  constructor(
    private browser: BrowserManager,
    ctx: TestRunContext,
    private baselines_root: string | null,
    private screenshot: ScreenshotMode,
    private pedantic: boolean,
    private top_level: Suite,
    private ref: string,
    private metrics: MetricsCollector | null,
    private cross_backend: boolean = false,
  ) {
    this.ctx_json = JSON.stringify(ctx)
  }

  async run_with_retry(test_case: TestCase, retry: boolean): Promise<void> {
    const [suites, test, status] = test_case

    this.browser.clear_entries()
    this.browser.clear_exceptions()

    if (test.skip) {
      status.skipped = true
    } else {
      const do_retry = await this.run_test(suites, test, status, null)
      if ((retry || test.retries != null) && do_retry) {
        const retries = test.retries ?? 10

        for (let i = 0; i < retries; i++) {
          const do_retry = await this.run_test(suites, test, status, i)
          if (!do_retry) {
            break
          }
        }
      }
    }
  }

  private async run_test(suites: Suite[], test: Test, status: TestCase[2], attempt: number | null): Promise<boolean> {
    let should_retry = false

    const seq = JSON.stringify(this.to_seq(suites, test))

    let output: Value<Result> | Failure | Timeout
    try {
      output = await this.execute_test(seq, test)
    } catch (error) {
      status.errors.push(`Unexpected error during test execution: ${error}`)
      status.failure = true
      return false
    }

    if (this.metrics != null) {
      await this.metrics.add_datapoint(this.browser)
    }

    try {
      const entries = this.browser.get_entries()
      const exceptions = this.browser.get_exceptions()

      const errors = entries.filter((entry) => entry.level == "error")
      if (errors.length != 0) {
        status.errors.push(...errors.map((entry) => entry.text))
        // status.failure = true // XXX: too chatty right now
      }

      if (exceptions.length != 0) {
        status.errors.push(...exceptions.map((exc) => exc.text))
        status.failure = true // XXX: too chatty right now
      }

      if (output instanceof Failure) {
        status.errors.push(output.text)
        status.failure = true
      } else if (output instanceof Timeout) {
        status.errors.push("timeout")
        status.timeout = true
      } else {
        const result = output.value

        if (result.error != null) {
          const {str, stack} = result.error
          status.errors.push(stack ?? str)
          status.failure = true
        }

        if (this.baselines_root != null) {
          const baseline_name = status.baseline_name!
          const baseline_path = path.join(this.baselines_root, platform, baseline_name)

          should_retry = await this.validate_baseline(result, baseline_path, status, test, seq) || should_retry

          if (!(test.no_image ?? false)) {
            should_retry = await this.compare_screenshot(result, baseline_path, status, test, attempt) || should_retry
          }
        }

        if (this.cross_backend) {
          await this.compare_backends(result, status, suites, test, seq)
        }
      }
    } finally {
      const output = await this.browser.evaluate(`Tests.clear(${seq})`)
      if (output instanceof Failure) {
        status.errors.push(output.text)
        status.failure = true
      }
    }

    return should_retry
  }

  private async compare_backends(result: Result, status: TestCase[2], suites: Suite[], test: Test, seq: string): Promise<void> {
    const {bbox} = result
    if (bbox == null) {
      return
    }

    let state = result.state
    const later_output = await this.browser.evaluate<State | null>(`Tests.get_state(${seq})`)
    if (later_output instanceof Value && later_output.value != null) {
      state = later_output.value
    }

    const child_bboxes = state?.children?.flatMap((child) => child.bbox != null ? [child.bbox] : []) ?? []
    if (child_bboxes.length < 2) {
      status.errors.push("cross-backend comparison requires two rendered child views")
      status.failure = true
      return
    }

    const image = await this.browser.capture_screenshot(bbox)
    const files_dir = path.join("test", "cross_backend", "results", platform)
    await fs.promises.mkdir(files_dir, {recursive: true})

    const parts = [...suites, test].map(({description}) => description)
    const name = parts
      .map((part) => part.replace(/^Cross-backend comparison$/i, "Comparison").replace(/^all /i, ""))
      .filter((part) => part.length > 0)
      .join("_")
      .replace(/[ \/\[\]:]/g, "_")

    const [canvas_bbox, webgl_bbox] = child_bboxes as [Box, Box, ...Box[]]
    const comparison = cross_compare_images(image, canvas_bbox, webgl_bbox)
    await fs.promises.writeFile(path.join(files_dir, `${name}_canvas.png`), crop_image(image, canvas_bbox))
    await fs.promises.writeFile(path.join(files_dir, `${name}_webgl.png`), crop_image(image, webgl_bbox))
    if (comparison != null) {
      await fs.promises.writeFile(path.join(files_dir, `${name}_diff.png`), comparison.diff)
    }

    const threshold = test.threshold ?? 0
    const pixels = comparison?.pixels ?? 0
    const passed = pixels <= threshold
    this.cross_results.push({
      name,
      description: parts,
      pixels,
      percent: comparison?.percent ?? 0,
      avg_distance: comparison?.avg_distance ?? 0,
      max_distance: comparison?.max_distance ?? 0,
      threshold,
      passed,
      files_dir,
    })
    if (!passed) {
      status.errors.push(`backends differ by ${pixels}px (${(comparison?.percent ?? 0).toFixed(2)}%)`)
      status.failure = true
    }
  }

  private async execute_test(seq: string, test: Test): Promise<Value<Result> | Failure | Timeout> {
    let retries = MAX_TIMEOUT_RETRIES

    do {
      const output = await (async () => {
        if (test.dpr != null || test.scale != null) {
          await this.browser.override_metrics({dpr: test.dpr, scale: test.scale})
        }
        try {
          return await this.browser.evaluate<Result>(`Tests.run(${seq}, ${this.ctx_json})`)
        } finally {
          if (test.dpr != null || test.scale != null) {
            await this.browser.override_metrics()
          }
        }
      })()

      if (!(output instanceof Timeout)) {
        return output
      }

      // A timeout only stops waiting for Runtime.evaluate(); it doesn't cancel
      // the test running in the page. Reloading destroys that execution context
      // so retries and subsequent tests don't overlap with outstanding work.
      await this.browser.reload_page()
      await this.browser.evaluate("preload_fonts()")

      if (!await this.browser.is_ready()) {
        throw new Error("Failed to reload test page after timeout")
      }

      if (retries-- <= 0) {
        return output
      }
    } while (true)
  }

  private async validate_baseline(result: Result, baseline_path: string, status: TestCase[2], test: Test, seq: string): Promise<boolean> {
    let should_retry = false

    if (status.baseline_name == null) {
      status.errors.push("baseline_name not set before test execution")
      status.failure = true
      return should_retry
    }

    const {state: state_early} = result
    if (state_early == null) {
      status.errors.push("state not present in output")
      status.failure = true
    } else {
      const output = await this.browser.evaluate<State | null>(`Tests.get_state(${seq})`)
      if (!(output instanceof Value) || output.value == null) {
        status.errors.push("state not present in output")
        status.failure = true
      } else {
        const state = output.value

        const baseline_early = create_baseline([state_early])
        const baseline = create_baseline([state])

        if (this.pedantic) {
          // This shouldn't happen, but sometimes does, especially in
          // interactive tests. This needs to be resolved earlier, but
          // at least the state will be consistent with images.
          if (baseline_early != baseline) {
            status.errors.push("inconsistent state")
            status.errors.push("early:", baseline_early)
            status.errors.push("later:", baseline)
            status.failure = true
            return should_retry
          }
        }

        const baseline_file = `${baseline_path}.blf`
        await fs.promises.writeFile(baseline_file, baseline)
        status.baseline = baseline

        const {existing_blf} = status
        if (existing_blf != baseline) {
          if (existing_blf == null) {
            status.errors.push("missing baseline")
          } else {
            if (test.retries != null) {
              should_retry = true
            }
          }
          const diff = diff_baseline(baseline_file, this.ref)
          status.failure = true
          status.baseline_diff = diff
          status.errors.push(diff)
        }
      }
    }

    return should_retry
  }

  private async compare_screenshot(result: Result, baseline_path: string, status: TestCase[2], test: Test, attempt: number | null): Promise<boolean> {
    let should_retry = false

    const {bbox} = result
    if (bbox != null) {
      const current = await this.browser.capture_screenshot(bbox)
      status.image = current

      const image_file = `${baseline_path}.png`
      const write_image = async () => fs.promises.writeFile(image_file, current)
      const {existing_png} = status

      switch (this.screenshot) {
        case "test": {
          if (existing_png == null) {
            status.failure = true
            status.errors.push("missing baseline image")
            await write_image()
          } else {
            status.reference = existing_png

            if (!existing_png.equals(current)) {
              const diff_result = diff_image(existing_png, current)
              if (diff_result != null) {
                should_retry = true
                const {diff, pixels, percent} = diff_result
                const threshold = test.threshold ?? 0
                if (pixels > threshold) {
                  await write_image()
                  status.failure = true
                  status.image_diff = diff
                  status.errors.push(`images differ by ${pixels}px (${percent.toFixed(2)}%)${attempt != null ? ` (attempt=${attempt})` : ""}`)
                }
              }
            }
          }
          break
        }
        case "save": {
          await write_image()
          break
        }
        case "skip": {
          break
        }
        default: {
          throw new Error(`invalid argument --screenshot=${this.screenshot}`)
        }
      }
    }

    return should_retry
  }

  private to_seq(suites: Suite[], test: Test): [number[], number] {
    let current = this.top_level
    const si = []
    for (const suite of suites) {
      si.push(current.suites.indexOf(suite))
      current = suite
    }
    const ti = current.tests.indexOf(test)
    return [si, ti]
  }
}
