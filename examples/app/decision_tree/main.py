import pandas as pd
from bokeh.plotting import figure
from bokeh.transform import factor_cmap
from bokeh.models import ColumnDataSource, LabelSet, HoverTool, WheelZoomTool, ResetTool, PanTool, Panel, Tabs, Toggle
from bokeh.models.widgets import Button, Paragraph, Select, CheckboxGroup, Slider
from bokeh.layouts import widgetbox, layout
from src.tree.generate_bokeh_data import get_bokeh_data
from math import atan, pi
from src.plot.get_data import set_new_dataset, get_all_colors
from bokeh.io import curdoc

test_percantage = 10
attr_info = Paragraph(text="""
   Choose Attributes:
""")
Instance = set_new_dataset("lens")
arrow_list = {"current": [], "previous": []}
selected_root = ""
attribute_checkbox = CheckboxGroup(labels=[attr for attr in Instance.attr_list
                                           if attr != Instance.attr_list[-1]],
                                   active=[i for i, attr in enumerate(Instance.attr_list)])
apply_changes_button = Button(label="Apply Changes", button_type="success")
arrow_button = Toggle(label="Show Arrow Labels", button_type="warning")
root_select = Select(title="Choose Root Attribute:",
                     options=['None'] + Instance.attr_list[:-1],
                     value="None")
dataset_select = Select(title="Choose Data Set:", value="lens", options=["lens", "mushrooms"])
dataset_slider = Slider(start=10, end=50, value=10, step=5, title="Test Set Percentage Split")
circle_radius = 5
TOOLTIPS = [
    ("Gini Index Value", "@{nonLeafNodes_stat}"),
    ("Instance Number", "@{instances}"),
    ("Decision", "@{decision}")
]


def get_new_data_source(df):
    ''' modular data source '''
    df["nonLeafNodes_stat"] = [str(x) for x in df["nonLeafNodes_stat"]]
    if not df['nonLeafNodes_stat'].dropna().empty:
        df['nonLeafNodes_stat'] = ["-" if i == "None" else str(round(float(i), 3)) for i in df['nonLeafNodes_stat']]
    else:
        df['nonLeafNodes_stat'] = [1]
    df['decision'] = [decision if decision else "-" for decision in df['decision']]
    df["nonLeafNodes_stat"] = df["nonLeafNodes_stat"].fillna(0)


def modify_individual_plot(mode, root):
    ''' modular plot

    Args:
        mode: select tree to be modified
        root: select root of tree
    '''
    data, width, depth, level_width, acc = get_bokeh_data(Instance,
                                                          active_attributes_list + [Instance.attr_list[-1]],
                                                          root)
    data = pd.DataFrame.from_dict(data)
    get_new_data_source(data)

    if mode == "customized":
        p.select(name="circles")[0].data_source.data = ColumnDataSource(data=data).data
        p.y_range.factors = y = [str(i) for i in range(0, width + 1)]
        p.x_range.factors = x = [str(x) for x in range(0, depth + 2)]
        arrow_data, _ = draw_arrow(width, level_width, y, x, p.select(name="circles")[0].data_source.data,
                                   p, "get_data")
        p.select(name="multi_lines")[0].data_source.data = ColumnDataSource(data=arrow_data.data).data
        test_size = int(len(Instance.data) * Instance.test_percentage / 100)
        p.title.text = "Decision Tree" + ("\t\t\t\tAccuracy (%): " + str(round(acc * 100, 1))) \
                       + "   (Test Size: " + str(test_size) + ", "\
                       + "Train Size: " + str(int(len(Instance.data) - test_size)) + ")"
    else:
        best_root_plot.select(name="circles")[0].data_source.data = ColumnDataSource(data=data).data
        best_root_plot.y_range.factors = y = [str(i) for i in range(0, width + 1)]
        best_root_plot.x_range.factors = x = [str(x) for x in range(0, depth + 2)]
        arrow_data, _ = draw_arrow(width, level_width, y, x,
                                   best_root_plot.select(name="circles")[0].data_source.data, best_root_plot,
                                   "get_data")
        best_root_plot.select(name="multi_lines")[0].data_source.data = ColumnDataSource(data=arrow_data.data).data
        test_size = int(len(Instance.data) * Instance.test_percentage / 100)
        best_root_plot.title.text = "Decision Tree" + ("\t\t\t\tAccuracy (%): " + str(round(acc * 100, 1))) \
                       + "   (Test Size: " + str(test_size) + ", "\
                       + "Train Size: " + str(int(len(Instance.data) - test_size)) + ")"


