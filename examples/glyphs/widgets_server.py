from __future__ import print_function

from bokeh.session import PlotServerSession

try:
    session = PlotServerSession(serverloc="http://localhost:5006", username="defaultuser", userapikey="nokey")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

sess.use_doc('widgets_server')

if __name__ == "__main__":
    print("\nPlease visit http://localhost:5006/bokeh to see the plots\n")
