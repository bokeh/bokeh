/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($, undefined){

	"use strict";

	$.widget("ui.rangeSliderMouseTouch", $.ui.mouse, {
		enabled: true,

		_mouseInit: function(){
			var that = this;
			$.ui.mouse.prototype._mouseInit.apply(this);
			this._mouseDownEvent = false;

			this.element.bind('touchstart.' + this.widgetName, function(event) {
				return that._touchStart(event);
			});
		},

		_mouseDestroy: function(){
			$(document)
				.unbind('touchmove.' + this.widgetName, this._touchMoveDelegate)
				.unbind('touchend.' + this.widgetName, this._touchEndDelegate);
			
			$.ui.mouse.prototype._mouseDestroy.apply(this);
		},

		enable: function(){
			this.enabled = true;
		},

		disable: function(){
			this.enabled = false;
		},

		destroy: function(){
			this._mouseDestroy();
			
			$.ui.mouse.prototype.destroy.apply(this);

			this._mouseInit = null;
		},

		_touchStart: function(event){
			if (!this.enabled) return false;

			event.which = 1;
			event.preventDefault();

			this._fillTouchEvent(event);

			var that = this,
				downEvent = this._mouseDownEvent;

			this._mouseDown(event);

			if (downEvent !== this._mouseDownEvent){

				this._touchEndDelegate = function(event){
					that._touchEnd(event);
				}

				this._touchMoveDelegate = function(event){
					that._touchMove(event);
				}

				$(document)
				.bind('touchmove.' + this.widgetName, this._touchMoveDelegate)
				.bind('touchend.' + this.widgetName, this._touchEndDelegate);
			}
		},

		_mouseDown: function(event){
			if (!this.enabled) return false;

			return $.ui.mouse.prototype._mouseDown.apply(this, [event]);
		},

		_touchEnd: function(event){
			this._fillTouchEvent(event);
			this._mouseUp(event);

			$(document)
			.unbind('touchmove.' + this.widgetName, this._touchMoveDelegate)
			.unbind('touchend.' + this.widgetName, this._touchEndDelegate);

		this._mouseDownEvent = false;

		// No other choice to reinitialize mouseHandled
		$(document).trigger("mouseup");
		},

		_touchMove: function(event){
			event.preventDefault();
			this._fillTouchEvent(event);

			return this._mouseMove(event);
		},

		_fillTouchEvent: function(event){
			var touch;

			if (typeof event.targetTouches === "undefined" && typeof event.changedTouches === "undefined"){
				touch = event.originalEvent.targetTouches[0] || event.originalEvent.changedTouches[0];
			} else {
				touch = event.targetTouches[0] || event.changedTouches[0];
			}

			event.pageX = touch.pageX;
			event.pageY = touch.pageY;
		}
	});
}(jQuery));