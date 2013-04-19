
(function() {
    function addPlotWrap(settings){

        addPlot(settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);
    };
    function addPlot(modelid, modeltype, element) {
        console.log("addPlot");
        var view;
        var base = require("./base");
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
        }, 0);

    };


    function addDirectPlotWrap(settings){
        addDirectPlot(
            settings.bokeh_docid, settings.bokeh_ws_conn_string, 
            settings.bokeh_docapikey, settings.bokeh_root_url,  
            settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);
    };

    function serverLoad(docid, ws_conn_string, docapikey, root_url) {
        var utility = require("./serverutils").utility;
        var headers = {'BOKEH-API-KEY' : docapikey };
        $.ajaxSetup({'headers' : headers});
        var base = require("./base")
        var BokehConfig = base.Config;
        BokehConfig.prefix = root_url;
        BokehConfig.ws_conn_string = ws_conn_string;
        //utility.load_doc(docid)
        return utility.load_doc_once(docid);
    };
    function addDirectPlot(

        docid, ws_conn_string, docapikey, 
        root_url, modelid, modeltype, element) {
        var base = require("./base");
        serverLoad(docid, ws_conn_string, docapikey, root_url).done(
            function () {
                console.log("addPlot");
                var view;
                console.log(modelid, modeltype, element);
                var plot_collection = base.Collections(modeltype);
                var model = plot_collection.get(modelid);
                window.model=model;
                var view = new model.default_view({model : model});
                window.view = view;
                view.render()
                _.delay(function(){
                    $(element).append(view.$el)
                },0);
            });

    };



    window.addPlotWrap = addPlotWrap;
    window.addDirectPlotWrap = addDirectPlotWrap;
}());
