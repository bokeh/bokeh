from bokeh.charts import Bar, output_file, show
from bokeh.charts.operations import blend
from bokeh.charts._attributes import cat, color
from bokeh.charts.utils import df_from_json
from bokeh.sampledata.olympics2014 import data

df = df_from_json(data)

# filter by countries with at least one medal and sort
df = df[df['medals.total'] > 0]
df = df.sort("medals.total", ascending=False)
df = df.rename(columns={'medals.gold': 'gold', 'medals.silver': 'silver',
                        'medals.bronze': 'bronze', 'medals.total': 'total'})

bar = Bar(df,
          values=blend('bronze', 'silver', 'gold', name='medals', labels_name='medal'),
          label=cat(columns='abbr', sort=False),
          stack=cat(columns='medal', sort=False),
          color=color(columns='medal', palette=['SaddleBrown', 'Silver', 'Goldenrod'],
                      sort=False),
          legend='top_right',
          title="Stacked bars")

output_file("stacked_bar.html")
show(bar)
