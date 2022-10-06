.. include:: releases/{{ version }}.rst

.. dropdown:: Table of SRI Hashes for version {{ version }}
    :animate: fade-in

    .. raw:: html

        <table class="colwidths-given table">
            <colgroup>
                <col style="width: 25%" />
                <col style="width: 75%" />
            </colgroup>
            <thead>
                <tr>
                    <th class="head">
                        <p>Filename</p>
                    </th>
                    <th class="head">
                        <p>Hash</p>
                    </th>
                </tr>
            </thead>

            <tbody style="font-size: small;">
            {% for name, hash in table %}
                <tr>
                    <td><p><code><span class="pre">{{ name }}</span></code></p></td>
                    <td><p><code><span class="pre">{{ hash }}</span></code></p></td>
                </tr>
            {% endfor %}
            </tbody>

        </table>
