/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */

(function($, undefined){
	"use strict";

	$.widget("ui.rangeSliderBar", $.ui.rangeSliderDraggable, {
		options: {
			leftHandle: null,
			rightHandle: null,
			bounds: {min: 0, max: 100},
			type: "rangeSliderHandle",
			range: false,
			drag: function() {},
			stop: function() {},
			values: {min: 0, max:20},
			wheelSpeed: 4,
			wheelMode: null
		},

		_values: {min: 0, max: 20},
		_waitingToInit: 2,
		_wheelTimeout: false,

		_create: function(){
			$.ui.rangeSliderDraggable.prototype._create.apply(this);

			this.element
				.css("position", "absolute")
				.css("top", 0)
				.addClass("bk-ui-rangeSlider-bar");

			this.options.leftHandle
				.bind("initialize", $.proxy(this._onInitialized, this))
				.bind("mousestart", $.proxy(this._cache, this))
				.bind("stop", $.proxy(this._onHandleStop, this));

			this.options.rightHandle
				.bind("initialize", $.proxy(this._onInitialized, this))
				.bind("mousestart", $.proxy(this._cache, this))
				.bind("stop", $.proxy(this._onHandleStop, this));

			this._bindHandles();

			this._values = this.options.values;
			this._setWheelModeOption(this.options.wheelMode);
		},

		destroy: function(){
			this.options.leftHandle.unbind(".bar");
			this.options.rightHandle.unbind(".bar");
			this.options = null;

			$.ui.rangeSliderDraggable.prototype.destroy.apply(this);
		},

		_setOption: function(key, value){
			if (key === "range"){
				this._setRangeOption(value);
			} else if (key === "wheelSpeed"){
				this._setWheelSpeedOption(value);
			} else if (key === "wheelMode"){
				this._setWheelModeOption(value);
			}
		},

		_setRangeOption: function(value){
			if (typeof value !== "object" || value === null){
				value = false;
			}

			if (value === false && this.options.range === false){
				return;
			}

			if (value !== false){
				var min = valueOrFalse(value.min, this.options.range.min),
					max = valueOrFalse(value.max, this.options.range.max);

				this.options.range = {
					min: min,
					max: max
				};
			}else{
				this.options.range = false;
			}

			this._setLeftRange();
			this._setRightRange();
		},

		_setWheelSpeedOption: function(value){
			if (typeof value === "number" && value > 0){
				this.options.wheelSpeed = value;
			}
		},

		_setWheelModeOption: function(value){
			if (value === null || value === false || value === "zoom" || value === "scroll"){
				if (this.options.wheelMode !== value){
					this.element.parent().unbind("mousewheel.bar");
				}

				this._bindMouseWheel(value);
				this.options.wheelMode = value;
			}
		},

		_bindMouseWheel: function(mode){
			if (mode === "zoom"){
				this.element.parent().bind("mousewheel.bar", $.proxy(this._mouseWheelZoom, this));
			}else if (mode === "scroll"){
				this.element.parent().bind("mousewheel.bar", $.proxy(this._mouseWheelScroll, this));
			}
		},

		_setLeftRange: function(){
			if (this.options.range === false){
				return false;
			}

			var rightValue = this._values.max,
				leftRange = {min: false, max: false};

			if (typeof this.options.range.min !== "undefined" && this.options.range.min !== false){
				leftRange.max = this._leftHandle("substract", rightValue, this.options.range.min);
			}else{
				leftRange.max = false;
			}

			if (typeof this.options.range.max !== "undefined" && this.options.range.max !== false){
				leftRange.min = this._leftHandle("substract", rightValue, this.options.range.max);
			}else{
				leftRange.min = false;
			}

			this._leftHandle("option", "range", leftRange);
		},

		_setRightRange: function(){
			var leftValue = this._values.min,
				rightRange = {min: false, max:false};

			if (typeof this.options.range.min !== "undefined" && this.options.range.min !== false){
				rightRange.min = this._rightHandle("add", leftValue, this.options.range.min);
			}else {
				rightRange.min = false;
			}

			if (typeof this.options.range.max !== "undefined" && this.options.range.max !== false){
				rightRange.max = this._rightHandle("add", leftValue, this.options.range.max);
			}else{
				rightRange.max = false;
			}

			this._rightHandle("option", "range", rightRange);
		},

		_deactivateRange: function(){
			this._leftHandle("option", "range", false);
			this._rightHandle("option", "range", false);
		},

		_reactivateRange: function(){
			this._setRangeOption(this.options.range);
		},

		_onInitialized: function(){
			this._waitingToInit--;

			if (this._waitingToInit === 0){
				this._initMe();
			}
		},

		_initMe: function(){
			this._cache();
			this.min(this._values.min);
			this.max(this._values.max);

			var left = this._leftHandle("position"),
				right = this._rightHandle("position") + this.options.rightHandle.width();

			this.element.offset({
				left: left
			});

			this.element.css("width", right - left);
		},

		_leftHandle: function(){
			return this._handleProxy(this.options.leftHandle, arguments);
		},

		_rightHandle: function(){
			return this._handleProxy(this.options.rightHandle, arguments);
		},

		_handleProxy: function(element, args){
			var array = Array.prototype.slice.call(args);

			return element[this.options.type].apply(element, array);
		},

		/*
		 * Draggable
		 */

		_cache: function(){
			$.ui.rangeSliderDraggable.prototype._cache.apply(this);

			this._cacheHandles();
		},

		_cacheHandles: function(){
			this.cache.rightHandle = {};
			this.cache.rightHandle.width = this.options.rightHandle.width();
			this.cache.rightHandle.offset = this.options.rightHandle.offset();

			this.cache.leftHandle = {};
			this.cache.leftHandle.offset = this.options.leftHandle.offset();
		},

		_mouseStart: function(event){
			$.ui.rangeSliderDraggable.prototype._mouseStart.apply(this, [event]);

			this._deactivateRange();
		},

		_mouseStop: function(event){
			$.ui.rangeSliderDraggable.prototype._mouseStop.apply(this, [event]);

			this._cacheHandles();

			this._values.min = this._leftHandle("value");
			this._values.max = this._rightHandle("value");
			this._reactivateRange();

			this._leftHandle().trigger("stop");
			this._rightHandle().trigger("stop");
		},

		/*
		 * Event binding
		 */

		_onDragLeftHandle: function(event, ui){
			this._cacheIfNecessary();

			if (ui.element[0] !== this.options.leftHandle[0]){
				return;
			}

			if (this._switchedValues()){
				this._switchHandles();
				this._onDragRightHandle(event, ui);
				return;
			}

			this._values.min = ui.value;
			this.cache.offset.left = ui.offset.left;
			this.cache.leftHandle.offset = ui.offset;

			this._positionBar();
		},

		_onDragRightHandle: function(event, ui){
			this._cacheIfNecessary();

			if (ui.element[0] !== this.options.rightHandle[0]){
				return;
			}

			if (this._switchedValues()){
				this._switchHandles();
				this._onDragLeftHandle(event, ui);
				return;
			}

			this._values.max = ui.value;
			this.cache.rightHandle.offset = ui.offset;

			this._positionBar();
		},

		_positionBar: function(){
			var width = this.cache.rightHandle.offset.left + this.cache.rightHandle.width - this.cache.leftHandle.offset.left;
			this.cache.width.inner = width;

			this.element
				.css("width", width)
				.offset({left: this.cache.leftHandle.offset.left});
		},

		_onHandleStop: function(){
			this._setLeftRange();
			this._setRightRange();
		},

		_switchedValues: function(){
			if (this.min() > this.max()){
				var temp = this._values.min;
				this._values.min = this._values.max;
				this._values.max = temp;

				return true;
			}

			return false;
		},

		_switchHandles: function(){
			var temp = this.options.leftHandle;

			this.options.leftHandle = this.options.rightHandle;
			this.options.rightHandle = temp;

			this._leftHandle("option", "isLeft", true);
			this._rightHandle("option", "isLeft", false);

			this._bindHandles();
			this._cacheHandles();
		},

		_bindHandles: function(){
			this.options.leftHandle
				.unbind(".bar")
				.bind("sliderDrag.bar update.bar moving.bar", $.proxy(this._onDragLeftHandle, this));

			this.options.rightHandle
				.unbind(".bar")
				.bind("sliderDrag.bar update.bar moving.bar", $.proxy(this._onDragRightHandle, this));
		},

		_constraintPosition: function(left){
			var position = {},
				right;

			position.left = $.ui.rangeSliderDraggable.prototype._constraintPosition.apply(this, [left]);

			position.left = this._leftHandle("position", position.left);

			right = this._rightHandle("position", position.left + this.cache.width.outer - this.cache.rightHandle.width);
			position.width = right - position.left + this.cache.rightHandle.width;

			return position;
		},

		_applyPosition: function(position){
			$.ui.rangeSliderDraggable.prototype._applyPosition.apply(this, [position.left]);
			this.element.width(position.width);
		},

		/*
		 * Mouse wheel
		 */

		_mouseWheelZoom: function(event, delta, deltaX, deltaY){
			/*jshint maxstatements:17*/
			if (!this.enabled){
				return false;
			}

			var middle = this._values.min + (this._values.max - this._values.min) / 2,
				leftRange = {},
				rightRange = {};

			if (this.options.range === false || this.options.range.min === false){
				leftRange.max = middle;
				rightRange.min = middle;
			} else {
				leftRange.max = middle - this.options.range.min / 2;
				rightRange.min = middle + this.options.range.min / 2;
			}

			if (this.options.range !== false && this.options.range.max !== false){
				leftRange.min = middle - this.options.range.max / 2;
				rightRange.max = middle + this.options.range.max / 2;
			}

			this._leftHandle("option", "range", leftRange);
			this._rightHandle("option", "range", rightRange);

			clearTimeout(this._wheelTimeout);
			this._wheelTimeout = setTimeout($.proxy(this._wheelStop, this), 200);

			this.zoomIn(deltaY * this.options.wheelSpeed);

			return false;
		},

		_mouseWheelScroll: function(event, delta, deltaX, deltaY){
			if (!this.enabled){
				return false;
			}

			if (this._wheelTimeout === false){
				this.startScroll();
			} else {
				clearTimeout(this._wheelTimeout);
			}

			this._wheelTimeout = setTimeout($.proxy(this._wheelStop, this), 200);

			this.scrollLeft(deltaY * this.options.wheelSpeed);
			return false;
		},

		_wheelStop: function(){
			this.stopScroll();
			this._wheelTimeout = false;
		},

		/*
		 * Public
		 */

		min: function(value){
			return this._leftHandle("value", value);
		},

		max: function(value){
			return this._rightHandle("value", value);
		},

		startScroll: function(){
			this._deactivateRange();
		},

		stopScroll: function(){
			this._reactivateRange();
			this._triggerMouseEvent("stop");
			this._leftHandle().trigger("stop");
			this._rightHandle().trigger("stop");
		},

		scrollLeft: function(quantity){
			quantity = quantity || 1;

			if (quantity < 0){
				return this.scrollRight(-quantity);
			}

			quantity = this._leftHandle("moveLeft", quantity);
			this._rightHandle("moveLeft", quantity);

			this.update();
			this._triggerMouseEvent("scroll");
		},

		scrollRight: function(quantity){
			quantity = quantity || 1;

			if (quantity < 0){
				return this.scrollLeft(-quantity);
			}

			quantity = this._rightHandle("moveRight", quantity);
			this._leftHandle("moveRight", quantity);

			this.update();
			this._triggerMouseEvent("scroll");
		},

		zoomIn: function(quantity){
			quantity = quantity || 1;

			if (quantity < 0){
				return this.zoomOut(-quantity);
			}

			var newQuantity = this._rightHandle("moveLeft", quantity);

			if (quantity > newQuantity){
				newQuantity = newQuantity / 2;
				this._rightHandle("moveRight", newQuantity);
			}

			this._leftHandle("moveRight", newQuantity);

			this.update();
			this._triggerMouseEvent("zoom");
		},

		zoomOut: function(quantity){
			quantity = quantity || 1;

			if (quantity < 0){
				return this.zoomIn(-quantity);
			}

			var newQuantity = this._rightHandle("moveRight", quantity);

			if (quantity > newQuantity){
				newQuantity = newQuantity / 2;
				this._rightHandle("moveLeft", newQuantity);
			}

			this._leftHandle("moveLeft", newQuantity);

			this.update();
			this._triggerMouseEvent("zoom");
		},

		values: function(min, max){
			if (typeof min !== "undefined" && typeof max !== "undefined")
			{
				var minValue = Math.min(min, max),
					maxValue = Math.max(min, max);

				this._deactivateRange();
				this.options.leftHandle.unbind(".bar");
				this.options.rightHandle.unbind(".bar");

				this._values.min = this._leftHandle("value", minValue);
				this._values.max = this._rightHandle("value", maxValue);

				this._bindHandles();
				this._reactivateRange();

				this.update();
			}

			return {
				min: this._values.min,
				max: this._values.max
			};
		},

		update: function(){
			this._values.min = this.min();
			this._values.max = this.max();

			this._cache();
			this._positionBar();
		}
	});

	function valueOrFalse(value, defaultValue){
		if (typeof value === "undefined"){
			return defaultValue || false;
		}

		return value;
	}

}(jQuery));
