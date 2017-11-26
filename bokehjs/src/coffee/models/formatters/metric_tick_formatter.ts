import {TickFormatter} from "./tick_formatter"
import * as p from "core/properties"

function repeat<T>(value: T, times: number): T[] {
  const ret: T[] = [];
  for (let ii = 0; ii < times; ii++) {
    ret.push(value);
  }
  return ret;
}

type Prefix = [string, number]
// Return name and value of metric prefix to be used with x
// Ensures value < abs(x) < 1000*value
// Uses exponential notation if x is too large/small
function metric_prefix(x: number): Prefix {
  const prefixes: Prefix[] = [
    ['Y', 1e+24], ['Z', 1e+21], ['E', 1e+18], ['P', 1e+15],
    ['T', 1e+12], ['G', 1e+09], ['M', 1e+06], ['k', 1e+03],
    ['' , 1e+00],
    ['m', 1e-03], ['u', 1e-06], ['n', 1e-09], ['p', 1e-12],
    ['f', 1e-15], ['a', 1e-18], ['z', 1e-21], ['y', 1e-24]
  ];
  if (x === 0) {
    return ['', 1e0];
  }
  const absx = Math.abs(x);
  if (absx >= 1000*prefixes[0][1] || absx < prefixes[prefixes.length-1][1]) {
    // Too big/small, use exponential notation
    const power = Math.floor(Math.log(absx) / Math.log(10));
    //console.log(['e' + power.toString(), power]);
    return ['e' + power.toString(), Math.pow(10, power)]
  }
  for (const prefix of prefixes) {
    if (absx >= prefix[1]) {
      return prefix;
    }
  }
  throw new Error('should be unreachable');
}

// String representation of ticks using metric prefixes (u, m, k, M)
function format_metric(ticks: number[], max_precision: number=6): string[] {
  const absticks: number[] = ticks.map(Math.abs).filter(x => x !== 0);
  const min_tick: number = Math.min(...absticks);
  const max_tick: number = Math.max(...absticks);
  const prefixes: Prefix[] = (max_tick / min_tick < 10) ?
    // One metric prefix that makes the largest value pretty
    repeat(metric_prefix(Math.max(...ticks.map(Math.abs))), ticks.length) :
    // Different prefixes that make each value pretty
    ticks.map(metric_prefix);
  const scaledticks: [number, string][] = prefixes.map(
    ([name, value], idx) => [ticks[idx] / value, name] as [number, string]);
  const formatter = new Intl.NumberFormat('en-us', {
    useGrouping: false,
    maximumFractionDigits: max_precision
  });
  return scaledticks.map(([value, prefix]) => formatter.format(value) + prefix);
}

class MetricTickFormatter extends TickFormatter {
  max_precision: number;

  doFormat(ticks: number[], _axis: any) {
    return format_metric(ticks, this.max_precision);
  }
}
MetricTickFormatter.define({max_precision: [p.Number, 5]})

export { MetricTickFormatter }
