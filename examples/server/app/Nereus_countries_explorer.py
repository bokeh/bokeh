"""
A demo with the Bokeh server to explore the countries of the world along with some useful pieces of information.
Run it: bokeh serve --show app.py
See also the post here: https://discourse.bokeh.org/t/nereus-exploring-the-countries-of-the-wold/12272
"""

from bokeh.plotting import figure, curdoc
from bokeh.models import (GeoJSONDataSource, HoverTool, Div,
                         TapTool, CustomJS)
from bokeh.layouts import column
import json
import requests

def create_map():
    # Download world GeoJSON data
    url = "https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/world-countries.json"
    response = requests.get(url)
    world_geo = response.json()

    # Get country data from REST Countries API
    api_url = "https://restcountries.com/v3.1/all?fields=name,flags,population,capital,currencies,languages,area,region,subregion"
    response = requests.get(api_url)
    countries_data = response.json()

    # Create a mapping of country data
    country_info = {}
    for country in countries_data:
        common_name = country['name']['common']
        official_name = country['name']['official']
        
        # Extract currency info
        currencies = []
        if 'currencies' in country:
            for currency_code, currency_info in country['currencies'].items():
                currencies.append(f"{currency_info['name']} ({currency_code})")
        
        # Extract language info
        languages = list(country.get('languages', {}).values())
        
        info = {
            'flag_url': country['flags']['png'],
            'population': country.get('population', 'N/A'),
            'capital': ', '.join(country.get('capital', ['N/A'])),
            'area': country.get('area', 'N/A'),
            'region': country.get('region', 'N/A'),
            'subregion': country.get('subregion', 'N/A'),
            'currencies': ', '.join(currencies) or 'N/A',
            'languages': ', '.join(languages) or 'N/A'
        }
        
        country_info[common_name] = info
        country_info[official_name] = info

    # Add data to GeoJSON properties
    for feature in world_geo['features']:
        country_name = feature['properties']['name']
        if country_name in country_info:
            feature['properties'].update(country_info[country_name])

    # Create GeoJSONDataSource
    geosource = GeoJSONDataSource(geojson=json.dumps(world_geo))

    # Create figure with dark theme
    p = figure(title='Nereus: Exploring the countries of the World',
               width=1200, 
               height=600,
               toolbar_location='right',
               tools='pan,box_zoom,reset,save,wheel_zoom,tap',
               x_axis_location=None,
               y_axis_location=None,
               background_fill_color='deepskyblue',
               border_fill_color='#E3E4E0')

    # Remove grid and axes
    p.grid.grid_line_color = None
    p.axis.axis_line_color = None
    p.axis.major_tick_line_color = None
    p.axis.minor_tick_line_color = None
    p.axis.major_label_text_color = None

    # Add the map patches
    countries = p.patches('xs', 'ys', 
                         source=geosource,
                         fill_color='darkorange',
                         line_color='black',
                         line_width=1,
                         fill_alpha=1,
                         hover_fill_color='yellow',
                         hover_line_color='red',
                         hover_fill_alpha=1,
                         selection_fill_color='lime',
                         selection_line_color='black',
                         selection_fill_alpha=1,
                         nonselection_fill_color='darkorange',
                         nonselection_line_color='black',
                         nonselection_fill_alpha=1,
                         nonselection_line_width=1,
                         nonselection_line_alpha=1,


                         )

    # Add hover tool
    p.add_tools(
        HoverTool(
            tooltips="""<div style="background-color: #f0f0f0; padding: 5px; border-radius: 5px; box-shadow: 0px 0px 5px rgba(0,0,0,0.3);">        <font size="5" style="background-color: #f0f0f0; padding: 5px; border-radius: 5px;">
                <i>Country:</i> <b>@name</b> <br> 

                <i>Region:</i> <b>@region</b> <br>
            </font> </div> <style> :host { --tooltip-border: transparent;  /* Same border color used everywhere */ --tooltip-color: transparent; --tooltip-text: #2f2f2f;} </style> """,
        )
    )
    # Style the plot
    p.title.text_font_size = '20pt'
    p.title.text_font = 'helvetica'
    p.title.text_color = 'black'
    p.title.align = 'center'

    # Configure plot size and aspect ratio
    p.x_range.range_padding = 0
    p.y_range.range_padding = 0

    # Create a Div for the country info
    info_div = Div(
        text="""
        <div style="
            width: 1200px;
            height: 300px;
            background-color: #E3E4E0;
            color: black;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: helvetica;
            font-size: 16px;
            border-radius: 10px;
        ">
            <p>Click on a country to see detailed information</p>
        </div>
        """,
        width=1200,
        height=300
    )

    def format_number(num):
        if num == 'N/A':
            return "N/A"
        try:
            num = float(num)
            if num >= 1_000_000:
                return f"{num/1_000_000:.1f}M"
            if num >= 1_000:
                return f"{num/1_000:.1f}K"
            return str(int(num))
        except:
            return str(num)

    def update_info(attr, old, new):
        if new:  # If there's a selection
            index = new[0]
            # Parse the GeoJSON to get the properties
            geojson_data = json.loads(geosource.geojson)
            properties = geojson_data['features'][index]['properties']
            
            country_name = properties['name']
            flag_url = properties['flag_url']
            population = format_number(properties['population'])
            capital = properties['capital']
            area = format_number(properties['area'])
            region = properties['region']
            subregion = properties['subregion']
            currencies = properties['currencies']
            languages = properties['languages']
            
            info_div.text = f"""
                <div style="
                    width: 1200px;
                    height: 300px;
                    background-color: #E3E4E0;
                    color: black;
                    padding: 20px;
                    display: flex;
                    font-family: helvetica;
                    border-radius: 10px;
                ">
                    <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
                        <img src="{flag_url}" style="max-height: 200px; border: 1px solid #333;">
                    </div>
                    <div style="flex: 2; padding: 20px;">
                        <h2 style="margin-bottom: 20px; color: #ffd700;">{country_name}</h2>
                        <div style="display: grid; grid-template-columns: auto auto; gap: 10px;">
                            <div style="color: #888;">Capital:</div>
                            <div>{capital}</div>
                            <div style="color: #888;">Population:</div>
                            <div>{population}</div>
                            <div style="color: #888;">Area:</div>
                            <div>{area} km²</div>
                            <div style="color: #888;">Region:</div>
                            <div>{region} ({subregion})</div>
                            <div style="color: #888;">Currency:</div>
                            <div>{currencies}</div>
                            <div style="color: #888;">Languages:</div>
                            <div>{languages}</div>
                        </div>
                    </div>
                </div>
            """

    # Connect the selection to the callback
    geosource.selected.on_change('indices', update_info)

    # Create the layout
    layout = column([p, info_div])
    
    return layout

# Add the layout to the document
doc = curdoc()
doc.add_root(create_map())
doc.title = "Nereus: Interactive World Map with Country Information"
