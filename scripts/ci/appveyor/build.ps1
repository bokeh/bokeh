function build(){
    npm install -g npm
    Push-Location -Path ".\\bokehjs"
    npm install --no-save --no-progress
    Pop-Location
    python setup.py -q install --build-js
}

build
