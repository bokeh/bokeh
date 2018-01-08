/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {BasicTickFormatter} from "./basic_tick_formatter";
import {TickFormatter} from "./tick_formatter";
import {logger} from "core/logging";
import * as p from "core/properties"
;

export class LogTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'LogTickFormatter';

    this.define({
      ticker: [ p.Instance, null ]
    });
  }

  initialize(attrs, options) {
    super.initialize(attrs, options);
    this.basic_formatter = new BasicTickFormatter();
    if ((this.ticker == null)) {
      return logger.warn("LogTickFormatter not configured with a ticker, using default base of 10 (labels will be incorrect if ticker base is not 10)");
    }
  }

  doFormat(ticks, axis) {
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
    for (let i = 0, end = ticks.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
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
