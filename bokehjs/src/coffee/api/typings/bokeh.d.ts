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
    export function transpose<T>(array: Array<Array<T>>): Array<Array<T>>;
    export function linspace(start: number, stop: number, num?: Int): Array<number>;
    export function arange(start: number, stop: number, step?: number): Array<number>;
  }
}
