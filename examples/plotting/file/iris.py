
from bokeh.sampledata.iris import flowers
from bokeh.plotting import *

def iris():
    output_file("iris.html", title="iris.py example")

    colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

    flowers['color'] = flowers['species'].map(lambda x: colormap[x])


    #setting the name kwarg will give this scatter plot a user
    #friendly id, and the corresponding embed.js will have a nice name
    #too

    scatter(flowers["petal_length"], flowers["petal_width"], 
            color=flowers["color"], fill_alpha=0.2, radius=5, name="iris")
    return curplot()

if __name__ == "__main__":
    iris().script_direct_inject()
    # open a browser
    show()
