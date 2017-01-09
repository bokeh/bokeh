declare namespace Bokeh {

  export var Document: {
    new(attributes?: IDocument): Document

    from_json_string(s: string): Document;
    from_json(json: JsObj): Document;
  }
  export interface Document extends IDocument {
    clear(): void;
    roots(): Array<Model>;
    add_root(model: Model): void;
    remove_root(model: Model): void;
    resize(): void;

    title(): string;
    set_title(title: string): void;
    get_model_by_id(model_id: string): Model;
    get_model_by_name(name: string): Model;

    on_change(callback: (event: DocumentChangedEvent) => void): void;
    remove_on_change(callback: (event: DocumentChangedEvent) => void): void;

    to_json_string(include_defaults?: boolean): string;
    to_json(include_defaults?: boolean): JsObj;
  }
  export interface IDocument {}

  export interface DocumentChangedEvent {
    document: Document;
  }

  export interface ModelChangedEvent extends DocumentChangedEvent {
    model: Model;
    attr: string;
    old: any;
    new_: any;
  }

  export interface TitleChangedEvent extends DocumentChangedEvent {
    title: string;
  }

  export interface RootAddedEvent extends DocumentChangedEvent {
    model: Model;
  }

  export interface RootRemovedEvent extends DocumentChangedEvent {
    model: Model;
  }
}
