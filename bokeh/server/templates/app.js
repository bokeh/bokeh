window.{{ modulename }} = {};
{{ modulename }} = window.{{ modulename }};
{{ modulename }}.main = function(){
  {{ classname }}View  = Bokeh.{{ parentname }}.View.extend({
  });
  {{ classname }} = Bokeh.{{ parentname }}.Model.extend({
    type : "{{classname}}",
    default_view : {{ classname }}View
  });
  {{ classname }}s = Bokeh.Backbone.Collection.extend({
    model : {{ classname }}
  });
  Bokeh.Collections.register("{{ classname }}", new {{classname}}s ());
}
