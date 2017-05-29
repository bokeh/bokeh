/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */

(function($){
	"use strict";

	$.widget("ui.editRangeSliderLabel", $.ui.rangeSliderLabel, {
		options: {
			type: "text",
			step: false,
			id: ""
		},

		_input: null,
		_text: "",

		_create: function(){
			$.ui.rangeSliderLabel.prototype._create.apply(this);

			this._createInput();
		},

		_setOption: function(key, value){
			if (key === "type"){
				this._setTypeOption(value);
			} else if (key === "step") {
				this._setStepOption(value);
			}

			$.ui.rangeSliderLabel.prototype._setOption.apply(this, [key, value]);
		},

		_createInput: function(){
			this._input = $("<input type='" + this.options.type + "' />")
				.addClass("ui-editRangeSlider-inputValue")
				.appendTo(this._valueContainer);

			this._setInputName();

			this._input.bind("keyup", $.proxy(this._onKeyUp, this));
			this._input.blur($.proxy(this._onChange, this));

			if (this.options.type === "number"){
				if (this.options.step !== false){
					this._input.attr("step", this.options.step);
				}

				this._input.click($.proxy(this._onChange, this));
			}

			this._input.val(this._text);
		},

		_setInputName: function(){
			var name = this.options.isLeft ? "left" : "right";

			this._input.attr("name", this.options.id + name);
		},

		_onSwitch: function(event, isLeft){
			$.ui.rangeSliderLabel.prototype._onSwitch.apply(this, [event, isLeft]);

			this._setInputName();
		},

		_destroyInput: function(){
			this._input.remove();
			this._input = null;
		},

		_onKeyUp: function(e){
			if (e.which === 13){
				this._onChange(e);
				return false;
			}
		},

		_onChange: function(){
			var value = this._returnCheckedValue(this._input.val());

			if (value !== false){
				this._triggerValue(value);
			}
		},

		_triggerValue: function(value){
			var isLeft = this.options.handle[this.options.handleType]("option", "isLeft");

			this.element.trigger("valueChange", [{
					isLeft: isLeft,
					value: value
				}]);
		},

	_returnCheckedValue: function(val){
		var floatValue = parseFloat(val);

		if (isNaN(floatValue) || isNaN(Number(val))){
			return false;
		}

		return floatValue;
	},

	_setTypeOption: function(value){
		if ((value === "text" || value === "number") && this.options.type !== value){
			this._destroyInput();
			this.options.type = value;
			this._createInput();
		}
	},

	_setStepOption: function(value){
		this.options.step = value;

		if (this.options.type === "number"){
			this._input.attr("step", value !== false ? value : "any");
		}
	},

	_displayText: function(text){
		this._input.val(text);
		this._text = text;
	},

	enable: function(){
		$.ui.rangeSliderLabel.prototype.enable.apply(this);

		this._input.attr("disabled", null);
	},

	disable: function(){
		$.ui.rangeSliderLabel.prototype.disable.apply(this);

		this._input.attr("disabled", "disabled");
	}

});

}(jQuery));
