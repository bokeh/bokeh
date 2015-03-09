
.. _devguide_notes:

Notes
=====

This section collects miscellaneous information that may be of use to
anyone developing Bokeh. Help organizing and improving this material is
welcome.

Environment Variables
---------------------

There are several environment variables that can be useful for developers:

* ``BOKEH_BROWSER`` --- What browser to use when opening plots
    Valid values are any of the browser names understood by the python
    standard library webbrowser_ module.

* ``BOKEH_LOCAL_DOCS_CDN`` --- What version of BokehJS to use when building  sphinx docs locally.

* ``BOKEH_RELEASED_DOCS`` --- Whether to use the x.x.x version for re-deployment of the docs.
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

* ``BOKEH_LOG_LEVEL`` --- The BokehJS console logging level to use
    Valid values are, in order of increasing severity:

  - ``trace``
  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``

    The default logging level is ``info``.

    .. note::
        When running  server examples, it is the value of this
        ``BOKEH_LOG_LEVEL`` that is set for the server that matters.

* ``BOKEH_MINIFIED`` --- Whether to emit minified JavaScript for ``bokeh.js``
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

* ``BOKEH_PRETTY`` --- Whether to emit "pretty printed" JSON
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

* ``BOKEH_PY_LOG_LEVEL`` --- The Python logging level to set
    As in the JS side, valid values are, in order of increasing severity:

  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``
  - ``none``

    The default logging level is ``none``.

* ``BOKEH_RESOURCES`` --- What kind of BokehJS resources to configure
    For example:  ``inline``, ``cdn``, ``server``. See the
    :class:`~bokeh.resources.Resources` class reference for full details.

* ``BOKEH_ROOTDIR`` --- Root directory to use with ``relative`` resources
    See the :class:`~bokeh.resources.Resources` class reference for full
    details.

* ``BOKEH_SIMPLE_IDS`` --- Whether to generate human-friendly object IDs
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
    Normally Bokeh generates UUIDs for object identifiers. Setting this variable
    to an affirmative value will result in more friendly simple numeric IDs
    counting up from 1000.

* ``BOKEH_VERSION`` --- What version of BokehJS to use with ``cdn`` resources
    See the :class:`~bokeh.resources.Resources` class reference for full details.

CSS class names
---------------

The CSS for controlling Bokeh presentation are located in a ``bokeh.css`` file
that is compiled from several separate ``.less`` files in the BokehJS source
tree. All CSS classes specifically for Bokeh DOM elements are prefixed with
the string ``bk-``. For instance some examples are: ``.bk-sidebar``, ``.bk-toolbar-button``, etc.

Furthermore, BokehJS ships with its own version of `Bootstrap <http://getbootstrap.com>`_.
To prevent name collisions, the version of Bootstrap CSS that Bokeh uses has
been entirely prefixed with the prefix ``bk-bs-``.

Managing examples
-----------------

*To be added:*

* examples' naming convention (e.g. _server suffix)
* adding examples to test.yml

Choosing right types
--------------------

*To be added:*

