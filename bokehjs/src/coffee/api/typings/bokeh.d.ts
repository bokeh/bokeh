declare namespace Bokeh {
  var version: string;

  var index: Map<View<LayoutDOM>>;

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
    // core/util/object.ts
    export function keys<T>(object: T): Array<string>
    export function values<T>(object: {[key: string]: T}): Array<T>
    export function extend<T, T1>(dest: T, source: T1): T & T1
    export function extend<R>(dest: any, ...sources: Array<any>): R
    export function clone<T>(obj: T): T
    export function isEmpty<T>(obj: T): boolean

    // core/util/array.ts
    export function copy<T>(array: Array<T>): Array<T>
    export function concat<T>(arrays: Array<Array<T>>): Array<T>
    export function contains<T>(array: Array<T>, value: T): boolean
    export function nth<T>(array: Array<T>, index: number): T
    export function zip<A, B>(As: Array<A>, Bs: Array<B>): Array<[A, B]>
    export function unzip<A, B>(ABs: Array<[A, B]>): [Array<A>, Array<B>]
    export function range(start: number, stop?: number, step?: number): Array<number>
    export function linspace(start: number, stop: number, num: number): Array<number>
    export function transpose<T>(array: Array<Array<T>>): Array<Array<T>>
    export function sum(array: Array<number>): number
    export function cumsum(array: Array<number>): Array<number>
    export function min(array: Array<number>): number
    export function minBy<T>(array: Array<T>, key: (item: T) => number): T
    export function max(array: Array<number>): number
    export function maxBy<T>(array: Array<T>, key: (item: T) => number): T
    export function argmin(array: Array<number>): number
    export function argmax(array: Array<number>): number
    export function all<T>(array: Array<T>, predicate: (item: T) => boolean): boolean
    export function any<T>(array: Array<T>, predicate: (item: T) => boolean): boolean
    export function findIndex<T>(array: Array<T>, predicate: (item: T) => boolean): number
    export function findLastIndex<T>(array: Array<T>, predicate: (item: T) => boolean): number
    export function sortedIndex<T>(array: Array<T>, value: T): number
    export function sortBy<T>(array: Array<T>, key: (item: T) => number): Array<T>
    export function uniq<T>(array: Array<T>): Array<T>
    export function uniqBy<T, U>(array: Array<T>, key: (item: T) => U): Array<T>
    export function union<T>(...arrays: Array<Array<T>>): Array<T>
    export function intersection<T>(array: Array<T>, ...arrays: Array<Array<T>>): Array<T>
    export function difference<T>(array: Array<T>, ...arrays: Array<Array<T>>): Array<T>

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
    export function isArray<T>(obj: any): obj is Array<T>
    export function isObject(obj: any): obj is Object

    // core/util/eq.ts
    export function isEqual(a: any, b: any): boolean
  }
}
