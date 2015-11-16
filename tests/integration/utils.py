from __future__ import absolute_import, print_function

from bokeh.models import ColumnDataSource, Rect, BoxSelectTool, CustomJS


class value_to_be_present_in_datahash(object):
    """
    An expectation for checking if the given value is present in the element's data-hash
    """
    def __init__(self, element, value):
        self.element = element
        self.value = value

    def __call__(self, driver):
        data_hash = self.element.get_attribute("data-hash")
        if data_hash == self.value:
            return True
        else:
            print(data_hash)
            return False


class element_to_start_resizing(object):
    """
    An expectation for checking if an element has started resizing
    """
    def __init__(self, element):
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver):
        current_width = self.element.size['width']
        if self.previous_width != current_width:
            return True
        else:
            self.previous_width = current_width
            return False


class element_to_finish_resizing(object):
    """
    An expectation for checking if an element has finished resizing
    """
    def __init__(self, element):
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver):
        current_width = self.element.size['width']
        if self.previous_width == current_width:
            return True
        else:
            self.previous_width = current_width
            return False


def add_visual_box_select(plot):
    """
    Add a box select tool to your plot which draws a Rect on box select. This can
    be useful for debugging where selenium is hitting the canvas.

    To draw a box, with selenium, you can do something like this:
    ````
        canvas = selenium.find_element_by_tag_name('canvas')

        actions = ActionChains(selenium)
        actions.move_to_element_with_offset(canvas, PLOT_DIM * 0.25, PLOT_DIM * 0.25)
        actions.click_and_hold()
        actions.move_by_offset(PLOT_DIM * 0.5, PLOT_DIM * 0.5)
        actions.release()
        actions.perform()
    ````
    """
    source = ColumnDataSource(data=dict(x=[], y=[], width=[], height=[]))
    rect = Rect(x='x', y='y', width='width', height='height', fill_alpha=0.3, fill_color='#009933')
    callback = CustomJS(args=dict(source=source), code="""
        // get data source from Callback args
        var data = source.get('data');

        /// get BoxSelectTool dimensions from cb_data parameter of Callback
        var geometry = cb_data['geometry'];

        /// calculate Rect attributes
        var width = geometry['x1'] - geometry['x0'];
        var height = geometry['y1'] - geometry['y0'];
        var x = geometry['x0'] + width/2;
        var y = geometry['y0'] + height/2;

        /// update data source with new Rect attributes
        data['x'].push(x);
        data['y'].push(y);
        data['width'].push(width);
        data['height'].push(height);

        // trigger update of data source
        source.trigger('change');
    """)
    box_select = BoxSelectTool(callback=callback)
    plot.add_glyph(source, rect, selection_glyph=rect, nonselection_glyph=rect)
    plot.add_tools(box_select)
    return plot
