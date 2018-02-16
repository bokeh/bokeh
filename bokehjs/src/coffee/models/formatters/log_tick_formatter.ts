/* XXX: partial */
import {TickFormatter} from "./tick_formatter";
import {BasicTickFormatter} from "./basic_tick_formatter";
import {LogTicker} from "../tickers/log_ticker"
import {logger} from "core/logging";
import * as p from "core/properties"

export namespace LogTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    ticker: LogTicker | null
  }

  export interface Opts extends TickFormatter.Opts {}
}

export interface LogTickFormatter extends LogTickFormatter.Attrs {}

export class LogTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<LogTickFormatter.Attrs>, opts?: LogTickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = 'LogTickFormatter';

    this.define({
      ticker: [ p.Instance, null ],
    });
  }

  initialize(): void {
    super.initialize();
    this.basic_formatter = new BasicTickFormatter();
    if ((this.ticker == null)) {
      logger.warn("LogTickFormatter not configured with a ticker, using default base of 10 (labels will be incorrect if ticker base is not 10)");
    }
  }

  doFormat(ticks, _axis) {
    let base;
    if (ticks.length === 0) {
      return [];
    }

    if (this.ticker != null) {
      ({ base } = this.ticker);
    } else {
      base = 10;
    }

    let small_interval = false;
    let labels = new Array(ticks.length);
    for (let i = 0, end = ticks.length; i < end; i++) {
      labels[i] = `${base}^${ Math.round(Math.log(ticks[i]) / Math.log(base)) }`;
      if ((i > 0) && (labels[i] === labels[i-1])) {
        small_interval = true;
        break;
      }
    }

    if (small_interval) {
      labels = this.basic_formatter.doFormat(ticks);
    }

    return labels;
  }
}
LogTickFormatter.initClass();
