const fs = require('fs');
const path = require('path');
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
const astFromFile = absolutePath => {
    const chatitoFileContent = fs.readFileSync(absolutePath, "utf8");
    return astFromString(chatitoFileContent);
};

const astFromString = str => chatito.parse(str);

// ======= Dataset ======= 
const datasetFromFile = absolutePath => {
    const ast = astFromFile(absolutePath);
    return datasetFromAST(ast);
};

const datasetFromString = str => {
    const ast = astFromString(str);
    return datasetFromAST(ast);
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
            getVariationsFromSentence(s, operatorDefinitions, actionKey),
        );
        dataset = dataset.concat(variationsMatrix);
    });
    dataset = flatten(dataset);
    return dataset;
};

function getVariationsFromSentence(s, defs, actionKey) {
    const sentence = [].concat(s);
    if (sentence.length === 1) { sentence.push({id: "", type: "Text"}); }
    return sentence.reduce((entity, nextEntity) => {
        let variations = null;
        let entityToCheckForArgs = entity;
        if (entity instanceof Array) {
            variations = cartesian(
                entity,
                getVariationsFromEntity(nextEntity, defs),
            );
            entityToCheckForArgs = nextEntity;
        } else {
            variations = cartesian(
                getVariationsFromEntity(entity, defs),
                getVariationsFromEntity(nextEntity, defs),
            );
        }
        const ret = variations.map(
            sentenceVariation => {
                const args = {};
                sentenceVariation.forEach(e => {
                    if (e.arg) { args[entityToCheckForArgs.id] = e.arg; }
                });
                const base = {
                    id: sentenceVariation.map(e => e.id).join(" ").trim(),
                    arg: args,
                };
                let o = { type: "Text" };
                if (actionKey) { o = { action: actionKey }; }
                return Object.assign({}, o, base);
            },
        );
        const s = sentence;
        return ret;
    });
}

function getVariationsFromEntity(e, defs) {
    let sentences = null;
    let isArgument = false;
    if (e.type === INNER_OPERATORS.TEXT) { return [e]; } 
    if (e.type === INNER_OPERATORS.ARGUMENT) {
        sentences = defs.args[e.id];
        if (!sentences) { throw new Error(`Undefined argument ${e.id}`); }
        isArgument = true;
    } else if (e.type === INNER_OPERATORS.ALIAS) {
        sentences = defs.aliases[e.id];
        if (!sentences) { throw new Error(`Undefined alias ${e.id}`); }
    }
    let variations = [];
    sentences.forEach(s => {
        const sentence = getVariationsFromSentence(s, defs, null);
        variations = variations.concat(sentence);
    });
    if (isArgument) {
        variations = variations.map(v => {
            if (!(v instanceof Array)) {
                v.arg = v.id;
            }
            return v;
        });
    }
    if (e.opt) { variations.push({ id: "", type: "Text" }); }
    return variations;
}

module.exports = {
    datasetFromFile,
    datasetFromString,
};
