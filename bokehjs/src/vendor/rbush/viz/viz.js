var W = 700,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

function randBox(size) {
    var x = Math.random() * (W - size),
        y = Math.random() * (W - size);
    return [
        x, y,
        x + size * Math.random(),
        y + size * Math.random()
    ];
}

function randPoint() {
    var x = Math.random() * W,
        y = Math.random() * W;
    return [x, y];
}

function randClusterPoint(dist) {
    var x = dist + Math.random() * (W - dist * 2),
        y = dist + Math.random() * (W - dist * 2);
    return [x, y];
}

function randClusterBox(cluster, dist, size) {
    var x = cluster[0] - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3,
        y = cluster[1] - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3;

    return [
        x, y,
        x + size * Math.random(),
        y + size * Math.random()
    ];
}

var colors = ['#f40', '#37f', '#0b0'],
    rects;

function drawTree(node, level) {
    if (!node) { return; }

    var rect = [];

    rect.push(level ? colors[(level - 1) % colors.length] : 'grey');
    rect.push(level ? 1 / level : 1);
    rect.push([
        Math.round(node.bbox[0]) + 0.5,
        Math.round(node.bbox[1]) + 0.5,
        Math.round(node.bbox[2] - node.bbox[0]),
        Math.round(node.bbox[3] - node.bbox[1])
    ]);

    rects.push(rect);

    if (node.leaf) return;
    if (level === 6) { return; }

    for (var i = 0; i < node.children.length; i++) {
        drawTree(node.children[i], level + 1);
    }
}

function draw() {
    rects = [];
    drawTree(tree.data, 0);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, W + 1, W + 1);

    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        ctx.globalAlpha = rects[i][1];
        ctx.strokeRect.apply(ctx, rects[i][2]);
    }
}

function search(e) {
    console.time('1 pixel search');
    tree.search([e.clientX, e.clientY, e.clientX + 1, e.clientY + 1]);
    console.timeEnd('1 pixel search');
}

function remove() {
    data.sort(tree.compareMinX);
    console.time('remove 10000');
    for (var i = 0; i < 10000; i++) {
        tree.remove(data[i]);
    }
    console.timeEnd('remove 10000');

    data.splice(0, 10000);

    draw();
};
