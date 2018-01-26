declare namespace Bokeh {
  const version: string;

  const index: Map<View<LayoutDOM>>;

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
  const logger: Logger;

  class Settings {
    dev: boolean;
  }

  const settings: Settings;

  function sprintf(fmt: string, ...args: any[]): string;

  namespace embed {
    export function add_document_standalone(doc: Document, element: HTMLElement, use_for_title?: boolean): void;
  }

  namespace LinAlg {
    // core/util/object.ts
    export function keys<T>(object: T): string[]
    export function values<T>(object: {[key: string]: T}): T[]
    export function extend<T, T1>(dest: T, source: T1): T & T1
    export function extend<R>(dest: any, ...sources: any[]): R
    export function clone<T>(obj: T): T
    export function isEmpty<T>(obj: T): boolean

    // core/util/array.ts
    export function copy<T>(array: T[]): T[]
    export function concat<T>(arrays: T[][]): T[]
    export function contains<T>(array: T[], value: T): boolean
    export function nth<T>(array: T[], index: number): T
    export function zip<A, B>(As: A[], Bs: B[]): [A, B][]
    export function unzip<A, B>(ABs: [A, B][]): [A[], B[]]
    export function range(start: number, stop?: number, step?: number): number[]
    export function linspace(start: number, stop: number, num: number): number[]
    export function transpose<T>(array: T[][]): T[][]
    export function sum(array: number[]): number
    export function cumsum(array: number[]): number[]
    export function min(array: number[]): number
    export function minBy<T>(array: T[], key: (item: T) => number): T
    export function max(array: number[]): number
    export function maxBy<T>(array: T[], key: (item: T) => number): T
    export function argmin(array: number[]): number
    export function argmax(array: number[]): number
    export function all<T>(array: T[], predicate: (item: T) => boolean): boolean
    export function any<T>(array: T[], predicate: (item: T) => boolean): boolean
    export function findIndex<T>(array: T[], predicate: (item: T) => boolean): number
    export function findLastIndex<T>(array: T[], predicate: (item: T) => boolean): number
    export function sortedIndex<T>(array: T[], value: T): number
    export function sortBy<T>(array: T[], key: (item: T) => number): T[]
    export function uniq<T>(array: T[]): T[]
    export function uniqBy<T, U>(array: T[], key: (item: T) => U): T[]
    export function union<T>(...arrays: T[][]): T[]
    export function intersection<T>(array: T[], ...arrays: T[][]): T[]
    export function difference<T>(array: T[], ...arrays: T[][]): T[]

    // core/util/string.ts
    export function startsWith(str: string, searchString: string, position: number): boolean
    export function uniqueId(prefix?: string): string
    export function escape(s: string): string

    // core/util/types.ts
    export function isBoolean(obj: any): obj is boolean
    export function isNumber(obj: any): obj is number
    export function isString(obj: any): obj is string
    export function isStrictNaN(obj: any): obj is number
    export function isFunction(obj: any): obj is Function
    export function isArray<T>(obj: any): obj is T[]
    export function isObject(obj: any): obj is Object

    // core/util/eq.ts
    export function isEqual(a: any, b: any): boolean
  }
}
