//  Durstenfeld shuffle, a computer-optimized version of Fisher-Yates:
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// Get the cartesian product of N arrays
// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const combineCartesian = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(combineCartesian(a, b), ...c) : a);
const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

// Deep merge objects
// https://gist.github.com/Salakar/1d7137de9cb8b704e48a
const isObject = (item) => (item && typeof item === "object" && !Array.isArray(item) && item !== null);
const mergeDeep = (target, source) => {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
};

module.exports = { shuffle, cartesian, flatten, isObject, mergeDeep };
