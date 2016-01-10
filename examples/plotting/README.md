The example in this directory all use the [`bokeh.plotting`](http://bokeh.pydata.org/en/latest/docs/user_guide/plotting.html) 
interface. This interface is primarily centered around creating a reasonable default plot with 
appropriate axes and tools, to which you can add different visual glyphs whose properties are 
associated with your data. A simple, but typical complete example of this API looks like:

    from bokeh.plotting import figure, output_file, show
    
    p = figure()
    p.circle([1, 2, 3], [4, 5, 6], color="orange")
    
    output_file("foo.html")
    
    show(p)

There are three subdirectories:

* `file` examples that output to static HTML files

* `notebook` examples that display inline in [Jupyter](http://jupyter.org) notebooks

* `server` examples that send output to a Bokeh server, using the python client library for the server 
