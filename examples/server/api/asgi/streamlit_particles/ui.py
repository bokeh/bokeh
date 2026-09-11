from uuid import uuid4

import streamlit as st
from streamlit_particles.modes import MODES
from streamlit_particles.state import viewer_states

PAGE_TITLE = "Streamlit-controlled particle simulation"

st.set_page_config(page_title=PAGE_TITLE, layout="wide")
st.html("""
<style>
  [data-testid="stMainBlockContainer"] { padding-top: 2rem; }
</style>
""")
st.title(PAGE_TITLE)
st.caption("Per-viewer Python state with browser-side CustomJS and Bokeh WebGL rendering")
st.write(
    "Streamlit stores this viewer's controls in Python. When the mode changes, Python sends "
    "the matching CustomJS kernel to Bokeh. On resets, Bokeh's Python application initializes "
    "the NumPy arrays once. JavaScript then evolves 50,000 particles in this browser while "
    "Bokeh renders them with WebGL. Particle positions do not cross the WebSocket for each frame.",
)
st.caption(
    "Demo limitation: the viewer registry is process-local; a multi-worker deployment would "
    "use an external store or message broker.",
)

viewer_id = st.session_state.setdefault("viewer_id", uuid4().hex)
viewer_state = viewer_states.for_viewer(viewer_id)
initial = viewer_state.read()
for name in ("strength", "rate", "mode", "paused", "show_centers"):
    st.session_state.setdefault(name, getattr(initial, name))


def publish(*, reset: bool = False) -> None:
    previous = viewer_state.read()
    mode = st.session_state["mode"]
    viewer_state.update(
        strength=st.session_state["strength"],
        rate=st.session_state["rate"],
        mode=mode,
        paused=st.session_state["paused"],
        show_centers=st.session_state["show_centers"],
        reset=reset or mode != previous.mode,
    )


def reset_simulation() -> None:
    publish(reset=True)


def select_mode(mode: str) -> None:
    st.session_state["mode"] = mode
    publish()


@st.fragment
def controls() -> None:
    mode_column, reset_column, pause_column, centers_column = st.columns(
        [2, 0.7, 1, 1],
        vertical_alignment="bottom",
    )
    with mode_column:
        st.caption("Simulation")
        selected_mode = st.session_state["mode"]
        with st.popover(MODES[selected_mode].label, width="stretch"):
            mode_columns = st.columns(2)
            for index, (name, mode) in enumerate(MODES.items()):
                with mode_columns[index % 2]:
                    st.button(
                        mode.label,
                        key=f"select-{name}",
                        type="primary" if name == selected_mode else "secondary",
                        on_click=select_mode,
                        args=(name,),
                        width="stretch",
                    )
    with reset_column:
        st.button("Reset", on_click=reset_simulation, use_container_width=True)
    with pause_column:
        st.toggle("Paused", key="paused", on_change=publish)
    with centers_column:
        st.toggle("Show centers", key="show_centers", on_change=publish)

    mode = MODES[st.session_state["mode"]]
    strength_column, rate_column = st.columns(2)
    with strength_column:
        st.slider(
            mode.controls[0],
            0.2,
            3.0,
            step=0.1,
            key="strength",
            on_change=publish,
        )
    with rate_column:
        st.slider(
            mode.controls[1],
            0.2,
            5.0,
            step=0.1,
            key="rate",
            on_change=publish,
        )


@st.fragment(run_every=0.5)
def details() -> None:
    current = viewer_state.read()
    mode = MODES[current.mode]
    wikipedia_title, wikipedia_url = mode.wikipedia
    source_links = " · ".join(
        f"[Source equations: {title}]({url})"
        for title, url in mode.references
    )
    math_column, monitor_column = st.columns([3, 2])

    with math_column, st.container(border=True):
        st.markdown("**Mathematical model**")
        st.latex(mode.equation)
        st.caption(mode.source_match)
        st.markdown(
            f"References: [Wikipedia: {wikipedia_title}]({wikipedia_url}) · {source_links}",
        )

    with monitor_column, st.container(border=True):
        st.markdown("**Viewer monitor**")
        strength, rate, revision = st.columns(3)
        strength.metric(mode.controls[0], f"{current.strength:.1f}")
        rate.metric(mode.controls[1], f"{current.rate:.1f}")
        revision.metric("Revision", current.revision)
        detail = f"{mode.label} is paused." if current.paused else mode.description
        st.caption(detail)


controls()
details()
st.iframe(f"/bkapp/?viewer={viewer_id}", height=660)
