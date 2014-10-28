(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Plugins": {
        "HeaderButtons": HeaderButtons
      }
    }
  });


  /***
   * A plugin to add custom buttons to column headers.
   *
   * USAGE:
   *
   * Add the plugin .js & .css files and register it with the grid.
   *
   * To specify a custom button in a column header, extend the column definition like so:
   *
   *   var columns = [
   *     {
   *       id: 'myColumn',
   *       name: 'My column',
   *
   *       // This is the relevant part
   *       header: {
   *          buttons: [
   *              {
   *                // button options
   *              },
   *              {
   *                // button options
   *              }
   *          ]
   *       }
   *     }
   *   ];
   *
   * Available button options:
   *    cssClass:     CSS class to add to the button.
   *    image:        Relative button image path.
   *    tooltip:      Button tooltip.
   *    showOnHover:  Only show the button on hover.
   *    handler:      Button click handler.
   *    command:      A command identifier to be passed to the onCommand event handlers.
   *
   * The plugin exposes the following events:
   *    onCommand:    Fired on button click for buttons with 'command' specified.
   *        Event args:
   *            grid:     Reference to the grid.
   *            column:   Column definition.
   *            command:  Button command identified.
   *            button:   Button options.  Note that you can change the button options in your
   *                      event handler, and the column header will be automatically updated to
   *                      reflect them.  This is useful if you want to implement something like a
   *                      toggle button.
   *
   *
   * @param options {Object} Options:
   *    buttonCssClass:   a CSS class to use for buttons (default 'slick-header-button')
   * @class Slick.Plugins.HeaderButtons
   * @constructor
   */
  function HeaderButtons(options) {
    var _grid;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {
      buttonCssClass: "slick-header-button"
    };


    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _handler
        .subscribe(_grid.onHeaderCellRendered, handleHeaderCellRendered)
        .subscribe(_grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy);

      // Force the grid to re-render the header now that the events are hooked up.
      _grid.setColumns(_grid.getColumns());
    }


    function destroy() {
      _handler.unsubscribeAll();
    }


    function handleHeaderCellRendered(e, args) {
      var column = args.column;

      if (column.header && column.header.buttons) {
        // Append buttons in reverse order since they are floated to the right.
        var i = column.header.buttons.length;
        while (i--) {
          var button = column.header.buttons[i];
          var btn = $("<div></div>")
            .addClass(options.buttonCssClass)
            .data("column", column)
            .data("button", button);

          if (button.showOnHover) {
            btn.addClass("slick-header-button-hidden");
          }

          if (button.image) {
            btn.css("backgroundImage", "url(" + button.image + ")");
          }

          if (button.cssClass) {
            btn.addClass(button.cssClass);
          }

          if (button.tooltip) {
            btn.attr("title", button.tooltip);
          }

          if (button.command) {
            btn.data("command", button.command);
          }

          if (button.handler) {
            btn.bind("click", button.handler);
          }

          btn
            .bind("click", handleButtonClick)
            .appendTo(args.node);
        }
      }
    }


    function handleBeforeHeaderCellDestroy(e, args) {
      var column = args.column;

      if (column.header && column.header.buttons) {
        // Removing buttons via jQuery will also clean up any event handlers and data.
        // NOTE: If you attach event handlers directly or using a different framework,
        //       you must also clean them up here to avoid memory leaks.
        $(args.node).find("." + options.buttonCssClass).remove();
      }
    }


    function handleButtonClick(e) {
      var command = $(this).data("command");
      var columnDef = $(this).data("column");
      var button = $(this).data("button");

      if (command != null) {
        _self.onCommand.notify({
            "grid": _grid,
            "column": columnDef,
            "command": command,
            "button": button
          }, e, _self);

        // Update the header in case the user updated the button definition in the handler.
        _grid.updateColumnHeader(columnDef.id);
      }

      // Stop propagation so that it doesn't register as a header click event.
      e.preventDefault();
      e.stopPropagation();
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,

      "onCommand": new Slick.Event()
    });
  }
})(jQuery);