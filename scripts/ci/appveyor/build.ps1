set-psdebug -trace 2

function build() {
    npm install -g npm
    Push-Location -Path ".\\bokehjs"
    npm ci --no-progress
    Pop-Location
    python setup.py -q install --build-js
}

build
