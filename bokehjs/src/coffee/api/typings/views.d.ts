declare namespace Bokeh {
    interface BokehView<ModelType extends Model> {
        model: ModelType;
    }

    type View<ModelType extends Model> = BokehView<ModelType>;
}
