import {logger} from "core/logging"
import {range} from "core/util/array"
import {AdaptiveTicker} from "./adaptive_ticker"

export class LogTicker extends AdaptiveTicker {

  get_ticks_no_defaults(data_low, data_high, cross_loc, desired_n_ticks) {
    num_minor_ticks = this.num_minor_ticks
    minor_ticks = []

    base = this.base

    log_low = Math.log(data_low) / Math.log(base)
    log_high = Math.log(data_high) / Math.log(base)
    log_interval = log_high - log_low

    if (!isFinite(log_interval)) {
      ticks = []
    } else if (log_interval < 2) { // treat as linear ticker
      const interval = this.get_interval(data_low, data_high, desired_n_ticks)
      const start_factor = Math.floor(data_low / interval)
      const end_factor   = Math.ceil(data_high / interval)

      const ticks = range(start_factor, end_factor + 1)
        .filter((factor) => factor != 0)
        .map((factor) => factor*interval)
        .filter((tick) => data_low <= tick && tick <= data_high)

      if (num_minor_ticks > 0 && ticks.length > 0) {
        const minor_interval = interval / num_minor_ticks
        const minor_offsets = range(0, num_minor_ticks).map((i) => i*minor_interval)
        for (const x of minor_offsets[1..minor_offsets.length]) {
          minor_ticks.push(ticks[0] - x)
        }
        for (const tick of ticks) {
          for (const x of minor_offsets) {
            minor_ticks.push(tick + x)
          }
        }
      }
    } else {
      const startlog = Math.ceil(log_low * 0.999999)
      const endlog = Math.floor(log_high * 1.000001)
      const interval = Math.ceil((endlog - startlog) / 9.0)

      const ticks = range(startlog, endlog + 1, interval)
        .map((i) => Math.pow(base, i))
        .filter((tick) => data_low <= tick && tick <= data_high)

      if (num_minor_ticks > 0 && ticks.length > 0) {
        const minor_interval = Math.pow(base, interval) / num_minor_ticks
        const minor_offsets = until(1, num_minor_ticks).map((i) => i*minor_interval)
        for (const x of minor_offsets) {
          minor_ticks.push(ticks[0] / x)
        }
        minor_ticks.push(ticks[0])
        for (const tick of ticks) {
          for (const x of minor_offsets) {
            minor_ticks.push(tick * x)
          }
        }
      }
    }

    return {
      major: ticks,
      minor: minor_ticks,
    }
  }
}

LogTicker.prototype.type = "LogTicker"

LogTicker.override({
  mantissas: [1, 5],
})
