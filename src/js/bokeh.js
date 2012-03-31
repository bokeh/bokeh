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

    //BokehView
    var BokehView = Backbone.View.extend({
	initialize : function(options){
	    var self = this;
	    if (!_(options).has('id')){
		self.id = _.uniqueId('BokehView');
	    }
	},
	tag_id : function(tag){
	    return "tag" + "-" + this.id;
	},
	tag_el : function(tag){
	    return $("#" + this.tag_id());
	},
	tag_d3 : function(tag){
	    return d3.select("#" + this.tag_id());
	},
    });


    //ObjectArrayDataSource (may want general data source later)
    var HasReference = Backbone.Model.extend({
	type : null,
	ref : function(){
	    return {'type' : this.type,
		    'id' : this.id};
	}
    });

    var ObjectArrayDataSource = HasReference.extend({	
    });

    //hasparent
    var HasParent = HasReference.extend({
	initialize : function(attrs, options){
	    var self = this;
	    if (!_.isNullOrUndefined(attrs['parent'])){
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


    //Component
    var Component = HasParent.extend({
	defaults : {
	    width : 200,
	    height : 200,
	    position : 0,
	    parent : null
	}
    });

    
    //Plot
    var Plot = Component.extend({
	type : Plot,
    });
    _.extend(Plot.prototype.defaults, 
	     {'data_sources' : {},
	      'renderers' : [],
	      'legends' : [],
	      'tools' : [],
	      'overlays' : [],
	      'background-color' : "#fff",
	      'neutral-color' : "#aaa"
	     });


    //PlotView
    var PlotView = BokehView.extend({
	initialize : function(){
	    var self = this;
	    var view, model, model_id, options;
	    self.renderers = {};
	    _(self.model.renderers).each(function(spec){
		model_id = spec['id'];
		model = Bokeh.Collections[spec['type']].get(model_id);
		options = _.clone(spec['options'])['el'] = self.el;
		view = new Bokeh.Views[spec['type']](options);
		self.renderers[view.id] = view;
	    });
	},
	render : function(){
	    var self = this;
	    var width = self.model.get('width')
	    var height = self.model.get('height')
	    console.log([width, height]);

	    d3.select(self.el).append('svg')
	    	.attr("width", width)
		.attr("height", height)
		.append('rect')
		.attr('fill', self.model.get('background-color'))
		.attr('stroke', self.model.get('neutral-color'))
		.attr("width", width)
		.attr("height", height);
	    	    
	    	// .attr("width", self.model.get('width'))
		// .attr("height", self.model.get('height'));
	    _(self.renderers).each(function(view){view.render()});
	    if (!self.model.get('parent')){
		self.$el.dialog();
	    }
	    console.log('ok');
	}
    });
    
    //ScatterRenderer
    var ScatterRenderer = Component.extend({
	type : 'ScatterRenderer'
    });

    //GridPlotContainer
    var GridPlotContainer = Component.extend({
	type : "GridPlotContainer",
	defaults : {
	    rows: 0,
	    columns : 0,
	    children : [[]]
	}
    });
    _.extend(GridPlotContainer.prototype.defaults, 
	     {'shape' : [0,0]});

    var GridPlotContainerView = BokehView.extend({
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

    //RegisterModels
    var Plots = Backbone.Collection.extend({
	model : Plot,
	url : "/",
    });

    var ScatterRenderers = Backbone.Collection.extend({
	model : ScatterRenderer,
	url : "/",
    });

    var ObjectArrayDataSources = Backbone.Collection.extend({
	model : ObjectArrayDataSource,
	url : "/",
    });

    Bokeh.register_collection('Plot', new Plots());
    Bokeh.register_collection('ScatterRenderer', new ScatterRenderers());
    Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources());


    Bokeh.ObjectArrayDataSource = ObjectArrayDataSource;
    Bokeh.HasParent = HasParent;
    Bokeh.Component = Component;
    Bokeh.Plot = Plot;

    Bokeh.BokehView = BokehView;
    Bokeh.PlotView = PlotView;
    
    
})();