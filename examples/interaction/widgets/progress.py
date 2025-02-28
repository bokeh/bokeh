from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import Button, CustomJS, Progress

progress = Progress(value=0, min=0, max=179, label="Processing item @{index} of @{total} (@{percent}%)", width=300)

button = Button(label="Start computation")
button.js_on_click(CustomJS(
    args=dict(progress=progress, button=button),
    code="""
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
export default async ({progress, button}) => {
    button.disabled = true
    progress.value = 0
    try {
        while (!progress.has_finished) {
            const ms = Math.random()*100
            await delay(ms)
            progress.increment(1)
        }
    } finally {
        button.disabled = false
    }
}
"""))

show(row([button, progress]))
