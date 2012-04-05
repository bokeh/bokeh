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
		self.attributes['id'] = self.id;
	    }
	},
	ref : function(){
	    return {'type' : this.type,
		    'id' : this.id};
	},
	resolve_ref : function(ref){
	    var self = this;
	    return Bokeh.Collections[ref['type']].get(ref['id']);
	},
	get_ref : function(ref_name){
	    return this.resolve_ref(this.get(ref_name));
	}
    });

    //ObjectArrayDataSource (may want general data source later)
    var ObjectArrayDataSource = HasReference.extend({	
	type : 'ObjectArrayDataSource',
	defaults : {
	    'data' : [{}]
	}
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
	    HasReference.prototype.initialize.call(self, attrs, options);
	    if (!_.isNullOrUndefined(attrs['parent'])){
		self.parent = self.get_ref('parent');
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
	type : 'Plot',
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
		options = _.extend({}, spec['options'], {'el' : self.el,
							 'model' : model});
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

    var Range1d = HasReference.extend({
	type : 'Range1d',
	defaults:{
	    start : 0,
	    end : 1
	}
    });
    
    var Mapper = HasReference.extend({
	defaults : {},
	display_defaults : {},
	map_screen : function(data){
	}
    });
    
    var LinearMapper = Mapper.extend({
	type : 'LinearMapper',
	defaults : {
	    //both should be Range1d objects
	    data_range : null,
	    screen_range : null
	},
	initialize : function(attrs, options){
	    Mapper.prototype.initialize.call(this, attrs, options);
	    var data_range = this.get_ref('data_range');
	    var screen_range = this.get_ref('screen_range');
	    this.scale = d3.scale
		.linear()
		.domain([data_range.get('start'), data_range.get('end')])
		.range([screen_range.get('start'), screen_range.get('end')]);
	},
	map_screen : function(data){
	    return this.scale(data);
	}
    });

    //ScatterRenderer
    var ScatterRendererView = BokehView.extend({
	render : function(){
	    var self =  this;
	    var model = this.model;
	    var svg = d3.select(self.el).select('svg').append('g')
	    	.attr('id', self.tag_id('g'))
		.selectAll(model.get('mark'))
		.data(model.get_ref('data_source').get('data'))
		.enter()
		.append(model.get('mark'))
		.attr('cx', function(d){
		    return model.resolve_ref(model.get('xmapper'))
			.map_screen(d[model.get('xfield')]);
		})
		.attr('cy', function(d){
		    return model.resolve_ref(model.get('ymapper'))
			.map_screen(d[model.get('yfield')]);
		})
		.attr('r', model.get('radius'))
		.attr('fill', model.get('foreground-color'));
	}
    });

    var ScatterRenderer = Component.extend({
	type : 'ScatterRenderer',
	default_view : ScatterRendererView
    });
    _.extend(ScatterRenderer.prototype.defaults,
	     {
		 data_source : null,
		 xmapper : null,
		 ymapper: null,
		 xfield : '',
		 yfield : '',
		 mark : 'circle',
	     });
    _.extend(ScatterRenderer.prototype.display_defaults, 
	     {
		 radius : 3
	     });
    
    //GridPlotContainer - doesn't work yet
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

    var Range1ds = Backbone.Collection.extend({
	model : Range1d,
	url: "/"
    });
    var LinearMappers = Backbone.Collection.extend({
	model : LinearMapper,
	url : "/"
    });
    
    Bokeh.register_collection('Plot', new Plots());
    Bokeh.register_collection('ScatterRenderer', new ScatterRenderers());
    Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources());
    Bokeh.register_collection('Range1d', new Range1ds());
    Bokeh.register_collection('LinearMapper', new LinearMappers());

    Bokeh.ObjectArrayDataSource = ObjectArrayDataSource;
    Bokeh.HasParent = HasParent;
    Bokeh.Component = Component;
    Bokeh.Plot = Plot;
    Bokeh.ScatterRenderer = ScatterRenderer;
    Bokeh.BokehView = BokehView;
    Bokeh.PlotView = PlotView;
    
    
})();