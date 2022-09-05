.. _release-1-4-0:

1.4.0
=====

Bokeh Version ``1.4.0`` (October 2019) is a significant release that marks the
end of support for Python 2.7 and Python 3.5 and earlier.

*Starting with the next release, Bokeh 2.0, Python 3.6 or later will be required.*

This release includes several important fixes and features:

* Complete new site design for documentation, including search  :bokeh-issue:`8209`
* Jupyterlab ipywidgets integrations  :bokeh-issue:`9137`
* Security related improvements to the Bokeh server   :bokeh-issue:`9139`, :bokeh-issue:`9140`
* New integration added fot Django Channels   :bokeh-issue:`9009`
* Precompiled Bokeh extensions   :bokeh-issue:`9196`
* Legend improvements  :bokeh-issue:`9135`,  :bokeh-issue:`9144`

And several other bug fixes and docs additions. For full details see the
:bokeh-tree:`CHANGELOG`. :bokeh-issue:`8676`

.. _release-1-4-0-migration:

`Migration Guide <releases.html#release-1-4-0-migration>`__
-----------------------------------------------------------

Deprecations
~~~~~~~~~~~~

The overburdened ``legend`` keyword argument to glyph methods is deprecated. It
is replaced with three purpose-specific keyword arguments:

* ``legend_label="some_label"``

    This will always produce a legend item with exactly the given label.

* ``legend_field="some_colname"``

    This will produce a "grouped" legend, where the grouping is done by
    JavaScript in the browser. Python code will only see a single legend item
    representing the grouping.

* ``legend_group="some_colname"``

    This will produce a "grouped" legend, where the grouping is done by *Python*
    code, bedore the content is rendered in the browser. Python code will see
    individual legend items for each group.

These keywords remove the ambiguities due to the "automagic" operation of
``legend`` with respect to legend grouping. The existing ``legend`` keyword
argument will continue to function until at least version 3.0 of Bokeh.
