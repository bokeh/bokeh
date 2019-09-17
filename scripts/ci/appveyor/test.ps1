set-psdebug -trace 2

function test() {
    conda install --quiet $(python scripts/deps.py run test).split()
    conda install --quiet phantomjs
    bokeh sampledata
}

test
