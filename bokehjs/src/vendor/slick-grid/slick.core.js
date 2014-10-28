/***
 * Contains core SlickGrid classes.
 * @module Core
 * @namespace Slick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Event": Event,
      "EventData": EventData,
      "EventHandler": EventHandler,
      "Range": Range,
      "NonDataRow": NonDataItem,
      "Group": Group,
      "GroupTotals": GroupTotals,
      "EditorLock": EditorLock,

      /***
       * A global singleton editor lock.
       * @class GlobalEditorLock
       * @static
       * @constructor
       */
      "GlobalEditorLock": new EditorLock()
    }
  });

  /***
   * An event object for passing data to event handlers and letting them control propagation.
   * <p>This is pretty much identical to how W3C and jQuery implement events.</p>
   * @class EventData
   * @constructor
   */
  function EventData() {
    var isPropagationStopped = false;
    var isImmediatePropagationStopped = false;

    /***
     * Stops event from propagating up the DOM tree.
     * @method stopPropagation
     */
    this.stopPropagation = function () {
      isPropagationStopped = true;
    };

    /***
     * Returns whether stopPropagation was called on this event object.
     * @method isPropagationStopped
     * @return {Boolean}
     */
    this.isPropagationStopped = function () {
      return isPropagationStopped;
    };

    /***
     * Prevents the rest of the handlers from being executed.
     * @method stopImmediatePropagation
     */
    this.stopImmediatePropagation = function () {
      isImmediatePropagationStopped = true;
    };

    /***
     * Returns whether stopImmediatePropagation was called on this event object.\
     * @method isImmediatePropagationStopped
     * @return {Boolean}
     */
    this.isImmediatePropagationStopped = function () {
      return isImmediatePropagationStopped;
    }
  }

  /***
   * A simple publisher-subscriber implementation.
   * @class Event
   * @constructor
   */
  function Event() {
    var handlers = [];

    /***
     * Adds an event handler to be called when the event is fired.
     * <p>Event handler will receive two arguments - an <code>EventData</code> and the <code>data</code>
     * object the event was fired with.<p>
     * @method subscribe
     * @param fn {Function} Event handler.
     */
    this.subscribe = function (fn) {
      handlers.push(fn);
    };

    /***
     * Removes an event handler added with <code>subscribe(fn)</code>.
     * @method unsubscribe
     * @param fn {Function} Event handler to be removed.
     */
    this.unsubscribe = function (fn) {
      for (var i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i] === fn) {
          handlers.splice(i, 1);
        }
      }
    };

    /***
     * Fires an event notifying all subscribers.
     * @method notify
     * @param args {Object} Additional data object to be passed to all handlers.
     * @param e {EventData}
     *      Optional.
     *      An <code>EventData</code> object to be passed to all handlers.
     *      For DOM events, an existing W3C/jQuery event object can be passed in.
     * @param scope {Object}
     *      Optional.
     *      The scope ("this") within which the handler will be executed.
     *      If not specified, the scope will be set to the <code>Event</code> instance.
     */
    this.notify = function (args, e, scope) {
      e = e || new EventData();
      scope = scope || this;

      var returnValue;
      for (var i = 0; i < handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()); i++) {
        returnValue = handlers[i].call(scope, e, args);
      }

      return returnValue;
    };
  }

  function EventHandler() {
    var handlers = [];

    this.subscribe = function (event, handler) {
      handlers.push({
        event: event,
        handler: handler
      });
      event.subscribe(handler);

      return this;  // allow chaining
    };

    this.unsubscribe = function (event, handler) {
      var i = handlers.length;
      while (i--) {
        if (handlers[i].event === event &&
            handlers[i].handler === handler) {
          handlers.splice(i, 1);
          event.unsubscribe(handler);
          return;
        }
      }

      return this;  // allow chaining
    };

    this.unsubscribeAll = function () {
      var i = handlers.length;
      while (i--) {
        handlers[i].event.unsubscribe(handlers[i].handler);
      }
      handlers = [];

      return this;  // allow chaining
    }
  }

  /***
   * A structure containing a range of cells.
   * @class Range
   * @constructor
   * @param fromRow {Integer} Starting row.
   * @param fromCell {Integer} Starting cell.
   * @param toRow {Integer} Optional. Ending row. Defaults to <code>fromRow</code>.
   * @param toCell {Integer} Optional. Ending cell. Defaults to <code>fromCell</code>.
   */
  function Range(fromRow, fromCell, toRow, toCell) {
    if (toRow === undefined && toCell === undefined) {
      toRow = fromRow;
      toCell = fromCell;
    }

    /***
     * @property fromRow
     * @type {Integer}
     */
    this.fromRow = Math.min(fromRow, toRow);

    /***
     * @property fromCell
     * @type {Integer}
     */
    this.fromCell = Math.min(fromCell, toCell);

    /***
     * @property toRow
     * @type {Integer}
     */
    this.toRow = Math.max(fromRow, toRow);

    /***
     * @property toCell
     * @type {Integer}
     */
    this.toCell = Math.max(fromCell, toCell);

    /***
     * Returns whether a range represents a single row.
     * @method isSingleRow
     * @return {Boolean}
     */
    this.isSingleRow = function () {
      return this.fromRow == this.toRow;
    };

    /***
     * Returns whether a range represents a single cell.
     * @method isSingleCell
     * @return {Boolean}
     */
    this.isSingleCell = function () {
      return this.fromRow == this.toRow && this.fromCell == this.toCell;
    };

    /***
     * Returns whether a range contains a given cell.
     * @method contains
     * @param row {Integer}
     * @param cell {Integer}
     * @return {Boolean}
     */
    this.contains = function (row, cell) {
      return row >= this.fromRow && row <= this.toRow &&
          cell >= this.fromCell && cell <= this.toCell;
    };

    /***
     * Returns a readable representation of a range.
     * @method toString
     * @return {String}
     */
    this.toString = function () {
      if (this.isSingleCell()) {
        return "(" + this.fromRow + ":" + this.fromCell + ")";
      }
      else {
        return "(" + this.fromRow + ":" + this.fromCell + " - " + this.toRow + ":" + this.toCell + ")";
      }
    }
  }


  /***
   * A base class that all special / non-data rows (like Group and GroupTotals) derive from.
   * @class NonDataItem
   * @constructor
   */
  function NonDataItem() {
    this.__nonDataRow = true;
  }


  /***
   * Information about a group of rows.
   * @class Group
   * @extends Slick.NonDataItem
   * @constructor
   */
  function Group() {
    this.__group = true;

    /**
     * Grouping level, starting with 0.
     * @property level
     * @type {Number}
     */
    this.level = 0;

    /***
     * Number of rows in the group.
     * @property count
     * @type {Integer}
     */
    this.count = 0;

    /***
     * Grouping value.
     * @property value
     * @type {Object}
     */
    this.value = null;

    /***
     * Formatted display value of the group.
     * @property title
     * @type {String}
     */
    this.title = null;

    /***
     * Whether a group is collapsed.
     * @property collapsed
     * @type {Boolean}
     */
    this.collapsed = false;

    /***
     * GroupTotals, if any.
     * @property totals
     * @type {GroupTotals}
     */
    this.totals = null;

    /**
     * Rows that are part of the group.
     * @property rows
     * @type {Array}
     */
    this.rows = [];

    /**
     * Sub-groups that are part of the group.
     * @property groups
     * @type {Array}
     */
    this.groups = null;

    /**
     * A unique key used to identify the group.  This key can be used in calls to DataView
     * collapseGroup() or expandGroup().
     * @property groupingKey
     * @type {Object}
     */
    this.groupingKey = null;
  }

  Group.prototype = new NonDataItem();

  /***
   * Compares two Group instances.
   * @method equals
   * @return {Boolean}
   * @param group {Group} Group instance to compare to.
   */
  Group.prototype.equals = function (group) {
    return this.value === group.value &&
        this.count === group.count &&
        this.collapsed === group.collapsed &&
        this.title === group.title;
  };

  /***
   * Information about group totals.
   * An instance of GroupTotals will be created for each totals row and passed to the aggregators
   * so that they can store arbitrary data in it.  That data can later be accessed by group totals
   * formatters during the display.
   * @class GroupTotals
   * @extends Slick.NonDataItem
   * @constructor
   */
  function GroupTotals() {
    this.__groupTotals = true;

    /***
     * Parent Group.
     * @param group
     * @type {Group}
     */
    this.group = null;

    /***
     * Whether the totals have been fully initialized / calculated.
     * Will be set to false for lazy-calculated group totals.
     * @param initialized
     * @type {Boolean}
     */
    this.initialized = false;
  }

  GroupTotals.prototype = new NonDataItem();

  /***
   * A locking helper to track the active edit controller and ensure that only a single controller
   * can be active at a time.  This prevents a whole class of state and validation synchronization
   * issues.  An edit controller (such as SlickGrid) can query if an active edit is in progress
   * and attempt a commit or cancel before proceeding.
   * @class EditorLock
   * @constructor
   */
  function EditorLock() {
    var activeEditController = null;

    /***
     * Returns true if a specified edit controller is active (has the edit lock).
     * If the parameter is not specified, returns true if any edit controller is active.
     * @method isActive
     * @param editController {EditController}
     * @return {Boolean}
     */
    this.isActive = function (editController) {
      return (editController ? activeEditController === editController : activeEditController !== null);
    };

    /***
     * Sets the specified edit controller as the active edit controller (acquire edit lock).
     * If another edit controller is already active, and exception will be thrown.
     * @method activate
     * @param editController {EditController} edit controller acquiring the lock
     */
    this.activate = function (editController) {
      if (editController === activeEditController) { // already activated?
        return;
      }
      if (activeEditController !== null) {
        throw "SlickGrid.EditorLock.activate: an editController is still active, can't activate another editController";
      }
      if (!editController.commitCurrentEdit) {
        throw "SlickGrid.EditorLock.activate: editController must implement .commitCurrentEdit()";
      }
      if (!editController.cancelCurrentEdit) {
        throw "SlickGrid.EditorLock.activate: editController must implement .cancelCurrentEdit()";
      }
      activeEditController = editController;
    };

    /***
     * Unsets the specified edit controller as the active edit controller (release edit lock).
     * If the specified edit controller is not the active one, an exception will be thrown.
     * @method deactivate
     * @param editController {EditController} edit controller releasing the lock
     */
    this.deactivate = function (editController) {
      if (activeEditController !== editController) {
        throw "SlickGrid.EditorLock.deactivate: specified editController is not the currently active one";
      }
      activeEditController = null;
    };

    /***
     * Attempts to commit the current edit by calling "commitCurrentEdit" method on the active edit
     * controller and returns whether the commit attempt was successful (commit may fail due to validation
     * errors, etc.).  Edit controller's "commitCurrentEdit" must return true if the commit has succeeded
     * and false otherwise.  If no edit controller is active, returns true.
     * @method commitCurrentEdit
     * @return {Boolean}
     */
    this.commitCurrentEdit = function () {
      return (activeEditController ? activeEditController.commitCurrentEdit() : true);
    };

    /***
     * Attempts to cancel the current edit by calling "cancelCurrentEdit" method on the active edit
     * controller and returns whether the edit was successfully cancelled.  If no edit controller is
     * active, returns true.
     * @method cancelCurrentEdit
     * @return {Boolean}
     */
    this.cancelCurrentEdit = function cancelCurrentEdit() {
      return (activeEditController ? activeEditController.cancelCurrentEdit() : true);
    };
  }
})(jQuery);


