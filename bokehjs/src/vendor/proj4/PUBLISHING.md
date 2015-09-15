Publishing
===

Use `tin` to update the version number in the `package.json`, `component.json` & `bower.json`.

    tin -v x.y.z

Then run the publish script

   ./publish.sh

afterwards don't forget to update the versions to be a prerelease of the next version, so if you just published 1.1.1 then:

    tin -v 1.1.2-alpha
    git add package.json component.json bower.json
    git commit -m 'update version to 1.1.2-alpha'
    git push origin master