def create_figure():
    ''' get data from generate_bokeh_data and create the data source. Define widgets and create the two figures.
    Position the widgets and figures according to rows and columns

    Returns:
        layout of widgets and plots
    '''
    global active_attributes_list, p, best_root_plot

    active_attributes_list = [attr for attr in Instance.attr_list if attr != Instance.attr_list[-1]]
    source, width, depth, level_width, acc = get_bokeh_data(Instance,
                                                            active_attributes_list + [Instance.attr_list[-1]],
                                                            selected_root)
    # X and y range calculated
    y = [str(i) for i in range(0, width+1)]
    x = [str(x) for x in range(0, depth+2)]

    elements = pd.DataFrame.from_dict(source)
    df = elements.copy()
    get_new_data_source(df)
    data_source = ColumnDataSource(data=df)
    p = create_plot(width, level_width, acc, y, x, data_source)

    best_root_plot_data = data_source.data.copy()
    best_root_plot_data_source = ColumnDataSource(data=best_root_plot_data)
    best_root_plot = create_plot(width, level_width, acc, y, x, best_root_plot_data_source)
    p.select(name="decision_text").visible = False
    best_root_plot.select(name="decision_text").visible = False
    p.select(name="arrowLabels").visible = False
    best_root_plot.select(name="arrowLabels").visible = False
    tab1 = Panel(child=p, title="New Tree with Selected Root")
    tab2 = Panel(child=best_root_plot, title="Ideal Tree with Gini Index")
    tree_tab = Tabs(tabs=[tab1, tab2], width=p.plot_width)

    widgets = widgetbox(root_select, attr_info, attribute_checkbox, dataset_slider, apply_changes_button,
                        arrow_button, dataset_select, sizing_mode="stretch_both")

    main_frame = layout([[widgets, tree_tab]])
    return main_frame


# Called with respect to change in attributes check-box
def update_attributes(new):
    ''' create a new active_attributes_list when any of the checkboxes are selected '''
    active_attributes_list[:] = []
    for i in new:
        active_attributes_list.append(Instance.attr_list[i])
    if selected_root != '' and selected_root not in active_attributes_list:
        apply_changes_button.disabled = True
    else:
        apply_changes_button.disabled = False


attribute_checkbox.on_click(update_attributes)


def modify_test_percentage(_attr, _old, new):
    Instance.update(Instance.data, Instance.attr_values, Instance.attr_list,
                    Instance.attr_values_dict, Instance.attr_dict, new)


dataset_slider.on_change('value', modify_test_percentage)


def toggle_mode_set(new):
    ''' toggles settings '''
    p.select(name="circles").visible = not new
    p.select(name="detailed_text").visible = new

    best_root_plot.select(name="circles").visible = not new
    best_root_plot.select(name="detailed_text").visible = new


def turn_arrow_labels_off(new):
    ''' turn arrow labels on/off '''
    if new:
        p.select(name="arrowLabels").visible = True
        best_root_plot.select(name="arrowLabels").visible = True
        arrow_button.label = "Hide Arrow Labels"
    else:
        p.select(name="arrowLabels").visible = False
        best_root_plot.select(name="arrowLabels").visible = False
        arrow_button.label = "Show Arrow Labels"


arrow_button.on_click(turn_arrow_labels_off)


def update_root(_attr, _old, new):
    ''' change root attribute to be used for creating a new tree '''
    global selected_root
    new = root_select.options.index(new)
    method_type_selected = Instance.attr_list[new - 1]
    if new == 0:
        selected_root = ''
        apply_changes_button.disabled = False
    elif method_type_selected not in active_attributes_list:
        selected_root = method_type_selected
        apply_changes_button.disabled = True
    else:
        selected_root = method_type_selected
        apply_changes_button.disabled = False


root_select.on_change('value', update_root)


def change_dataset(_attr, _old, new):
    ''' use selected data set for the tree '''
    global selected_root, Instance
    Instance = set_new_dataset(new, test_percantage)
    selected_root = ""
    apply_changes()
    attribute_checkbox.labels = [attr for attr in Instance.attr_list if attr != Instance.attr_list[-1]]
    attribute_checkbox.active = [i for i, attr in enumerate(Instance.attr_list)]
    root_select.options = ['None'] + [attr for attr in Instance.attr_list[:-1]]


dataset_select.on_change('value', change_dataset)


def apply_changes():
    ''' compute new data source to be used for the new tree. change values of several variables to be used before
    sending them to get_bokeh_data
    '''
    modify_individual_plot("customized", selected_root)
    modify_individual_plot("optimal", "")
    if arrow_button.label == "Hide Arrow Labels":
        p.select(name="arrowLabels").visible = True
    p.select(name="multi_lines").visible = True
    apply_changes_button.disabled = False


apply_changes_button.on_click(apply_changes)


