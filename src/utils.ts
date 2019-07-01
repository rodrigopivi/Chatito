// Deep merge objects
// https://gist.github.com/Salakar/1d7137de9cb8b704e48a
const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
const isArray = (item: any) => {
    if (typeof Array.isArray === 'undefined') {
        return Object.prototype.toString.call(item) === '[object Array]';
    } else {
        return Array.isArray(item);
    }
};
export const mergeDeep = <T>(target: any, source: any): T => {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isArray(source[key])) {
                if (target[key] === undefined) {
                    target[key] = [];
                }
                target[key] = target[key].concat(source[key]);
            } else if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
};
