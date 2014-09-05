.. _userguid_ar:

Abstract Rendering
==================

.. contents::
    :local:
    :depth: 2

 Abstract rendering is a bin-based rendering technique
 that provides greater control over a visual representation
 and access to larger data sets through server-side processing.
 There are two interfaces for abstract rendering in Bokeh:
 (1) a low-level `functions' interface that provides access to the details
 of the abstract rendering process and
 (2) a high-level `recipies' interface that provides common abstract rendering
 configurations with good defaults and only optional parameterization.
 The recipies interface actually produces elements in the low-level
 interface, but through a level of indirection to simplify construction.

 At a high level, all abstract rendering applications start with a plot.
 Abstract rendering takes the plot and renders it to a canvas that uses
 data values instead of colors and bins instead of pixels. With the data
 values collected into bins, the plot can be analized and transformed to 
 ensure the true nature of the underlying data source is preserved.  
 This second step is referred to as 'shading' 
 (older versions of abstract rendering called this step 'transfer', 
 but the current version is more general and thus the name change).
 
 The abstract rendering interfaces take an existing Bokeh plot as a parameter.
 They produce binning and shading processes, which are  attached to a data source.
 They also produce a new plot to consume the results of the shading. 
 and produce a new plot. By default, the old plot is removed.  
 Abstract rendering is tied to the bokeh server infrastructure, and can
 thus only be used with an active bokeh server and with plots employing
 a ServerDataSource.

Recipies Interface
---------------------

Abstract rendering recipes provide direct access to common abstract
rendering operations.  The recipes interface is declarative,
in that a high-level operation is requested and the abstract rendering
system constructs the proper low-level function combinations.  There 
are currently three recipes

- **heatmap:** 
  Heatmap converts a plot of points into a plot of densities.
  The most common scenario is a recipes with one item type and overplotting issues.
  Adjacency-matrix based graph visualizations also benefit from a heatmap if there is more than one node per pixel row/col.
  The basic process is that each bin collects the count of the number of items
  that fall into the bin.  After that, a color scale is constructed that ensures
  the full range of the data covers is covered by the color scale.

  Heatmap is applicable when there is only one category and when the number of items
  at a given location is of interest.  In many ways, it is a replacement for 
  alpha composition, but more flexible.  It should be used when the dynamic
  range of color composition of the visualization is essential to interpretation
  and there is only one category. The color scale can be perceptually corrected
  and include a large step from  zero items to many (to ensure visibility of outliers).
  
- **hdalpha:**
  HDAlpha converts a plot of points into a plot of densities, just like heatmap.
  However, heatmap is restricted to a single category, while hdalpha works with multiple categories of data.
  The hdalpha recipe is useful for scatterplots with multiple categories or
  geo-located event data where events are of different types. 
  In the hdalpha recipe, categories are binned separately and a color ramp is made for each category.
  Additionally, the composition between categories is also controlled to prevent over-saturation. 
  

- **contours:**
  The contours recipe converts a plot of points into ISO contours.
  It works on the same principal as the heatmap recipe (binning counts),
  but instead of building color ramps, the contours recipe produces 
  a number of regions representing ranges of counts. 


Functions Interface
---------------------


[PLACEHOLDER for AR docs]