def create_plot(width, level_width, acc, y, x, data_source):
    ''' create glyphs, text and arrows and insert them into the figures

    Args:
        width: maximum width of tree
        level_width: list of width of each level
        acc: accuracy of tree
        y: y coordinates of nodes
        x: x coordinates of nodes
        data_source: data source to be used
    Returns:
        plot p
    '''
    test_size = int(len(Instance.data) * Instance.test_percentage / 100)
    title = "Decision Tree " + ("\t\t\t\tAccuracy (%): " + str(round(acc * 100, 1))) \
                                + "   (Test Size: " + str(test_size) + ", " \
                                + "Train Size: " + str(int(len(Instance.data) - test_size)) + ")"
    hover = HoverTool(names=["circles"])
    wheel = WheelZoomTool()
    wheel.zoom_on_axis = False
    p = figure(title=title, toolbar_location=None, tools=[hover, wheel, ResetTool(), PanTool()],
                x_range=x, y_range=list(y),
                tooltips=TOOLTIPS)
    p.axis.visible = False
    _, label = draw_arrow(width, level_width, y, x, data_source.data, p)
    p.toolbar.active_scroll = wheel
    p.add_layout(label)
    p.circle("y", "x", radius=circle_radius, radius_units='screen',
                         source=data_source,
                         name="circles", legend="attribute_type",
                         color=factor_cmap('attribute_type',
                                           palette=get_all_colors(), factors=Instance.all_attr_list))
    # Final settings
    p.outline_line_color = "white"
    p.grid.grid_line_color = None
    p.axis.axis_line_color = None
    p.axis.major_tick_line_color = None
    p.axis.major_label_standoff = 0
    p.legend.orientation = "vertical"
    p.legend.location = "top_right"
    return p


def draw_arrow(width, level_width, y, x, source, p, mode="draw"):
    ''' draws and returns arrows and the labels. calculates arrow widths from number of instances

    Args:
        width: maximum width of tree
        level_width: list of width of each level
        y: y coordinates of nodes
        x: x coordinates of nodes
        source (ColumnDataSource) : source
        p: plot p to be drawn on
        mode: select between getting arrow data or drawing them
    Returns:
        arrow data source and arrow labels
    '''
    arrow_coordinates = {"x_start": [], "x_end": [], "y_start": [], "y_end": [], "x_avg": [], "y_avg": [],
                         "label_name": [], "instances": [], "angle": [], "xs": [], "ys": []}
    for i in range(width):
        x_offset = 0
        for j in range(level_width[i]):
            offset = sum(level_width[:i])
            if source["attribute_type"][offset + j] != Instance.attr_list[-1]:
                children_names = Instance.attr_values_dict[source["attribute_type"][offset + j]]
                number_of_children = len(children_names)
                for index in range(number_of_children):
                    x_start = source["y"][offset + j]
                    x_end = source["y"][x_offset + index + sum(level_width[: i + 1])]
                    y_start = source["x"][offset + j]
                    y_end = source["x"][index + sum(level_width[: i + 1])]
                    if not x_end-x_start:
                        angle = -pi/2
                    else:
                        angle = atan((y_end - y_start) / (x_end - x_start) *
                                     (len(x) / len(y)) * (p.plot_height/p.plot_width))
                    arrow_coordinates["x_start"].append(x_start)
                    arrow_coordinates["x_end"].append(x_end)
                    arrow_coordinates["y_start"].append(y_start)
                    arrow_coordinates["y_end"].append(y_end)
                    arrow_coordinates["x_avg"].append((x_start + x_end) / 2)
                    arrow_coordinates["angle"].append(angle)
                    arrow_coordinates["y_avg"].append((y_start + y_end) / 2)
                    arrow_coordinates["label_name"].append(children_names[index])
                    arrow_coordinates["instances"].append(source["instances"][index + sum(level_width[: i + 1])])
                x_offset += number_of_children

    arrow_instance_min = min((int(x) for x in arrow_coordinates["instances"]), default=2)
    arrow_instance_max = max((int(x) for x in arrow_coordinates["instances"]), default=1)

    arrow_coordinates["xs"] = [[x_start] for x_start in arrow_coordinates["x_start"]]
    for i in range(len(arrow_coordinates["x_end"])):
        arrow_coordinates["xs"][i] += [arrow_coordinates["x_end"][i]]
    arrow_coordinates["ys"] = [[y_start] for y_start in arrow_coordinates["y_start"]]
    for i in range(len(arrow_coordinates["y_end"])):
        arrow_coordinates["ys"][i] += [arrow_coordinates["y_end"][i]]
    arrow_coordinates["instances"] = [1 + 7 * (int(x) - arrow_instance_min) /
                                      (arrow_instance_max - arrow_instance_min + 1)
                                      for x in arrow_coordinates["instances"]]
    arrow_data_source = ColumnDataSource(data=pd.DataFrame.from_dict(arrow_coordinates))
    if mode == "draw":
        p.multi_line(line_width="instances", line_alpha=0.7, line_color="darkgray",
                     name="multi_lines",
                     xs="xs", ys="ys", source=arrow_data_source)
    label = LabelSet(x='x_avg', y='y_avg', angle="angle",
                     name="arrowLabels", text="label_name",
                     text_font_size="8pt", text_color="darkgray", source=arrow_data_source, text_align="center")
    return arrow_data_source, label


curdoc().add_root(create_figure())
curdoc().title = "Decision Tree Visualizer"
