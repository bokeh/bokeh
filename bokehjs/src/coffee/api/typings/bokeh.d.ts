declare namespace Bokeh {
    var version: string;

    var index: Map<View<LayoutDOM>>;

    var _: UnderscoreStatic;
    var $: JQueryStatic;

    var logger: JSNLog.JSNLogLogger;

    type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    function set_log_level(level: LogLevel): void;

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
