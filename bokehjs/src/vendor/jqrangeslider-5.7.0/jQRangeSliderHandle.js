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

	$.widget("ui.rangeSliderHandle", $.ui.rangeSliderDraggable, {
		currentMove: null,
		margin: 0,
		parentElement: null,

		options: {
			isLeft: true,
			bounds: {min:0, max:100},
			range: false,
			value: 0,
			step: false
		},

		_value: 0,
		_left: 0,

		_create: function(){
			$.ui.rangeSliderDraggable.prototype._create.apply(this);

			this.element
				.css("position", "absolute")
				.css("top", 0)
				.addClass("bk-ui-rangeSlider-handle")
				.toggleClass("bk-ui-rangeSlider-leftHandle", this.options.isLeft)
				.toggleClass("bk-ui-rangeSlider-rightHandle", !this.options.isLeft);

			this.element.append("<div class='bk-ui-rangeSlider-handle-inner' />");

			this._value = this._constraintValue(this.options.value);
		},

		destroy: function(){
			this.element.empty();

			$.ui.rangeSliderDraggable.prototype.destroy.apply(this);
		},

		_setOption: function(key, value){
			if (key === "isLeft" && (value === true || value === false) && value !== this.options.isLeft){
				this.options.isLeft = value;

				this.element
					.toggleClass("bk-ui-rangeSlider-leftHandle", this.options.isLeft)
					.toggleClass("bk-ui-rangeSlider-rightHandle", !this.options.isLeft);

				this._position(this._value);

				this.element.trigger("switch", this.options.isLeft);
			} else if (key === "step" && this._checkStep(value)){
				this.options.step = value;
				this.update();
			} else if (key === "bounds"){
				this.options.bounds = value;
				this.update();
			}else if (key === "range" && this._checkRange(value)){
				this.options.range = value;
				this.update();
			}else if (key === "symmetricPositionning"){
				this.options.symmetricPositionning = value === true;
				this.update();
			}

			$.ui.rangeSliderDraggable.prototype._setOption.apply(this, [key, value]);
		},

		_checkRange: function(range){
			return range === false || (!this._isValidValue(range.min) && !this._isValidValue(range.max));
		},

		_isValidValue: function(value){
			return typeof value !== "undefined" && value !== false && parseFloat(value) !== value;
		},

		_checkStep: function(step){
			return (step === false || parseFloat(step) === step);
		},

		_initElement: function(){
			$.ui.rangeSliderDraggable.prototype._initElement.apply(this);

			if (this.cache.parent.width === 0 || this.cache.parent.width === null){
				setTimeout($.proxy(this._initElementIfNotDestroyed, this), 500);
			}else{
				this._position(this._value);
				this._triggerMouseEvent("initialize");
			}
		},

		_bounds: function(){
			return this.options.bounds;
		},

		/*
		 * From draggable
		 */

		_cache: function(){
			$.ui.rangeSliderDraggable.prototype._cache.apply(this);

			this._cacheParent();
		},

		_cacheParent: function(){
			var parent = this.element.parent();

			this.cache.parent = {
				element: parent,
				offset: parent.offset(),
				padding: {
					left: this._parsePixels(parent, "paddingLeft")
				},
				width: parent.width()
			}
		},

		_position: function(value){
			var left = this._getPositionForValue(value);

			this._applyPosition(left);
		},

		_constraintPosition: function(position){
			var value = this._getValueForPosition(position);

			return this._getPositionForValue(value);
		},

		_applyPosition: function(left){
			$.ui.rangeSliderDraggable.prototype._applyPosition.apply(this, [left]);

			this._left = left;
			this._setValue(this._getValueForPosition(left));
			this._triggerMouseEvent("moving");
		},

		_prepareEventData: function(){
			var data = $.ui.rangeSliderDraggable.prototype._prepareEventData.apply(this);

			data.value = this._value;

			return data;
		},

		/*
		 * Value
		 */
		_setValue: function(value){
			if (value !== this._value){
				this._value = value;
			}
		},

		_constraintValue: function(value){
			value = Math.min(value, this._bounds().max);
			value = Math.max(value, this._bounds().min);

			value = this._round(value);

			if (this.options.range !== false){
				var min = this.options.range.min || false,
					max = this.options.range.max || false;

				if (min !== false){
					value = Math.max(value, this._round(min));
				}

				if (max !== false){
					value = Math.min(value, this._round(max));
				}

				value = Math.min(value, this._bounds().max);
				value = Math.max(value, this._bounds().min);
			}

			return value;
		},

		_round: function(value){
			if (this.options.step !== false && this.options.step > 0){
				return Math.round(value / this.options.step) * this.options.step;
			}

			return value;
		},

		_getPositionForValue: function(value){
			if (!this.cache || !this.cache.parent || this.cache.parent.offset === null){
				return 0;
			}

			value = this._constraintValue(value);

			var ratio = (value - this.options.bounds.min) / (this.options.bounds.max - this.options.bounds.min),
				availableWidth = this.cache.parent.width,
				parentPosition = this.cache.parent.offset.left,
				shift = this.options.isLeft ? 0 : this.cache.width.outer;


			if (!this.options.symmetricPositionning){
				return ratio * availableWidth + parentPosition - shift;
			}

			return ratio * (availableWidth - 2 * this.cache.width.outer) + parentPosition + shift;
		},

		_getValueForPosition: function(position){
			var raw = this._getRawValueForPositionAndBounds(position, this.options.bounds.min, this.options.bounds.max);

			return this._constraintValue(raw);
		},

		_getRawValueForPositionAndBounds: function(position, min, max){

			var parentPosition =  this.cache.parent.offset === null ? 0 : this.cache.parent.offset.left,
					availableWidth,
					ratio;

			if (this.options.symmetricPositionning){
				position -= this.options.isLeft ? 0 : this.cache.width.outer;
				availableWidth = this.cache.parent.width - 2 * this.cache.width.outer;
			}else{
				position += this.options.isLeft ? 0 : this.cache.width.outer;
				availableWidth = this.cache.parent.width;
			}

			if (availableWidth === 0){
				return this._value;
			}

			ratio = (position - parentPosition) / availableWidth;

			return	ratio * (max - min) + min;
		},

		/*
		 * Public
		 */

		value: function(value){
			if (typeof value !== "undefined"){
				this._cache();

				value = this._constraintValue(value);

				this._position(value);
			}

			return this._value;
		},

		update: function(){
			this._cache();
			var value = this._constraintValue(this._value),
				position = this._getPositionForValue(value);

			if (value !== this._value){
				this._triggerMouseEvent("updating");
				this._position(value);
				this._triggerMouseEvent("update");
			}else if (position !== this.cache.offset.left){
				this._triggerMouseEvent("updating");
				this._position(value);
				this._triggerMouseEvent("update");
			}
		},

		position: function(position){
			if (typeof position !== "undefined"){
				this._cache();

				position = this._constraintPosition(position);
				this._applyPosition(position);
			}

			return this._left;
		},

		add: function(value, step){
			return value + step;
		},

		substract: function(value, step){
			return value - step;
		},

		stepsBetween: function(val1, val2){
			if (this.options.step === false){
				return val2 - val1;
			}

			return (val2 - val1) / this.options.step;
		},

		multiplyStep: function(step, factor){
			return step * factor;
		},

		moveRight: function(quantity){
			var previous;

			if (this.options.step === false){
				previous = this._left;
				this.position(this._left + quantity);

				return this._left - previous;
			}

			previous = this._value;
			this.value(this.add(previous, this.multiplyStep(this.options.step, quantity)));

			return this.stepsBetween(previous, this._value);
		},

		moveLeft: function(quantity){
			return -this.moveRight(-quantity);
		},

		stepRatio: function(){
			if (this.options.step === false){
				return 1;
			}else{
				var steps = (this.options.bounds.max - this.options.bounds.min) / this.options.step;
				return this.cache.parent.width / steps;
			}
		}
	});
 }(jQuery));
