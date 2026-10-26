import streamlit as st

st.set_page_config(page_title="Bokeh Fourier studio", layout="wide")

st.title("Bokeh Fourier studio")
st.write(
    "One ASGI application on one port serves this Streamlit page and the stateful Bokeh "
    "application below. Use the controls to build a waveform from harmonics. The linked "
    "signal and spectrum share a live WebSocket session and Python callbacks.",
)
st.iframe("/bkapp/", height=800)
