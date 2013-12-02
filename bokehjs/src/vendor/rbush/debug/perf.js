var rbush = typeof require !== 'undefined' ? require('../rbush.js') : rbush;

var data = [],
    x, y;

var N = 1000000,
    maxFill = 16;

function randBox(size) {
    var x = Math.random() * (100 - size),
        y = Math.random() * (100 - size);
    return [x, y,
        x + size * Math.random(),
        y + size * Math.random()];
}

for (var i = 0; i < N; i++) {
    data[i] = randBox(1);
}

console.log('number: ' + N);

var tree = rbush(maxFill);

console.log('maxFill: ' + tree._maxEntries);

console.time('insert one by one');
for (i = 0; i < N; i++) {
    tree.insert(data[i]);
}
console.timeEnd('insert one by one');

// console.time('bulk load');
// tree.load(data);
// console.timeEnd('bulk load');

console.time('1000 searches 10%');
for (i = 0; i < 1000; i++) {
    tree.search(randBox(100 * Math.sqrt(0.1)));
}
console.timeEnd('1000 searches 10%');

console.time('1000 searches 1%');
for (i = 0; i < 1000; i++) {
    tree.search(randBox(10));
}
console.timeEnd('1000 searches 1%');

console.time('1000 searches 0.01%');
for (i = 0; i < 1000; i++) {
    tree.search(randBox(1));
}
console.timeEnd('1000 searches 0.01%');

console.time('remove 1000 one by one');
for (i = 0; i < 1000; i++) {
    tree.remove(data[i]);
}
console.timeEnd('remove 1000 one by one');

var data3 = [];
for (var i = 0; i < N; i++) {
    data3[i] = randBox(1);
}

console.time('bulk-insert 1M more');
tree.load(data3);
console.timeEnd('bulk-insert 1M more');

console.time('1000 searches 1%');
for (i = 0; i < 1000; i++) {
    tree.search(randBox(10));
}
console.timeEnd('1000 searches 1%');

console.time('1000 searches 0.01%');
for (i = 0; i < 1000; i++) {
    tree.search(randBox(1));
}
console.timeEnd('1000 searches 0.01%');


// var result, bbox;

// console.time('100 naive searches 1%');
// for (var j = 0; j < 100; j++) {
//     result = [];
//     bbox = randBox(10);
//     for (i = 0; i < N; i++) {
//         if (tree._intersects(bbox, data[i])) {
//             result.push(data[i]);
//         }
//     }
// }
// console.timeEnd('100 naive searches 1%');

var RTree = typeof require !== 'undefined' ? require('rtree') : RTree;

var tree2 = new RTree(maxFill);

var data2 = [];
for (var i = 0; i < N; i++) {
    data2.push({x: data[i][0], y: data[i][1], w: data[i][2] - data[i][0], h: data[i][3] - data[i][1]});
}

console.time('old RTree load one by one');
for (var i = 0; i < N; i++) {
    tree2.insert(data2[i], i);
}
console.timeEnd('old RTree load one by one');

console.time('1000 searches 10% 2');
for (i = 0; i < 1000; i++) {
    bbox = randBox(100 * Math.sqrt(0.1));
    tree2.search({x: bbox[0], y: bbox[1], w: bbox[2] - bbox[0], h: bbox[3] - bbox[1]});
}
console.timeEnd('1000 searches 10% 2');

console.time('1000 searches 1% 2');
for (i = 0; i < 1000; i++) {
    bbox = randBox(10);
    tree2.search({x: bbox[0], y: bbox[1], w: bbox[2] - bbox[0], h: bbox[3] - bbox[1]});
}
console.timeEnd('1000 searches 1% 2');

console.time('1000 searches 0.01% 2');
for (i = 0; i < 1000; i++) {
    bbox = randBox(1);
    tree2.search({x: bbox[0], y: bbox[1], w: bbox[2] - bbox[0], h: bbox[3] - bbox[1]});
}
console.timeEnd('1000 searches 0.01% 2');

console.time('old RTree remove 1000 one by one');
for (var i = 0; i < 1000; i++) {
    tree2.remove(data2[i], i);
}
console.timeEnd('old RTree remove 1000 one by one');
