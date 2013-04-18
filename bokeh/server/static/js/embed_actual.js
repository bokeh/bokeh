

function addPlotWrap(settings){
    addPlot(settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);
};
function addPlot(modelid, modeltype, element) {
    console.log("addPlot");
    var view;
    base = require("./base")
    console.log(modelid, modeltype, element);
    base.load_models(window.Bokeh.models);
    var model = base.Collections(modeltype).get(modelid);
    window.model=model;
    var view = new model.default_view(
        {model : model}
    );
    window.view = view;
    view.render()
    _.delay(function(){
        $(element).append(view.$el)
    },
            1000);

};
window.addPlotWrap = addPlotWrap;
