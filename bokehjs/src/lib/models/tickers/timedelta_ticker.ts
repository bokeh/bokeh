import type * as p from "core/properties"

import {AdaptiveTicker} from "./adaptive_ticker"
import {CompositeTicker} from "./composite_ticker"
import {ONE_MILLI, ONE_SECOND, ONE_MINUTE, ONE_HOUR, ONE_DAY} from "./util"

// This is a decent ticker for time data (in milliseconds).
// It could certainly be improved:
// FIXME There should probably be a special ticker for years.
// FIXME Some of the adaptive tickers probably have too many mantissas, which
// leads to too-frequent tick transitions.

export namespace TimedeltaTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CompositeTicker.Props
}

export interface TimedeltaTicker extends TimedeltaTicker.Attrs {}

export class TimedeltaTicker extends CompositeTicker {
  declare properties: TimedeltaTicker.Props

  constructor(attrs?: Partial<TimedeltaTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.override<TimedeltaTicker.Props>({
      num_minor_ticks: 0,
      tickers: () => [
        // Sub-second.
        new AdaptiveTicker({
          mantissas: [1, 2, 5],
          base: 10,
          min_interval: 0,
          max_interval: 500 * ONE_MILLI,
          num_minor_ticks: 0,
        }),

        // Seconds, minutes.
        new AdaptiveTicker({
          mantissas: [1, 2, 5, 10, 15, 20, 30],
          base: 60,
          min_interval: ONE_SECOND,
          max_interval: 30 * ONE_MINUTE,
          num_minor_ticks: 0,
        }),

        // Hours.
        new AdaptiveTicker({
          mantissas: [1, 2, 4, 6, 8, 12],
          base: 24.0,
          min_interval: ONE_HOUR,
          max_interval: 12 * ONE_HOUR,
          num_minor_ticks: 0,
        }),

        // Days.
        new AdaptiveTicker({
          mantissas: [1, 2, 5],
          base: 10,
          min_interval: ONE_DAY,
          max_interval: null,
          num_minor_ticks: 0,
        }),
      ],
    })
  }
}
