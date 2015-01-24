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

	$.widget("ui.rangeSliderLabel", $.ui.rangeSliderMouseTouch, {
		options: {
			handle: null,
			formatter: false,
			handleType: "rangeSliderHandle",
			show: "show",
			durationIn: 0,
			durationOut: 500,
			delayOut: 500,
			isLeft: false
		},

		cache: null,
		_positionner: null,
		_valueContainer:null,
		_innerElement:null,
		_value: null,

		_create: function(){
			this.options.isLeft = this._handle("option", "isLeft");

			this.element
				.addClass("bk-ui-rangeSlider-label")
				.css("position", "absolute")
				.css("display", "block");

			this._createElements();

			this._toggleClass();

			this.options.handle
				.bind("moving.label", $.proxy(this._onMoving, this))
				.bind("update.label", $.proxy(this._onUpdate, this))
				.bind("switch.label", $.proxy(this._onSwitch, this));

			if (this.options.show !== "show"){
				this.element.hide();
			}

			this._mouseInit();
		},

		destroy: function(){
			this.options.handle.unbind(".label");
			this.options.handle = null;

			this._valueContainer = null;
			this._innerElement = null;
			this.element.empty();

			if (this._positionner) {
				this._positionner.Destroy();
				this._positionner = null;
			}

			$.ui.rangeSliderMouseTouch.prototype.destroy.apply(this);
		},

		_createElements: function(){
			this._valueContainer = $("<div class='bk-ui-rangeSlider-label-value' />")
				.appendTo(this.element);

			this._innerElement = $("<div class='bk-ui-rangeSlider-label-inner' />")
				.appendTo(this.element);
		},

		_handle: function(){
			var args = Array.prototype.slice.apply(arguments);

			return this.options.handle[this.options.handleType].apply(this.options.handle, args);
		},

		_setOption: function(key, value){
			if (key === "show"){
				this._updateShowOption(value);
			} else if (key === "durationIn" || key === "durationOut" || key === "delayOut"){
				this._updateDurations(key, value);
			}

			this._setFormatterOption(key, value);
		},

		_setFormatterOption: function(key, value){
			if (key === "formatter"){
				if (typeof value === "function" || value === false){
					this.options.formatter = value;
					this._display(this._value);
				}
			}
		},

		_updateShowOption: function(value){
			this.options.show = value;

			if (this.options.show !== "show"){
				this.element.hide();
				this._positionner.moving = false;
			}else{
				this.element.show();
				this._display(this.options.handle[this.options.handleType]("value"));
				this._positionner.PositionLabels();
			}

			this._positionner.options.show = this.options.show;
		},

		_updateDurations: function(key, value){
			if (parseInt(value, 10) !== value) return;

			this._positionner.options[key] = value;
			this.options[key] = value;
		},

		_display: function(value){
			if (this.options.formatter === false){
				this._displayText(Math.round(value));
			}else{
				this._displayText(this.options.formatter(value));
			}

			this._value = value;
		},

		_displayText: function(text){
			this._valueContainer.text(text);
		},

		_toggleClass: function(){
			this.element.toggleClass("bk-ui-rangeSlider-leftLabel", this.options.isLeft)
				.toggleClass("bk-ui-rangeSlider-rightLabel", !this.options.isLeft);
		},

		_positionLabels: function(){
			this._positionner.PositionLabels();
		},

		/*
		 * Mouse touch redirection
		 */
		_mouseDown: function(event){
			this.options.handle.trigger(event);
		},

		_mouseUp: function(event){
			this.options.handle.trigger(event);
		},

		_mouseMove: function(event){
			this.options.handle.trigger(event);
		},

		/*
		 * Event binding
		 */
		_onMoving: function(event, ui){
			this._display(ui.value);
		},

		_onUpdate: function(){
			if (this.options.show === "show"){
				this.update();
			}
		},

		_onSwitch: function(event, isLeft){
			this.options.isLeft = isLeft;

			this._toggleClass();
			this._positionLabels();
		},

		/*
		 * Label pair
		 */
		pair: function(label){
			if (this._positionner !== null) return;

			this._positionner = new LabelPositioner(this.element, label, this.widgetName, {
				show: this.options.show,
				durationIn: this.options.durationIn,
				durationOut: this.options.durationOut,
				delayOut: this.options.delayOut
			});

			label[this.widgetName]("positionner", this._positionner);
		},

		positionner: function(pos){
			if (typeof pos !== "undefined"){
				this._positionner = pos;
			}

			return this._positionner;
		},

		update: function(){
			this._positionner.cache = null;
			this._display(this._handle("value"));

			if (this.options.show === "show"){
				this._positionLabels();
			}
		}
	});

	function LabelPositioner(label1, label2, type, options){
		/*jshint maxstatements:40 */

		this.label1 = label1;
		this.label2 = label2;
		this.type = type;
		this.options = options;
		this.handle1 = this.label1[this.type]("option", "handle");
		this.handle2 = this.label2[this.type]("option", "handle");
		this.cache = null;
		this.left = label1;
		this.right = label2;
		this.moving = false;
		this.initialized = false;
		this.updating = false;

		this.Init = function(){
			this.BindHandle(this.handle1);
			this.BindHandle(this.handle2);

			if (this.options.show === "show"){
				setTimeout($.proxy(this.PositionLabels, this), 1);
				this.initialized = true;
			}else{
				setTimeout($.proxy(this.AfterInit, this), 1000);
			}

			this._resizeProxy = $.proxy(this.onWindowResize, this);

			$(window).resize(this._resizeProxy);
		}

		this.Destroy = function(){
			if (this._resizeProxy){
				$(window).unbind("resize", this._resizeProxy);
				this._resizeProxy = null;

				this.handle1.unbind(".positionner");
				this.handle1 = null;

				this.handle2.unbind(".positionner");
				this.handle2 = null;

				this.label1 = null;
				this.label2 = null;
				this.left = null;
				this.right = null;
			}

			this.cache = null;
		}

		this.AfterInit = function () {
			this.initialized = true;
		}

		this.Cache = function(){
			if (this.label1.css("display") === "none"){
				return;
			}

			this.cache = {};
			this.cache.label1 = {};
			this.cache.label2 = {};
			this.cache.handle1 = {};
			this.cache.handle2 = {};
			this.cache.offsetParent = {};

			this.CacheElement(this.label1, this.cache.label1);
			this.CacheElement(this.label2, this.cache.label2);
			this.CacheElement(this.handle1, this.cache.handle1);
			this.CacheElement(this.handle2, this.cache.handle2);
			this.CacheElement(this.label1.offsetParent(), this.cache.offsetParent);
		}

		this.CacheIfNecessary = function(){
			if (this.cache === null){
				this.Cache();
			}else{
				this.CacheWidth(this.label1, this.cache.label1);
				this.CacheWidth(this.label2, this.cache.label2);
				this.CacheHeight(this.label1, this.cache.label1);
				this.CacheHeight(this.label2, this.cache.label2);
				this.CacheWidth(this.label1.offsetParent(), this.cache.offsetParent);
			}
		}

		this.CacheElement = function(label, cache){
			this.CacheWidth(label, cache);
			this.CacheHeight(label, cache);

			cache.offset = label.offset();
			cache.margin = {
				left: this.ParsePixels("marginLeft", label),
				right: this.ParsePixels("marginRight", label)
			};

			cache.border = {
				left: this.ParsePixels("borderLeftWidth", label),
				right: this.ParsePixels("borderRightWidth", label)
			};
		}

		this.CacheWidth = function(label, cache){
			cache.width = label.width();
			cache.outerWidth = label.outerWidth();
		}

		this.CacheHeight = function(label, cache){
			cache.outerHeightMargin = label.outerHeight(true);
		}

		this.ParsePixels = function(name, element){
			return parseInt(element.css(name), 10) || 0;
		}

		this.BindHandle = function(handle){
			handle.bind("updating.positionner", $.proxy(this.onHandleUpdating, this));
			handle.bind("update.positionner", $.proxy(this.onHandleUpdated, this));
			handle.bind("moving.positionner", $.proxy(this.onHandleMoving, this));
			handle.bind("stop.positionner", $.proxy(this.onHandleStop, this));
		}

		this.PositionLabels = function(){
			this.CacheIfNecessary();

			if (this.cache === null){
				return;
			}

			var label1Pos = this.GetRawPosition(this.cache.label1, this.cache.handle1),
				label2Pos = this.GetRawPosition(this.cache.label2, this.cache.handle2);

			if (this.label1[type]("option", "isLeft")){
				this.ConstraintPositions(label1Pos, label2Pos);
			}else{
				this.ConstraintPositions(label2Pos, label1Pos);
			}

			this.PositionLabel(this.label1, label1Pos.left, this.cache.label1);
			this.PositionLabel(this.label2, label2Pos.left, this.cache.label2);
		}

		this.PositionLabel = function(label, leftOffset, cache){
			var parentShift = this.cache.offsetParent.offset.left + this.cache.offsetParent.border.left,
					parentRightPosition,
					labelRightPosition,
					rightPosition;

			if ((parentShift - leftOffset) >= 0){
				label.css("right", "");
				label.offset({left: leftOffset});
			}else{
				parentRightPosition = parentShift + this.cache.offsetParent.width;
				labelRightPosition = leftOffset + cache.margin.left + cache.outerWidth + cache.margin.right;
				rightPosition = parentRightPosition - labelRightPosition;

				label.css("left", "");
				label.css("right", rightPosition);
			}
		}

		this.ConstraintPositions = function(pos1, pos2){
			if ((pos1.center < pos2.center && pos1.outerRight > pos2.outerLeft) || (pos1.center > pos2.center && pos2.outerRight > pos1.outerLeft)){
				pos1 = this.getLeftPosition(pos1, pos2);
				pos2 = this.getRightPosition(pos1, pos2);
			}
		}

		this.getLeftPosition = function(left, right){
			var center = (right.center + left.center) / 2,
				leftPos = center - left.cache.outerWidth - left.cache.margin.right + left.cache.border.left;

			left.left = leftPos;

			return left;
		}

		this.getRightPosition = function(left, right){
			var center = (right.center + left.center) / 2;

			right.left = center + right.cache.margin.left + right.cache.border.left;

			return right;
		}

		this.ShowIfNecessary = function(){
			if (this.options.show === "show" || this.moving || !this.initialized || this.updating) return;

			this.label1.stop(true, true).fadeIn(this.options.durationIn || 0);
			this.label2.stop(true, true).fadeIn(this.options.durationIn || 0);
			this.moving = true;
		}

		this.HideIfNeeded = function(){
			if (this.moving === true){
				this.label1.stop(true, true).delay(this.options.delayOut || 0).fadeOut(this.options.durationOut || 0);
				this.label2.stop(true, true).delay(this.options.delayOut || 0).fadeOut(this.options.durationOut || 0);
				this.moving = false;
			}
		}

		this.onHandleMoving = function(event, ui){
			this.ShowIfNecessary();
			this.CacheIfNecessary();
			this.UpdateHandlePosition(ui);

			this.PositionLabels();
		}

		this.onHandleUpdating = function(){
			this.updating = true;
		}

		this.onHandleUpdated = function(){
			this.updating = false;
			this.cache = null;
		}

		this.onHandleStop = function(){
			this.HideIfNeeded();
		}

		this.onWindowResize = function(){
				this.cache = null;
		}

		this.UpdateHandlePosition = function(ui){
			if (this.cache === null) return;

			if (ui.element[0] === this.handle1[0]){
				this.UpdatePosition(ui, this.cache.handle1);
			}else{
				this.UpdatePosition(ui, this.cache.handle2);
			}
		}

		this.UpdatePosition = function(element, cache){
			cache.offset = element.offset;
			cache.value = element.value;
		}

		this.GetRawPosition = function(labelCache, handleCache){
			var handleCenter = handleCache.offset.left + handleCache.outerWidth / 2,
				labelLeft = handleCenter - labelCache.outerWidth / 2,
				labelRight = labelLeft + labelCache.outerWidth - labelCache.border.left - labelCache.border.right,
				outerLeft = labelLeft - labelCache.margin.left - labelCache.border.left,
				top = handleCache.offset.top - labelCache.outerHeightMargin;

			return {
				left: labelLeft,
				outerLeft: outerLeft,
				top: top,
				right: labelRight,
				outerRight: outerLeft + labelCache.outerWidth + labelCache.margin.left + labelCache.margin.right,
				cache: labelCache,
				center: handleCenter
			}
		}

		this.Init();
	}

}(jQuery));


