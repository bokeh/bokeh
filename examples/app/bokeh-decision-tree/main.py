# -*- coding: utf-8 -*-
import pandas as pd
from bokeh.plotting import figure
from bokeh.transform import dodge, factor_cmap
from bokeh.models import ColumnDataSource, LabelSet, HoverTool, WheelZoomTool, ResetTool, PanTool, Panel, Tabs, Toggle
from bokeh.models.widgets import Button, Paragraph, Select, CheckboxGroup, Slider
from bokeh.layouts import widgetbox, layout
from Decision_Tree.ID3_Decision_Tree.generate_bokeh_data import get_bokeh_data
from math import atan, pi
from Decision_Tree.Plot.get_data import set_new_dataset, get_all_colors
from Decision_Tree.Plot.instance import Instance
from bokeh.io import curdoc

""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
"""""""""""""""""""""""""""""""""""""""GLOBAL VARIABLES START"""""""""""""""""""""""""""""""""
"""vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv"""

circles = best_circles = active_attributes_list = data_source = \
    level_width = p = arrow_data_source = best_root_plot_data_source = best_root_plot = \
    best_arrow_data_source = tree_tab = None
periods = groups = list()
width = depth = acc = int()
attr_info = Paragraph(text="""
   Choose Attributes:
""")
set_new_dataset("lens")
arrow_list = {"current": [], "previous": []}
selected_root = ""
attribute_checkbox = CheckboxGroup(labels=[attr for attr in Instance().attr_list
                                           if attr != Instance().attr_list[-1]],
                                   active=[i for i, attr in enumerate(Instance().attr_list)])
apply_changes_button = Button(label="Apply Changes", button_type="success")
decision_button = Toggle(label="Show Labels", button_type="warning")
arrow_button = Toggle(label="Show Arrow Labels", button_type="warning")
root_select = Select(title="Choose Root Attribute:",
                     options=['None'] + Instance().attr_list[:-1],
                     value="None")
dataset_select = Select(title="Choose Data Set:", value="lens", options=["lens", "mushrooms"])
dataset_slider = Slider(start=10, end=50, value=10, step=5, title="Test Set Percentage Split")
circle_radius = 5
TOOLTIPS = [
    ("Gini Index Value", "@{nonLeafNodes_stat}"),
    ("Instance Number", "@{instances}"),
    ("Decision", "@{decision}")
]

