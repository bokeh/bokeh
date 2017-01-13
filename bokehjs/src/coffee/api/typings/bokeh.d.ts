declare namespace Bokeh {
  var version: string;

  var index: Map<View<LayoutDOM>>;

  var _: _.UnderscoreStatic;
  var $: JQueryStatic;

  class LogLevel {
   name: string;
   level: number;
  }

  type NamedLogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "off";

  function set_log_level(level: NamedLogLevel): void;

  class Logger {
   get_level: () => LogLevel;
   set_level: (log_level: LogLevel | NamedLogLevel) => void;

   trace: (...args: any[]) => void;
   debug: (...args: any[]) => void;
   info:  (...args: any[]) => void;
   warn:  (...args: any[]) => void;
   error: (...args: any[]) => void;
   fatal: (...args: any[]) => void;
  }
  var logger: Logger;

  function sprintf(fmt: string, ...args: any[]): string;

  namespace embed {
    export function add_document_standalone(doc: Document, element: HTMLElement, use_for_title?: boolean): void;
  }

  namespace LinAlg {
    export function zip<A, B>(As: Array<A>, Bs: Array<B>): Array<[A, B]>;
    export function unzip<A, B>(ABs: Array<[A, B]>): [Array<A>, Array<B>];
    export function range(start: number, stop?: number, step?: number): Array<number>;
    export function linspace(start: number, stop: number, num?: number): Array<number>;
    export function transpose<T>(array: Array<Array<T>>): Array<Array<T>>;
    export function sum(array: Array<number>): number;
    export function cumsum(array: Array<number>): Array<number>;
    export function min(array: Array<number>): number;
    export function minBy<T>(array: Array<T>, key: (item: T) => number): T;
    export function max(array: Array<number>): number;
    export function maxBy<T>(array: Array<T>, key: (item: T) => number): T;
    export function argmin(array: Array<number>): number;
    export function argmax(array: Array<number>): number;
  }
}
