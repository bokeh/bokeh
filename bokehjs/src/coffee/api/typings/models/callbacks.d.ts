declare namespace Bokeh {
    export interface Callback extends Model {}

    export var OpenURL: { new(attributes?: KeyVal, options?: KeyVal): OpenURL };
    export interface OpenURL extends Callback {
        url: string;
    }

    export var CustomJS: { new(attributes?: KeyVal, options?: KeyVal): CustomJS };
    export interface CustomJS extends Callback {
        args: {[key: string]: Model};
        code: string;
        lang: ScriptingLanguage;
    }
}