"""^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^""
"""""""""""""""""""""""""""""""""" GLOBAL VARIABLES END """""""""""""""""""""""""""""""""""""""""
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""


def get_new_data_source(df):
    """
    modular data source
    """
    df["nonLeafNodes_stat"] = [str(x) for x in df["nonLeafNodes_stat"]]
    if not df['nonLeafNodes_stat'].dropna().empty:
        df['nonLeafNodes_stat'] = ["-" if i == "None" else str(round(float(i), 3)) for i in df['nonLeafNodes_stat']]
    else:
        df['nonLeafNodes_stat'] = [1]
    df['decision'] = [decision if decision else "-" for decision in df['decision']]
    df["nonLeafNodes_stat"] = df["nonLeafNodes_stat"].fillna(0)


def modify_individual_plot(mode, root):
    """
    modular plot
    """
    global p, data_source, active_attributes_list, arrow_data_source, width, depth, level_width, acc, periods, groups,\
        best_root_plot, best_root_plot_data_source, best_arrow_data_source

    data, width, depth, level_width, acc = get_bokeh_data(active_attributes_list + [Instance().attr_list[-1]], root)
    data = pd.DataFrame.from_dict(data)
    get_new_data_source(data)

    if mode == "customized":
        data_source.data = ColumnDataSource(data=data).data
        p.y_range.factors = periods = [str(i) for i in range(0, width + 1)]
        p.x_range.factors = groups = [str(x) for x in range(0, depth + 2)]
        arrow_data, _ = draw_arrow(data_source.data, p, "get_data")
        arrow_data_source.data = ColumnDataSource(data=arrow_data.data).data
        p.title.text = "Decision Tree" + ("\t\t\t\tAccuracy (%): " + str(round(acc * 100, 1)) if acc else "")
    else:
        best_root_plot_data_source.data = ColumnDataSource(data=data).data
        best_root_plot.y_range.factors = periods = [str(i) for i in range(0, width + 1)]
        best_root_plot.x_range.factors = groups = [str(x) for x in range(0, depth + 2)]
        arrow_data, _ = draw_arrow(best_root_plot_data_source.data, best_root_plot,
                                   "get_data")
        best_arrow_data_source.data = ColumnDataSource(data=arrow_data.data).data
        best_root_plot.title.text = "Decision Tree" + ("\t\t\t\tAccuracy (%): "
                                                       + str(round(acc * 100, 1)) if acc else "")


def create_figure():
    """
    get data from generate_bokeh_data and create the data source. Define widgets and create the two figures.
    Position the widgets and figures according to rows and columns
    :return: send layout of widgets and plots back to Bokeh
    """
    global active_attributes_list, width, depth, level_width, acc, periods, groups, data_source,\
        attr_info, attribute_checkbox, apply_changes_button, decision_button, arrow_button, root_select,\
        dataset_select, dataset_slider, p, arrow_data_source, circles, best_circles,\
        best_root_plot, best_root_plot_data_source, tree_tab, best_arrow_data_source

    active_attributes_list = [attr for attr in Instance().attr_list if attr != Instance().attr_list[-1]]
    source, width, depth, level_width, acc = get_bokeh_data(active_attributes_list
                                                            + [Instance().attr_list[-1]], selected_root)
    # X and y range calculated
    periods = [str(i) for i in range(0, width+1)]
    groups = [str(x) for x in range(0, depth+2)]

    elements = pd.DataFrame.from_dict(source)
    df = elements.copy()
    get_new_data_source(df)
    data_source = ColumnDataSource(data=df)
    p, arrow_data_source, circles = create_plot("customized")

    best_root_plot_data = data_source.data.copy()
    best_root_plot_data_source = ColumnDataSource(data=best_root_plot_data)
    best_root_plot, best_arrow_data_source, best_circles = create_plot("optimal")
    p.select(name="decision_text").visible = False
    best_root_plot.select(name="decision_text").visible = False
    p.select(name="arrowLabels").visible = False
    best_root_plot.select(name="arrowLabels").visible = False

    tab1 = Panel(child=p, title="New Tree with Selected Root")
    tab2 = Panel(child=best_root_plot, title="Ideal Tree with Gini Index")
    tree_tab = Tabs(tabs=[tab1, tab2], width=p.plot_width)

    widgets = widgetbox(root_select, attr_info, attribute_checkbox, dataset_slider, apply_changes_button,
                        decision_button, arrow_button, dataset_select, sizing_mode="stretch_both")

    main_frame = layout([[widgets, tree_tab]])
    return main_frame


# Called with respect to change in attributes check-box
def update_attributes(new):
    """
    create a new active_attributes_list when any of the checkboxes are selected
    """
    global selected_root
    active_attributes_list[:] = []
    for i in new:
        active_attributes_list.append(Instance().attr_list[i])
    if selected_root != '' and selected_root not in active_attributes_list:
        apply_changes_button.disabled = True
    else:
        apply_changes_button.disabled = False


attribute_checkbox.on_click(update_attributes)


def modify_test_percentage(_attr, _old, new):
    Instance().update(Instance().data, Instance().attr_values, Instance().attr_list,
                      Instance().attr_values_dict, Instance().attr_dict,
                      new)


dataset_slider.on_change('value', modify_test_percentage)


def toggle_mode_set(new):
    """
    toggles settings
    """
    p.select(name="circles").visible = not new
    p.select(name="detailed_text").visible = new

    best_root_plot.select(name="circles").visible = not new
    best_root_plot.select(name="detailed_text").visible = new

    if decision_button.label == "Show Labels":
        p.select(name="decision_text").visible = not new
        best_root_plot.select(name="decision_text").visible = not new
    decision_button.disabled = new


def turn_decision_off(new):
    """
    turn decision text on/off
    """
    if new:
        p.select(name="decision_text").visible = True
        best_root_plot.select(name="decision_text").visible = True
        decision_button.label = "Hide Labels"
    else:
        p.select(name="decision_text").visible = False
        best_root_plot.select(name="decision_text").visible = False
        decision_button.label = "Show Labels"


decision_button.on_click(turn_decision_off)


def turn_arrow_labels_off(new):
    """
    turn arrow labels on/off
    """
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
    """
    change root attribute to be used for creating a new tree
    """
    global selected_root
    new = root_select.options.index(new)
    method_type_selected = Instance().attr_list[new - 1]
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
    """
    use selected dataset for the tree
    """
    global selected_root
    set_new_dataset(new)
    selected_root = ""
    apply_changes()
    attribute_checkbox.labels = [attr for attr in Instance().attr_list if attr != Instance().attr_list[-1]]
    attribute_checkbox.active = [i for i, attr in enumerate(Instance().attr_list)]
    root_select.options = ['None'] + [attr for attr in Instance().attr_list[:-1]]


dataset_select.on_change('value', change_dataset)


def apply_changes():
    """
    compute new data source to be used for the new tree. change values of several variables to be used before
    sending them to get_bokeh_data
    """
    modify_individual_plot("customized", selected_root)
    modify_individual_plot("optimal", "")
    if decision_button.label == "Hide Labels":
        p.select(name="decision_text").visible = True
    if arrow_button.label == "Hide Arrow Labels":
        p.select(name="arrowLabels").visible = True
    p.select(name="multi_lines").visible = True
    apply_changes_button.disabled = False


apply_changes_button.on_click(apply_changes)


def create_plot(mode):
    """
    create glyphs, text and arrows and insert them into the figures
    :param mode: customized or optimal?
    :return: plot p and the arrow data source
    """
    title = "Decision Tree " + ("\t\t\t\tAccuracy (%): " + str(round(acc * 100, 1)) if acc else "")
    hover = HoverTool(names=["circles"])
    wheel = WheelZoomTool()
    _p = figure(title=title, toolbar_location="below", tools=[hover, wheel, ResetTool(), PanTool()],
                x_range=groups, y_range=list(periods),
                tooltips=TOOLTIPS)
    _p.axis.visible = False
    _arrow_data_source, label = \
        draw_arrow(data_source.data if mode == "customized" else best_root_plot_data_source.data, _p)
    _p.toolbar.active_scroll = wheel
    _p.add_layout(label)
    _circles = _p.circle("y", "x", radius=circle_radius, radius_units='screen',
                         source=data_source if mode == "customized" else best_root_plot_data_source,
                         name="circles", legend="attribute_type",
                         color=factor_cmap('attribute_type',
                                           palette=get_all_colors(), factors=Instance().all_attr_list))

    _p.text(x="leafNodes_y", text_color="orange", y=dodge("leafNodes_x", -0.4),
            name="decision_text", text="decision",
            source=data_source if mode == "customized" else best_root_plot_data_source,
            text_align="center", text_baseline="middle", text_font_size="8pt")

    # Final settings
    _p.outline_line_color = "white"
    _p.grid.grid_line_color = None
    _p.axis.axis_line_color = None
    _p.axis.major_tick_line_color = None
    _p.axis.major_label_standoff = 0
    _p.legend.orientation = "vertical"
    _p.legend.location = "top_right"
    return _p, _arrow_data_source, _circles


def draw_arrow(source, _p, mode="draw"):
    """
    draws and returns arrows and the labels. calculates arrow widths from number of instances
    :param source: source
    :param _p: plot p to be drawn on
    :param mode: when mode isn't draw, it means that the function is being called only for getting the arrow data source
    :return: returns arrow data source, arrows and labels
    """
    arrow_coordinates = {"x_start": [], "x_end": [], "y_start": [], "y_end": [], "x_avg": [], "y_avg": [],
                         "label_name": [], "instances": [], "angle": [], "xs": [], "ys": []}
    for i in range(width):
        x_offset = 0
        for j in range(level_width[i]):
            offset = sum(level_width[:i])
            if source["attribute_type"][offset + j] != Instance().attr_list[-1]:
                children_names = Instance().attr_values_dict[source["attribute_type"][offset + j]]
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
                                     (len(groups) / len(periods)) * (_p.plot_height/_p.plot_width))
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
    _arrow_data_source = ColumnDataSource(data=pd.DataFrame.from_dict(arrow_coordinates))
    if mode == "draw":
        _p.multi_line(line_width="instances", line_alpha=0.7, line_color="darkgray",
                      name="multi_lines",
                      xs="xs", ys="ys", source=_arrow_data_source)
    label = LabelSet(x='x_avg', y='y_avg', angle="angle",
                     name="arrowLabels", text="label_name",
                     text_font_size="8pt", text_color="darkgray", source=_arrow_data_source)
    return _arrow_data_source, label


curdoc().add_root(create_figure())
curdoc().title = "Decision Tree Visualizer"
