declare namespace Bokeh {
 interface ViewOptions<ModelType extends Model> {
   model: ModelType;
   id?: string;
   el?: HTMLElement | JQuery;
  }

  class BokehView<ModelType extends Model> {
    constructor(options?: ViewOptions<ModelType>);

    model: ModelType;
    id: string;
    el: HTMLElement;
    $el: JQuery;

    render(): this;
    remove(): this;
  }

  type View<ModelType extends Model> = BokehView<ModelType>;
}
