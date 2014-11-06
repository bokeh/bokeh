/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */

 (function ($, undefined) {
	"use strict";
	
	$.widget("ui.editRangeSlider", $.ui.rangeSlider, {
		options:{
			type: "text",
			round: 1
		},

		_create: function(){
			$.ui.rangeSlider.prototype._create.apply(this);

			this.element.addClass("ui-editRangeSlider");
		},

		destroy: function(){
			this.element.removeClass("ui-editRangeSlider");

			$.ui.rangeSlider.prototype.destroy.apply(this);
		},

		_setOption: function(key, value){
			if (key === "type" || key === "step"){
				this._setLabelOption(key, value);
			}	

			if (key === "type"){
				this.options[key] = this.labels.left === null ? value : this._leftLabel("option", key);
			}

			$.ui.rangeSlider.prototype._setOption.apply(this, [key, value]);
		},

		_setLabelOption: function(key, value){
			if (this.labels.left !== null){
				this._leftLabel("option", key, value);
				this._rightLabel("option", key, value);
			}
		},

		_labelType: function(){
			return "editRangeSliderLabel";
		},

		_createLabel: function(label, handle){
			var result = $.ui.rangeSlider.prototype._createLabel.apply(this, [label, handle]);
			
			if (label === null){
				result.bind("valueChange", $.proxy(this._onValueChange, this));
			}

			return result;
		},

		_addPropertiesToParameter: function(parameters){
			parameters.type = this.options.type;
			parameters.step = this.options.step;
			parameters.id = this.element.attr("id");

			return parameters;
		},

		_getLabelConstructorParameters: function(label, handle){
			var parameters = $.ui.rangeSlider.prototype._getLabelConstructorParameters.apply(this, [label, handle]);

			return this._addPropertiesToParameter(parameters);
		},

		_getLabelRefreshParameters: function(label, handle){
			var parameters = $.ui.rangeSlider.prototype._getLabelRefreshParameters.apply(this, [label, handle]);

			return this._addPropertiesToParameter(parameters);
		},

		_onValueChange: function(event, data){
			var changed = false;

			if (data.isLeft){
				changed = this._values.min !== this.min(data.value);
			}else{
				changed = this._values.max !== this.max(data.value);
			}

			if (changed){
				this._trigger("userValuesChanged");
			}
		}
	});

}(jQuery));