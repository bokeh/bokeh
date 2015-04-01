/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */

var $ = require("jquery");
require("./jQRangeSlider");
"use strict";

module.exports = $.widget("ui.dateRangeSlider", $.ui.rangeSlider, {
	options: {
		bounds: {min: new Date(2010,0,1).valueOf(), max: new Date(2012,0,1).valueOf()},
		defaultValues: {min: new Date(2010,1,11).valueOf(), max: new Date(2011,1,11).valueOf()}
	},

	_create: function(){
		$.ui.rangeSlider.prototype._create.apply(this);

		this.element.addClass("bk-ui-dateRangeSlider");
	},

	destroy: function(){
		this.element.removeClass("bk-ui-dateRangeSlider");
		$.ui.rangeSlider.prototype.destroy.apply(this);
	},

	_setDefaultValues: function(){
		this._values = {
			min: this.options.defaultValues.min.valueOf(),
			max: this.options.defaultValues.max.valueOf()
		};
	},

	_setRulerParameters: function(){
		this.ruler.ruler({
			min: new Date(this.options.bounds.min),
			max: new Date(this.options.bounds.max),
			scales: this.options.scales
		});
	},

	_setOption: function(key, value){
		if ((key === "defaultValues" || key === "bounds") && typeof value !== "undefined" && value !== null && this._isValidDate(value.min) && this._isValidDate(value.max)){
			$.ui.rangeSlider.prototype._setOption.apply(this, [key, {min:value.min.valueOf(), max:value.max.valueOf()}]);
		}else{
			$.ui.rangeSlider.prototype._setOption.apply(this, this._toArray(arguments));
		}
	},

	_handleType: function(){
		return "dateRangeSliderHandle";
	},

	option: function(key){
		if (key === "bounds" || key === "defaultValues"){
			var result = $.ui.rangeSlider.prototype.option.apply(this, arguments);

			return {min:new Date(result.min), max:new Date(result.max)};
		}

		return $.ui.rangeSlider.prototype.option.apply(this, this._toArray(arguments));
	},

	_defaultFormatter: function(value){
		var month = value.getMonth() + 1,
			day = value.getDate();

		return "" + value.getFullYear() + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);
	},

	_getFormatter: function(){
		var formatter = this.options.formatter;

		if (this.options.formatter === false || this.options.formatter === null){
			formatter = this._defaultFormatter;
		}

		return (function(formatter){
			return function(value){
				return formatter(new Date(value));
			}
		}(formatter));
	},

	values: function(min, max){
		var values = null;

		if (this._isValidDate(min) && this._isValidDate(max))
		{
			values = $.ui.rangeSlider.prototype.values.apply(this, [min.valueOf(), max.valueOf()]);
		}else{
			values = $.ui.rangeSlider.prototype.values.apply(this, this._toArray(arguments));
		}

		return {min: new Date(values.min), max: new Date(values.max)};
	},

	min: function(min){
		if (this._isValidDate(min)){
			return new Date($.ui.rangeSlider.prototype.min.apply(this, [min.valueOf()]));
		}

		return new Date($.ui.rangeSlider.prototype.min.apply(this));
	},

	max: function(max){
		if (this._isValidDate(max)){
			return new Date($.ui.rangeSlider.prototype.max.apply(this, [max.valueOf()]));
		}

		return new Date($.ui.rangeSlider.prototype.max.apply(this));
	},

	bounds: function(min, max){
		var result;

		if (this._isValidDate(min) && this._isValidDate(max)) {
			result = $.ui.rangeSlider.prototype.bounds.apply(this, [min.valueOf(), max.valueOf()]);
		} else {
			result = $.ui.rangeSlider.prototype.bounds.apply(this, this._toArray(arguments));
		}

		return {min: new Date(result.min), max: new Date(result.max)};
	},

	_isValidDate: function(value){
		return typeof value !== "undefined" && value instanceof Date;
	},

	_toArray: function(argsObject){
		return Array.prototype.slice.call(argsObject);
	}
});
