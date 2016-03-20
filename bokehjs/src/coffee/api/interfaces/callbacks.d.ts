declare namespace Bokeh {
export interface Callback extends Model {}

export interface OpenURL extends Callback {
    url: string;
}

export interface CustomJS extends Callback {
    args: {[key: string]: Model};
    code: string;
    lang: ScriptingLanguage;
}
}
