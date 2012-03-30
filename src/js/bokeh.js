(function(){
    var Bokeh
    if (this.Bokeh){
	Bokeh = this.Bokeh;
    }else{
	Bokeh = {};
	this.Bokeh = Bokeh;
    }
    Bokeh.Collections = {}
    Bokeh.register_collection = function(key, value){
	Bokeh.Collections[key] = value;
	value.bokeh_key = key;
    }
    var HasParent = Backbone.Model.extend({
	initialize : function(attrs, options){
	    var self = this;
	    if (_.has(attrs, 'parent')){
		self.parent_id = attrs['parent']['id'];
		self.parent_type = attrs['parent']['type'];
		var parent = self.get_parent();
		_.each(parent.parent_properties, function(prop_name){
		    if (parent.get(prop_name) && !_.has(attrs, prop_name)){
			self.set(prop_name, parent.get(prop_name));
		    }
		});
	    }
	},
	get_parent : function(){
	    var self = this;
	    return Bokeh.Collections[self.parent_type].get(self.parent_id);
	}
    });
    Bokeh.HasParent = HasParent;

    var Component = HasParent.extend({
	defaults : {
	    width : 0,
	    height : 0,
	    position : 0,
	    parent : null
	}
    });
    Bokeh.Component = Component;
    
    var Plot = Component.extend({
	defaults : {
	    data_sources : {}
	}
    });
    _.extend({'data_sources' : [0,0],
	      'renderers' : [],
	      'legends' : [],
	      'tools' : [],
	      'overlays' : []
	     }, Plot.prototype.defaults);
    Bokeh.Plot = Plot;


    var GridPlotContainer = Component.extend({
	defaults : {
	    rows: 0,
	    columns : 0,
	    children : [[]]
	}
    });
    _.extend({'shape' : [0,0]}, GridPlotContainer.prototype.defaults);

    Bokeh.GridPlotContainerView = Backbone.View.extend({
	render: function(){
	    var self = this;
	    var row;
	    self.$el = $(self.el);
	    self.$el.append("<table></table>");
	    _.each(_.range(self.model.get('rows')), function(xidx){
		row = $("<tr></tr>");
		_.each(_.range(self.model.get('columns')), function(yidx){
		    
		});
	    });

	}
    });
})();