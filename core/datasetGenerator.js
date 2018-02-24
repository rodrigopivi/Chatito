const chatito = require('./chatito');

// Get the cartesian product of N arrays (taken from):
// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const combineCartesian = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(combineCartesian(a, b), ...c) : a);
const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

const uniqEntities = a => 
    a.sort().filter((item, pos, ary) => !pos || item.id != ary[pos - 1].id);

const OPERATOR_DEFS = {
    ACTION_DEF_KEY: "ActionDefinition",
    ARGUMENT_DEF_KEY: "ArgumentDefinition",
    ALIAS_DEF_KEY: "AliasDefinition",
};

const INNER_OPERATORS = {
    ALIAS: "Alias",
    TEXT: "Text",
    ARGUMENT: "Argument",
};

// ======= AST ======= 
const astFromString = str => chatito.parse(str);

// ======= Dataset ======= 
const datasetFromString = str => {
    const ast = astFromString(str);
    return datasetFromAST(ast);
};

const rasaDatasetAdapter = (item) => {
    let entities = [];
    if (item.arg) {
        entities = Object.keys(item.arg).map(k => ({
            start: item.arg[k].start,
            end: item.arg[k].end,
            value: item.id.slice(item.arg[k].start, item.arg[k].end),
            entity: k,
        }))
    }
    return {
        text: item.id,
        intent: item.action,
        entities,
    }
};

const datasetFromAST = ast => {
    const operatorDefinitions = {
        actions: {},
        args: {},
        aliases: {},
    };
    if (!ast || !ast.length) { return; }
    ast.forEach(od => {
        if (od.type === OPERATOR_DEFS.ACTION_DEF_KEY) {
            operatorDefinitions.actions[od.key] = od.inner;
        } else if (od.type === OPERATOR_DEFS.ARGUMENT_DEF_KEY) {
            operatorDefinitions.args[od.key] = od.inner;
        } else if (od.type === OPERATOR_DEFS.ALIAS_DEF_KEY) {
            operatorDefinitions.aliases[od.key] = od.inner;
        }
    });
    const actions = Object.keys(operatorDefinitions.actions);
    if (!actions || !actions.length) { throw new Error("No actions found"); }
    let dataset = [];
    actions.forEach(actionKey => {
        const sentences = operatorDefinitions.actions[actionKey];
        const variationsMatrix = sentences.map(s => 
            getVariationsFromSentence(s, operatorDefinitions, actionKey, null).map(rasaDatasetAdapter),
        );
        dataset = dataset.concat(variationsMatrix);
    });
    dataset = flatten(dataset);
    return dataset;
};

function getVariationsFromSentence(s, defs, actionKey, type) {
    const sentence = [].concat(s);
    if (sentence.length === 1) { sentence.push({id: "", type: INNER_OPERATORS.TEXT}); }
    return sentence.reduce((entity, nextEntity) => {
        let variations = null;
        if (entity instanceof Array) {
            variations = cartesian(
                entity,
                getVariationsFromEntity(nextEntity, defs),
            );
        } else {
            variations = cartesian(
                getVariationsFromEntity(entity, defs),
                getVariationsFromEntity(nextEntity, defs),
            );
        }
        const ret = variations.map(
            sentenceVariation => {
                let arg = {};
                let column = 0;
                let id;
                sentenceVariation.reduce((e, nextE) => {
                    const firstVal = e.id.trim();
                    const secondVal = nextE.id.trim();
                    id = `${firstVal} ${secondVal}`.trim();
                    if (actionKey) {
                        const firstStart = column;
                        const firstEnd = firstStart + firstVal.length;
                        const increment = firstVal.length ? 1 : 0;
                        const secondStart = firstEnd + increment;
                        const secondEnd = secondStart + secondVal.length;
                        Object.assign(arg, e.arg || {}, nextE.arg || {});
                        if (!column && e.type === INNER_OPERATORS.ARGUMENT) {
                            Object.keys(e.arg).map(k => {
                                arg[k] = { start: firstStart, end: firstEnd };
                            });
                        }
                        if (nextE.type === INNER_OPERATORS.ARGUMENT) {
                            Object.keys(nextE.arg).map(k => {
                                arg[k] = { start: secondStart, end: secondEnd };
                            });
                        }
                        column = column + secondEnd;
                    }
                });
                const newType = type === INNER_OPERATORS.ARGUMENT ?
                    INNER_OPERATORS.ARGUMENT : INNER_OPERATORS.TEXT;
                let o = { type: newType };
                if (actionKey) { o.action = actionKey; }
                const re = Object.assign({}, o, { id, arg });
                return re;
            },
        );
        return ret;
    });
}

function getVariationsFromEntity(e, defs) {
    let sentences = null;
    let isArgument = false;
    if (e.type === INNER_OPERATORS.ARGUMENT) {
        sentences = defs.args[e.id];
        if (!sentences) { throw new Error(`Undefined argument ${e.id}`); }
        isArgument = true;
    } else if (e.type === INNER_OPERATORS.ALIAS) {
        sentences = defs.aliases[e.id];
        if (!sentences) { throw new Error(`Undefined alias ${e.id}`); }
    } else {
        return [e];
    }
    let variations = [];
    sentences.forEach(s => {
        const sentence = getVariationsFromSentence(s, defs, null, e.type);
        variations = variations.concat(sentence);
    });
    if (isArgument) {
        variations = variations.map(v => {
            if (!(v instanceof Array)) { v.arg = { [e.id]: { value: v.id } }; }
            return v;
        });
    }
    if (e.opt) { variations.push({ id: "", type: INNER_OPERATORS.TEXT }); }
    return variations;
}

module.exports = {
    datasetFromString,
};
