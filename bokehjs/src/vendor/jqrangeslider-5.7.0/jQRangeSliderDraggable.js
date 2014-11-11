/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($, undefined){
	"use strict";

	$.widget("ui.rangeSliderDraggable", $.ui.rangeSliderMouseTouch, {
		cache: null,

		options: {
			containment: null
		},

		_create: function(){
			$.ui.rangeSliderMouseTouch.prototype._create.apply(this);

			setTimeout($.proxy(this._initElementIfNotDestroyed, this), 10);
		},

		destroy: function(){
			this.cache = null;
			
			$.ui.rangeSliderMouseTouch.prototype.destroy.apply(this);
		},

		_initElementIfNotDestroyed: function(){
			if (this._mouseInit){
				this._initElement();
			}
		},

		_initElement: function(){
			this._mouseInit();
			this._cache();
		},

		_setOption: function(key, value){
			if (key === "containment"){
				if (value === null || $(value).length === 0){
					this.options.containment = null
				}else{
					this.options.containment = $(value);
				}
			}
		},

		/*
		 * UI mouse widget
		 */

		_mouseStart: function(event){
			this._cache();
			this.cache.click = {
					left: event.pageX,
					top: event.pageY
			};

			this.cache.initialOffset = this.element.offset();

			this._triggerMouseEvent("mousestart");

			return true;
		},

		_mouseDrag: function(event){
			var position = event.pageX - this.cache.click.left;

			position = this._constraintPosition(position + this.cache.initialOffset.left);

			this._applyPosition(position);

			this._triggerMouseEvent("sliderDrag");

			return false;
		},

		_mouseStop: function(){
			this._triggerMouseEvent("stop");
		},

		/*
		 * To be overriden
		 */

		_constraintPosition: function(position){
			if (this.element.parent().length !== 0 && this.cache.parent.offset !== null){
				position = Math.min(position, 
					this.cache.parent.offset.left + this.cache.parent.width - this.cache.width.outer);
				position = Math.max(position, this.cache.parent.offset.left);
			}

			return position;
		},

		_applyPosition: function(position){
			var offset = {
				top: this.cache.offset.top,
				left: position
			}

			this.element.offset({left:position});

			this.cache.offset = offset;
		},

		/*
		 * Private utils
		 */

		_cacheIfNecessary: function(){
			if (this.cache === null){
				this._cache();
			}
		},

		_cache: function(){
			this.cache = {};

			this._cacheMargins();
			this._cacheParent();
			this._cacheDimensions();

			this.cache.offset = this.element.offset();
		},

		_cacheMargins: function(){
			this.cache.margin = {
				left: this._parsePixels(this.element, "marginLeft"),
				right: this._parsePixels(this.element, "marginRight"),
				top: this._parsePixels(this.element, "marginTop"),
				bottom: this._parsePixels(this.element, "marginBottom")
			};
		},

		_cacheParent: function(){
			if (this.options.parent !== null){
				var container = this.element.parent();

				this.cache.parent = {
					offset: container.offset(),
					width: container.width()
				}
			}else{
				this.cache.parent = null;
			}
		},

		_cacheDimensions: function(){
			this.cache.width = {
				outer: this.element.outerWidth(),
				inner: this.element.width()
			}
		},

		_parsePixels: function(element, string){
			return parseInt(element.css(string), 10) || 0;
		},

		_triggerMouseEvent: function(event){
			var data = this._prepareEventData();

			this.element.trigger(event, data);
		},

		_prepareEventData: function(){
			return {
				element: this.element,
				offset: this.cache.offset || null
			};
		}
	});

}(jQuery));