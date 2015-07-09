.. _userguide_webgl:

Speeding up visualizations with WebGL
=====================================


To enable WebGL support for your Bokeh visualizations

blabla


.. bokeh-plot::
    :source-position: above

    import numpy as np
    
    from bokeh.plotting import figure, show, output_file
    
    N = 10000
    
    x = np.random.normal(0, np.pi, N)
    y = np.sin(x) + np.random.normal(0, 0.2, N)
    
    output_file("scatter.html", title="scatter %i points without WebGL" % N)
    
    p = figure()
    p.scatter(x,y)
    show(p)


.. bokeh-plot::
    :source-position: above
    
    import os
    import numpy as np
    
    from bokeh.plotting import figure, show, output_file
    
    os.environ['BOKEH_WEBGL'] = '1'  # Enable WebGL
    
    N = 10000
    
    x = np.random.normal(0, np.pi, N)
    y = np.sin(x) + np.random.normal(0, 0.2, N)
    
    output_file("scatter.html", title="scatter %i points without WebGL" % N)
    
    p = figure()
    p.scatter(x,y)
    show(p)


.. bokeh-plot::
    :source-position: above

    import numpy as np
    
    from bokeh.plotting import figure, show, output_file
    
    N = 10000
    
    x = np.random.normal(0, np.pi, N)
    y = np.sin(x) + np.random.normal(0, 0.2, N)
    
    output_file("scatter.html", title="scatter %i points without WebGL" % N)
    
    p = figure()
    p.scatter(x,y)
    show(p)