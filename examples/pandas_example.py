from bokeh import mpl
import pandas
p = mpl.PlotClient('defaultuser',
                   serverloc='http://localhost:5006',
                   userapikey='nokey')
p.use_doc('pandas_example')
df = pandas.read_csv('../tests/auto-mpg.csv')
source = p.model('PandasDataSource', df=df)
source.update()
p.figure()
plot1 = p.scatter('mpg', 'weight', data_source=source)
p.figure()
plot2 = p.scatter('mpg', 'yr', data_source=source)
p.clearic()
p.pandastable(source)
p.grid([[plot1, plot2]])


