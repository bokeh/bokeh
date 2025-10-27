.. _accessibility:

Accessibility Best Practices
============================

This guide provides recommendations for creating accessible visualizations with Bokeh that are usable by people with diverse abilities and disabilities.

Color Accessibility
-------------------

Color Vision Deficiency Considerations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Approximately 8% of men and 0.5% of women have color vision deficiency. Consider these practices:

- Use color palettes that are distinguishable for common types of color blindness
- Avoid relying solely on color to convey information
- Use texture, patterns, or shapes in addition to color

Recommended Color Palettes
~~~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh provides several color palettes that are colorblind-friendly:

.. code-block:: python

    from bokeh.palettes import Colorblind8, TolRainbow, Category10_8
    
    # Colorblind-friendly palettes
    palette = Colorblind8
    palette = TolRainbow
    palette = Category10_8

Contrast Guidelines
~~~~~~~~~~~~~~~~~~~

Ensure sufficient contrast between foreground and background:

- Text should have at least 4.5:1 contrast ratio against background
- Graphical elements should have at least 3:1 contrast ratio

Text and Descriptions
---------------------

Alternative Text
~~~~~~~~~~~~~~~~

Provide text descriptions for plots when possible:

.. code-block:: python

    from bokeh.models import Div
    
    # Add descriptive text near your plot
    description = Div(text="""
    <p>This scatter plot shows the relationship between X and Y variables. 
    Each point represents an observation, with size indicating magnitude.</p>
    """)

Text Sizing and Spacing
~~~~~~~~~~~~~~~~~~~~~~~

- Use minimum 12px font size for labels
- Ensure adequate spacing between interactive elements
- Use clear, descriptive labels for axes and legends

Interactive Elements
-------------------

Tool Considerations
~~~~~~~~~~~~~~~~~~~

Disable unnecessary interactive tools when they don't add value:

.. code-block:: python

    from bokeh.plotting import figure
    
    # Only include necessary tools
    p = figure(tools="pan,wheel_zoom,reset", active_scroll="wheel_zoom")
    
    # Or disable all tools for static plots
    p = figure(tools="")

Keyboard Navigation
~~~~~~~~~~~~~~~~~~~

- Ensure all interactive elements can be accessed via keyboard
- Provide clear focus indicators
- Test tab order through your visualization

Pan and Zoom Limits
~~~~~~~~~~~~~~~~~~~

Set appropriate limits for pan and zoom interactions:

.. code-block:: python

    from bokeh.plotting import figure
    
    p = figure(x_range=(0, 100), y_range=(0, 100))
    
    # Set explicit data bounds
    p.x_range.bounds = (0, 100)
    p.y_range.bounds = (0, 100)

Multiple Representation
-----------------------

Data Tables
~~~~~~~~~~~

Consider providing data in tabular form alongside visualizations:

.. code-block:: python

    from bokeh.models import DataTable, TableColumn
    from bokeh.models import ColumnDataSource
    
    # Create a data table
    source = ColumnDataSource(data)
    columns = [
        TableColumn(field="x", title="X Values"),
        TableColumn(field="y", title="Y Values"),
    ]
    data_table = DataTable(source=source, columns=columns, width=400)

Texture and Patterns
~~~~~~~~~~~~~~~~~~~~

Use different textures or patterns when color alone is insufficient:

.. code-block:: python

    from bokeh.plotting import figure
    
    p = figure()
    
    # Use different marker types
    p.circle(x1, y1, size=10, color="blue", legend_label="Category A")
    p.square(x2, y2, size=10, color="blue", legend_label="Category B")

Testing Accessibility
---------------------

Manual Testing
~~~~~~~~~~~~~~

- Test with keyboard navigation only
- Use screen readers to verify descriptions
- Check color contrast using browser tools
- Test with color blindness simulators

Automated Testing
~~~~~~~~~~~~~~~~~

Use accessibility testing tools:

- axe-core
- Lighthouse accessibility audits
- WAVE evaluation tool

Examples
--------

Accessible Bar Chart
~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    from bokeh.plotting import figure, show
    from bokeh.models import Div, ColumnDataSource
    from bokeh.layouts import column
    from bokeh.palettes import Colorblind8
    
    # Create accessible bar chart
    categories = ['A', 'B', 'C', 'D']
    values = [10, 25, 15, 30]
    
    source = ColumnDataSource(data=dict(categories=categories, values=values))
    
    p = figure(x_range=categories, 
               height=400,
               toolbar_location=None,
               title="Accessible Bar Chart Example")
    
    p.vbar(x='categories', top='values', width=0.9, source=source,
           color=Colorblind8[0], line_color='white')
    
    # Descriptive text
    description = Div(text="""
    <h3>Bar Chart: Category Values</h3>
    <p>This bar chart shows values for four categories (A, B, C, D). 
    Category D has the highest value at 30, followed by Category B at 25.</p>
    """)
    
    # Combine plot and description
    layout = column(description, p)
    show(layout)

Additional Resources
--------------------

- `Web Content Accessibility Guidelines (WCAG) <https://www.w3.org/WAI/standards-guidelines/wcag/>`_
- `ColorBrewer <http://colorbrewer2.org/>`_ - Colorblind-safe color schemes
- `WebAIM Contrast Checker <https://webaim.org/resources/contrastchecker/>`_
