/**
* jQuery.UI.iPad plugin
* Copyright (c) 2010 Stephen von Takach
* licensed under MIT.
* Date: 27/8/2010
*
* Project Home:
* http://code.google.com/p/jquery-ui-for-ipad-and-iphone/
*
* Modified: 19/01/2012
* Organized as a proper plugin and added addTouch()
*/
(function ($) {
	var lastTap = null,				// Holds last tapped element (so we can compare for double tap)
		tapValid = false,			// Are we still in the .6 second window where a double tap can occur
		tapTimeout = null,			// The timeout reference
		rightClickPending = false,	// Is a right click still feasible
		rightClickEvent = null,		// the original event
		holdTimeout = null,			// timeout reference
		cancelMouseUp = false,		// prevents a click from occurring as we want the context menu
		currentDOMElement = null;	// the last DOM element that was seen during a drag.

	function cancelTap() {
		tapValid = false;
	}
	
	function cancelHold() {
		if (rightClickPending) {
			window.clearTimeout(holdTimeout);
			rightClickPending = false;
			rightClickEvent = null;
		}
	}
	
	function startHold(event) {
		if (rightClickPending) {
			return;
		}
		rightClickPending = true; // We could be performing a right click
		rightClickEvent = (event.changedTouches)[0];
		holdTimeout = window.setTimeout(doRightClick, 800);
	}

	function doRightClick() {
		rightClickPending = false;
		// We need to mouse up (as we were down)
		var first = rightClickEvent,
			simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent("mouseup", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
		first.target.dispatchEvent(simulatedEvent);

		// Emulate a right click
		simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent("mousedown", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 2, null);
		first.target.dispatchEvent(simulatedEvent);

		// Show a context menu
		simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent("contextmenu", true, true, window, 1, first.screenX + 50, first.screenY + 5, first.clientX + 50, first.clientY + 5, false, false, false, false, 2, null);
		first.target.dispatchEvent(simulatedEvent);

		simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent("mouseup", true, true, window, 1, first.screenX + 50, first.screenY + 5, first.clientX + 50, first.clientY + 5, false, false, false, false, 2, null);
		first.target.dispatchEvent(simulatedEvent);

		cancelMouseUp = true;
		rightClickEvent = null; // Release memory
	}


	// mouse over event then mouse down
	function iPadTouchStart(event) {
		var touches = event.changedTouches,
			first = touches[0],
			type = "mouseover",
			simulatedEvent = document.createEvent("MouseEvent");

		// Mouse over first - I have live events attached on mouse over
		simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
		first.target.dispatchEvent(simulatedEvent);

		type = "mousedown";
		simulatedEvent = document.createEvent("MouseEvent");

		simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
		first.target.dispatchEvent(simulatedEvent);

		if (!tapValid) {
			lastTap = first.target;
			tapValid = true;
			tapTimeout = window.setTimeout(cancelTap, 600);
			startHold(event);
		} else {
			window.clearTimeout(tapTimeout);
			// If a double tap is still a possibility and the elements are the same then perform a double click
			if (first.target == lastTap) {
				lastTap = null;
				tapValid = false;

				type = "click";
				simulatedEvent = document.createEvent("MouseEvent");

				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
				first.target.dispatchEvent(simulatedEvent);

				type = "dblclick";
				simulatedEvent = document.createEvent("MouseEvent");

				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
				first.target.dispatchEvent(simulatedEvent);
			} else {
				lastTap = first.target;
				tapValid = true;
				tapTimeout = window.setTimeout(cancelTap, 600);
				startHold(event);
			}
		}
	}

	function getDOMElementFromEvent(event) {
		if (event.targetTouches && event.targetTouches[0]) {
			return document.elementFromPoint(event.targetTouches[0].pageX - window.pageXOffset, event.targetTouches[0].pageY - window.pageYOffset);
		}
		return null;
	}

	function iPadTouchHandler(event) {
		var type = "",
			button = 0; /*left*/
		if (event.touches.length > 1) {
			return;
		}
		switch (event.type) {
		case "touchstart":
			if ($(event.changedTouches[0].target).is("select")) {
				return;
			}
			iPadTouchStart(event); /*We need to trigger two events here to support one touch drag and drop*/
			event.preventDefault();
			currentDOMElement = getDOMElementFromEvent(event);
			return false;

		case "touchmove":
			cancelHold();
			type = "mousemove";
			event.preventDefault();

			currentDOMElement = getDOMElementFromEvent(event);
			break;

		case "touchend":
			if (cancelMouseUp) {
				cancelMouseUp = false;
				event.preventDefault();
				return false;
			}
			cancelHold();
			type = "mouseup";
			break;

		default:
			return;
		}
		var touches = event.changedTouches,
			first = touches[0],
			simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY,false, false, false, false, button, null);
		currentDOMElement.dispatchEvent(simulatedEvent);
		if (type == "mouseup" && tapValid && first.target == lastTap) {	// This actually emulates the ipad's default behavior (which we prevented)
			simulatedEvent = document.createEvent("MouseEvent");		// This check avoids click being emulated on a double tap
			simulatedEvent.initMouseEvent("click", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY,false, false, false, false, button, null);
			currentDOMElement.dispatchEvent(simulatedEvent);
		}
	}
	
	$.extend($.support, {
		touch: "ontouchend" in document
	});

	$.fn.addTouch = function () {
		if ($.support.touch) {
			this.each(function (i, el) {
				el.addEventListener("touchstart", iPadTouchHandler, false);
				el.addEventListener("touchmove", iPadTouchHandler, false);
				el.addEventListener("touchend", iPadTouchHandler, false);
				el.addEventListener("touchcancel", iPadTouchHandler, false);
			});
		}
		return this;
	};

})(jQuery);