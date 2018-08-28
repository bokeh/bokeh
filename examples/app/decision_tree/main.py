from bokeh.models import ColumnDataSource, Panel, Tabs, Toggle
from bokeh.models.widgets import Button, CheckboxGroup, Paragraph, Select, Slider
from bokeh.io import curdoc
from bokeh.layouts import layout, widgetbox
from src.plot.get_data import set_new_dataset
from src.plot.utils import create_plot, get_new_data_source, modify_individual_plot
from src.tree.generate_bokeh_data import get_bokeh_data
import pandas as pd

Instance = set_new_dataset("lens")

test_percentage = 10
attr_info = Paragraph(text="""
   Choose Attributes:
""")
arrow_list = {"current": [], "previous": []}
selected_root = ""
attribute_checkbox = CheckboxGroup()
apply_changes_button = Button(label="Apply Changes", button_type="success")
arrow_button = Toggle(label="Show Arrow Labels", button_type="warning")
root_select = Select(title="Choose Root Attribute:")
dataset_select = Select(title="Choose Data Set:", value="lens", options=["lens", "mushrooms"])
dataset_slider = Slider(start=10, end=50, value=10, step=5, title="Test Set Percentage Split")


def apply_changes():
    ''' compute new data source to be used for the new tree. change values of several variables to be used before
    sending them to get_bokeh_data
    '''
    modify_individual_plot(selected_root, p, Instance, active_attributes_list)
    modify_individual_plot("", best_root_plot, Instance, active_attributes_list)
    if arrow_button.label == "Hide Arrow Labels":
        p.select(name="arrowLabels").visible = True
    p.select(name="multi_lines").visible = True
    apply_changes_button.disabled = False


apply_changes_button.on_click(apply_changes)


def change_dataset(_attr, _old, new):
    ''' use selected data set for the tree '''
    global selected_root, Instance
    Instance = set_new_dataset(new, test_percentage)
    selected_root = ""
    attribute_checkbox.labels = [attr for attr in Instance.attr_list if attr != Instance.attr_list[-1]]
    attribute_checkbox.active = [i for i, attr in enumerate(Instance.attr_list)]
    root_select.options = ['None'] + [attr for attr in Instance.attr_list[:-1]]
    apply_changes()


dataset_select.on_change('value', change_dataset)


def create_figure():
    ''' get data from generate_bokeh_data and create the data source. Define widgets and create the two figures.
    Position the widgets and figures according to rows and columns
    Returns:
        layout of widgets and plots
    '''
    global active_attributes_list, p, best_root_plot

    active_attributes_list = [attr for attr in Instance.attr_list if attr != Instance.attr_list[-1]]
    source, depth, width, level_width, acc = get_bokeh_data(Instance,
                                                            active_attributes_list + [Instance.attr_list[-1]],
                                                            selected_root)
    # X and y range calculated
    y = [str(i) for i in range(0, depth+1)]
    x = [str(x) for x in range(0, width+2)]

    elements = pd.DataFrame.from_dict(source)
    df = elements.copy()
    get_new_data_source(df)
    data_source = ColumnDataSource(data=df)
    p = create_plot(depth, level_width, acc, x, y, data_source, Instance)

    best_root_plot_data = data_source.data.copy()
    best_root_plot_data_source = ColumnDataSource(data=best_root_plot_data)
    best_root_plot = create_plot(depth, level_width, acc, x, y, best_root_plot_data_source, Instance)
    p.select(name="decision_text").visible = False
    best_root_plot.select(name="decision_text").visible = False
    p.select(name="arrowLabels").visible = False
    best_root_plot.select(name="arrowLabels").visible = False
    tab1 = Panel(child=p, title="New Tree with Selected Root")
    tab2 = Panel(child=best_root_plot, title="Ideal Tree with Gini Index")
    tree_tab = Tabs(tabs=[tab1, tab2], width=p.plot_width)
    change_dataset("", "", "lens")

    widgets = widgetbox(root_select, attr_info, attribute_checkbox, dataset_slider, apply_changes_button,
                        arrow_button, dataset_select, sizing_mode="stretch_both")

    main_frame = layout([[widgets, tree_tab]])
    return main_frame


def modify_test_percentage(_attr, _old, new):
    Instance.update(Instance.data, Instance.attr_values, Instance.attr_list,
                    Instance.attr_values_dict, Instance.attr_dict, new)


dataset_slider.on_change('value', modify_test_percentage)


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


curdoc().add_root(create_figure())
curdoc().title = "Decision Tree Visualizer"
