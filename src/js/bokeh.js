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
    //Regular backbone view, except, it gets assigned an id.
    //this id can be used to auto-create html ids, and pull out
    //d3, and jquery nodes based on those dom elements

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

    //HasReference
    //Backbone model, which can output a reference (combination of type, and id)
    //also auto creates an id on init, if one isn't passed in.
    var HasReference = Backbone.Model.extend({
	type : null,
	initialize : function(attrs, options){
	    var self = this;
	    if (!_(attrs).has('id')){
		self.id = _.uniqueId(self.type);
	    }
	},
	ref : function(){
	    return {'type' : this.type,
		    'id' : this.id};
	}
    });

    //ObjectArrayDataSource (may want general data source later)
    var ObjectArrayDataSource = HasReference.extend({	
    });

    //hasparent
    //display_options can be passed down to children
    //defaults for display_options should be placed 
    //in a class var display_defaults
    //the get function, will resolve an instances defaults first
    //then check the parents actual val, and finally check class defaults.
    //display options cannot go into defaults

    var HasParent = HasReference.extend({
	initialize : function(attrs, options){
	    var self = this;
	    if (!_.isNullOrUndefined(attrs['parent'])){
		self.parent_id = attrs['parent']['id'];
		self.parent_type = attrs['parent']['type'];
		self.parent = self.get_parent();
	    }
	},
	get_parent : function(){
	    var self = this;
	    return Bokeh.Collections[self.parent_type].get(self.parent_id);
	},
	get : function(attr){
	    var self = this
	    if (_.has(self.attributes, attr)){
		return self.attributes[attr];
	    }else if (
		!_.isUndefined(self.parent) &&
		_.indexOf(self.parent.parent_properties, attr) >= 0 && 
		    !_.isUndefined(self.parent.get(attr))){
		return self.parent.get(attr);
	    }else if (_.has(self.display_defaults, attr)){
		return self.display_defaults[attr];
	    }
	},
	display_defaults: {}
    });


    //Component
    var Component = HasParent.extend({
	defaults : {
	    parent : null
	},
	display_defaults : {
	    width : 200,
	    height : 200,
	    position : 0,
	},
	default_view : null
    });

    
    //Plot
    var Plot = Component.extend({
	type : Plot,
    });
    _.extend(Plot.prototype.defaults, 
	     {
		 'data_sources' : {},
		 'renderers' : [],
		 'legends' : [],
		 'tools' : [],
		 'overlays' : []
	     });
    _.extend(Plot.prototype.display_defaults, 
	     {
		 'background-color' : "#fff",
		 'foreground-color' : "#aaa"
	     });


    //PlotView
    var PlotView = BokehView.extend({
	initialize : function(options){
	    var self = this;
	    BokehView.prototype.initialize.call(self, options);
	    var view, model, model_id, options;
	    self.renderers = {};
	    _(self.model.get('renderers')).each(function(spec){
		model_id = spec['id'];
		model = Bokeh.Collections[spec['type']].get(model_id);
		options = _.extend({}, spec['options'], {'el' : self.el});
		view = new model.default_view(options);
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
		.attr('stroke', self.model.get('foreground-color'))
		.attr("width", width)
		.attr("height", height);
	    _(self.renderers).each(function(view){view.render()});
	    if (!self.model.get('parent')){
		self.$el.dialog();
	    }
	    console.log('ok');
	}
    });
    
    //ScatterRenderer
    var ScatterRendererView = BokehView.extend({
	render : function(){
	    var self =  this;
	    var svg = d3.select(self.el).select('svg').append('g')
		.attr('id', self.tag_id('g'))
		.append('circle').attr('cx');
	}
    });

    var ScatterRenderer = Component.extend({
	defaults : {
	    data_source : null,
	    xfield : '',
	    yfield : '',
	    mark : 'circle',
	},
	type : 'ScatterRenderer',
	default_view : ScatterRendererView
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