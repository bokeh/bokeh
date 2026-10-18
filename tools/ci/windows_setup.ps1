# Exercise developer setup without the runner's incidental Git Bash/MSYS tools.
$ErrorActionPreference = 'Stop'
$pixi = (Get-Command pixi -CommandType Application).Source
$git = (Get-Command git -CommandType Application).Source
# Git's bin directory also contains bash.exe and sh.exe. Its cmd entry point
# provides Git without exposing those executables on PATH.
$gitCommandDir = Join-Path (Split-Path (Split-Path $git)) 'cmd'
if (-not (Test-Path (Join-Path $gitCommandDir 'git.exe') -PathType Leaf)) {
    throw "Cannot locate Git for Windows cmd entry point from $git"
}
$env:PATH = @(
    (Split-Path $pixi)
    $gitCommandDir
) -join ';'
# System32 can expose the WSL bash.exe launcher. npm can still use the native
# Windows command shell through its absolute path without System32 on PATH.
$env:ComSpec = Join-Path $env:SystemRoot 'System32\cmd.exe'

foreach ($tool in @('bash', 'sh', 'grep')) {
    $command = Get-Command $tool -ErrorAction SilentlyContinue
    if ($command) {
        throw "Windows setup smoke test requires PATH without $tool (found $($command.Source))"
    }
}

& $pixi run --locked --environment test-py312 setup
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
