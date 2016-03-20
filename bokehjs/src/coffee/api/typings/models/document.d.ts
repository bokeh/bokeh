declare namespace Bokeh {
    type JsObj = {[key: string]: any};

    export interface Document {
        constructor(): void;

        clear(): void;
        roots(): Array<Model>;
        add_root(model: Model): void;
        remove_root(model: Model): void;

        title(): string;
        set_title(title: string): void;
        get_model_by_id(model_id: string): Model;
        get_model_by_name(name: string): Model;

        on_change(callback: (event: DocumentChangedEvent) => void): void;
        remove_on_change(callback: (event: DocumentChangedEvent) => void): void;

        to_json_string(include_defaults?: boolean): string;
        to_json(include_defaults?: boolean): JsObj;
    }

    interface DocumentStatic {
        from_json_string(s: string): Document;
        from_json(json: JsObj): Document;
    }

    export var Document: DocumentStatic;

    export interface DocumentChangedEvent {}

    export interface ModelChangedEvent extends DocumentChangedEvent {
        constructor(document: Document, model: Model, attr: string, old: any, new_: any): void;
    }

    export interface TitleChangedEvent extends DocumentChangedEvent {
        constructor(document: Document, title: string): void;
    }

    export interface RootAddedEvent extends DocumentChangedEvent {
        constructor(document: Document, model: Model): void;
    }

    export interface RootRemovedEvent extends DocumentChangedEvent {
        constructor(document: Document, model: Model): void;
    }
}
