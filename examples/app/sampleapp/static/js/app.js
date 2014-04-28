window.sampleapp = {};
sampleapp = window.sampleapp;
sampleapp.main = function(){
  AppView = Bokeh.ContinuumView.View.extend({
    initialize : function () {
      this.render();
      window.appview = this;
      this.listenTo(this.model, 'change:stats', this.render_text)
    },
    render : function(){
      var plotmodel = this.mget_obj('scatter_plot');
      var view = new plotmodel.default_view({model : plotmodel});
      this.view = view;
      $('#plot').append(view.el);
      this.render_text()
    },
    render_text : function(){
      stats = this.mget('stats');
      $('#stats').text(stats);
    }
  });
  App = Bokeh.HasProperties.extend({
    default_view : AppView,
    type : 'App'
  });

  Apps = Backbone.Collection.extend({
    model : App
  });
  apps = new Apps()
  Bokeh.Collections.register("App", apps)
}