* choosing correct types for properties (don't use Any if possible)

Managing Python modules
-----------------------

*To be added:*

* update packages in setup.py when changing module structure

Managing external JS libraries
------------------------------

*To be added:*

* adding packages to and updating bokehjs/src/vendor

Maintaining secure variables in .travis.yml
-------------------------------------------

*To be added:*

* interactions with travis-ci from CLI (gem install --user-instal travis)
* how to update secure values in .travis.yml (S3, flowdock)

Browser caching
---------------

During development, depending on the type of configured resources,
aggressive browser caching can sometimes cause new BokehJS code changes to
not be picked up. It is recommended that during normal development,
browser caching be disabled. Instructions for different browsers can be
found here:

* `Chrome <https://developer.chrome.com/devtools/docs/settings>`__
* `Firefox <https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/Mozilla_networking_preferences#Cache>`__
* `Safari <https://developer.apple.com/library/mac/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/TheDevelopMenu/TheDevelopMenu.html>`_
* `Internet Explorer <http://msdn.microsoft.com/en-us/library/hh968260(v=vs.85).aspx#cacheMenu>`__

Additionally some browsers also provide a "private mode" that may disable
caching automatically.

Even with caching disabled, on some browsers, it may still be required to
sometimes force a page reload. Keyboard shortcuts for forcing page
refreshes can be found here:

* Chrome `Windows <https://support.google.com/chrome/answer/157179?hl=en&ref_topic=25799>`__ / `OSX <https://support.google.com/chrome/answer/165450?hl=en&ref_topic=25799>`__ / `Linux <https://support.google.com/chrome/answer/171571?hl=en&ref_topic=25799>`__
* `Firefox <https://support.mozilla.org/en-US/kb/keyboard-shortcuts-perform-firefox-tasks-quickly#w_navigation>`__
* `Safari <https://developer.apple.com/library/mac/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/KeyboardShortcuts/KeyboardShortcuts.html>`__
* Internet Explorer `10 <http://msdn.microsoft.com/en-us/library/dd565630(v=vs.85).aspx>`__ / `11 <http://msdn.microsoft.com/en-us/library/ie/dn322041(v=vs.85).aspx>`__

If it appears that new changes are not being executed when they should be, it
is recommended to try this first.

BokehJS AMD module template for a model
---------------------------------------

Supposed you want to add a model for a `Button` widget. This must be accompanied
by a collection and (most often) a view. Follow this steps:

#. There is one model per source file policy. The file name is the snakified version
   of the model name. In this case `button.coffee`.
#. Choose location of the source file under `bokehjs/src/coffee`. This depends on
   the role of your model. Button is a widget, so it goes into `widget`. If you
   create a group of related models, then you may consider adding a subdirectory
   that will contain those models. Do not add top-level directories unless you
   add a completely new kind of functionality to bokeh.
#. Update `bokehjs/src/coffee/common/base.coffee`. This is required for model loader
   to be able to resolve your new model. Two additions are necessary. First, add
   module path to `define [...]`. Then update `locations: ...` mapping with
   model name and module path entry. Module path is source file path relative
   to `bokehjs/src/coffee` directory and without extension. In this case it's
   `widget/button`, so you add `widget/button` to `define [...]` and `Button:
   `widget/button` to `locations: ...`. Make sure to add them under appropriate
   sections, preferably in lexicographic order or group by functionality.
#. Create the source file using the following template::

    define [
      "underscore"
      "backbone"
      "common/continuum_view"
      "common/has_parent"
      "common/logging"
      "./button_template"
    ], (_, Backbone, continuum_view, HasParent, Logging, template) ->

      logger = Logging.logger

      class ButtonView extends continuum_view.View
        tagName: "div"
        template: template
        events:
          "click": "on_click"

        on_click: () ->
          logger.info("click!")

        initialize: (options) ->
          super(options)
          @render()
          @listenTo(@model, 'change', @render)

        render: () ->
          @$el.empty()
          html = @template(@model.attributes)
          @$el.html(html)
          return this

      class Button extends HasParent
        type: "Button"
        default_view: ButtonView

        defaults: () ->
          _.extend({}, super(), {
            text: 'Button'
          }

      class Buttons extends Backbone.Collection
        model: Button

      return {
        Model: Button
        Collection: new Buttons()
        View: ButtonView
      }

   Note that this is just a template, so make sure you change it accordingly to your
   application. However, most implementation will have to have three classes defined:
   a model, a collection and a view, which must directly or indirectly inherit from
   `HasProperties`, `Backbone.Collection` and `continuum_view.View` respectively. In
   this case you can see that the model inherits from `HasParent` which in turn
   inherits from `HasProperties`. If a view is defined, the model must have `default_view`
   defined. You are not forced to use ECO templates for rendering of a view, but it's
   encouraged, because it takes care of variable encoding, so it's less likely to
   introduce XSS vulnerabilities this way. Otherwise, take advantage of jQuery's APIs,
   like `$(...).text("foobar")`. Do *not* use plain string concatenation or interpolation,
   because you will quickly compromise security this way.

#. Test your new module in development and production modes (i.e. with `require()` and
   `r.js`). Your module can work perfectly in one mode and not load at all in the other,
   so keep that in mind.


.. _webbrowser: https://docs.python.org/2/library/webbrowser.html
