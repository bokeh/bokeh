import fs from "node:fs"
import path from "node:path"

import type {State} from "./baselines.js"
import {create_baseline, diff_baseline} from "./baselines.js"
import type {BrowserManager} from "./browser.js"
import {BrowserError, Value, Failure} from "./browser.js"
import type {TestCase} from "./discovery.js"
import {diff_image} from "./image.js"
import type {MetricsCollector} from "./metrics.js"
import {platform} from "./sys.js"
import type {Suite, Test, Result, TestRunContext, ScreenshotMode} from "./types.js"

export class TestRunner {
  private readonly ctx_json: string

  constructor(
    private browser: BrowserManager,
    ctx: TestRunContext,
    private baselines_root: string | null,
    private screenshot: ScreenshotMode,
    private pedantic: boolean,
    private top_level: Suite,
    private ref: string,
    private metrics: MetricsCollector | null,
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

    let output: Value<Result> | Failure
    let browser_available = true
    try {
      output = await this.execute_test(seq, test)
    } catch (error) {
      if (error instanceof BrowserError) {
        throw error
      }
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
      }
    } catch (error) {
      if (error instanceof BrowserError) {
        browser_available = false
      }
      throw error
    } finally {
      if (browser_available) {
        const output = await this.browser.evaluate(`Tests.clear(${seq})`)
        if (output instanceof Failure) {
          status.errors.push(output.text)
          status.failure = true
        }
      }
    }

    return should_retry
  }

  private async execute_test(seq: string, test: Test): Promise<Value<Result> | Failure> {
    if (test.dpr != null || test.scale != null) {
      await this.browser.override_metrics({dpr: test.dpr, scale: test.scale})
    }
    let browser_available = true
    try {
      return await this.browser.evaluate<Result>(`Tests.run(${seq}, ${this.ctx_json})`, test.timeout)
    } catch (error) {
      if (error instanceof BrowserError) {
        browser_available = false
      }
      throw error
    } finally {
      if (browser_available && (test.dpr != null || test.scale != null)) {
        await this.browser.override_metrics()
      }
    }
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
