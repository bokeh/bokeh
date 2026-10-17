# Exercise developer setup without the runner's incidental Git Bash/MSYS tools.
$ErrorActionPreference = 'Stop'
$pixi = (Get-Command pixi -CommandType Application).Source
$git = (Get-Command git -CommandType Application).Source
$env:PATH = @(
    (Split-Path $pixi)
    (Split-Path $git)
    "$env:SystemRoot\System32"
    $env:SystemRoot
) -join ';'

foreach ($tool in @('bash', 'sh', 'grep')) {
    if (Get-Command $tool -ErrorAction SilentlyContinue) {
        throw "Windows setup smoke test requires PATH without $tool"
    }
}

& $pixi run --locked --environment test-py312 setup
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
