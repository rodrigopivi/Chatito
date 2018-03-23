const chatito = require("./chatito");

// Get the cartesian product of N arrays (taken from):
// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const combineCartesian = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(combineCartesian(a, b), ...c) : a);
const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

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
            value: item.arg[k].value || item.id.slice(item.arg[k].start, item.arg[k].end),
            entity: k,
        }));
    }
    return {
        text: item.id,
        intent: item.action,
        entities,
    };
};

const datasetFromAST = ast => {
    const operatorDefinitions = {
        actions: {},
        args: {},
        aliases: {},
    };
    if (!ast || !ast.length) { return; }
    ast.forEach(od => {
        if (od.type === OPERATOR_DEFS.ACTION_DEF_KEY) {
            if (operatorDefinitions.actions[od.key]) { throw new Error(`Duplicate definition for ${od.key}`); }
            operatorDefinitions.actions[od.key] = od.inner;
        } else if (od.type === OPERATOR_DEFS.ARGUMENT_DEF_KEY) {
            if (operatorDefinitions.args[od.key]) { throw new Error(`Duplicate argument for ${od.key}`); }
            operatorDefinitions.args[od.key] = od.inner;
        } else if (od.type === OPERATOR_DEFS.ALIAS_DEF_KEY) {
            if (operatorDefinitions.aliases[od.key]) { throw new Error(`Duplicate alias for ${od.key}`); }
            operatorDefinitions.aliases[od.key] = od.inner;
        }
    });
    const actions = Object.keys(operatorDefinitions.actions);
    if (!actions || !actions.length) { throw new Error("No actions found"); }
    let dataset = [];
    actions.forEach(actionKey => {
        const sentences = operatorDefinitions.actions[actionKey];
        const variationsMatrix = sentences.map(s => {
            const variationsFromSentence = getVariationsFromSentence(
                s, operatorDefinitions, actionKey, null
            );
            return variationsFromSentence.map(rasaDatasetAdapter);
        });
        dataset = dataset.concat(variationsMatrix);
    });
    dataset = flatten(dataset);
    return dataset;
};

function getVariationsFromSentence(s, defs, actionKey, parentEntity) {
    const sentence = [].concat(s);
    const sentenceOfOneWord = sentence.length === 1;
    if (sentenceOfOneWord) { sentence.push({id: "", type: INNER_OPERATORS.TEXT}); }
    return sentence.reduce((entity, nextEntity) => {
        let variations = null;
        if (entity instanceof Array) {
            variations = cartesian(
                entity,
                getVariationsFromEntity(nextEntity, defs, parentEntity, sentenceOfOneWord)
            );
        } else {
            variations = cartesian(
                getVariationsFromEntity(entity, defs, parentEntity, sentenceOfOneWord),
                getVariationsFromEntity(nextEntity, defs, parentEntity, sentenceOfOneWord)
            );
        }
        return variations.map(
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
                        if (e.aliasArg) { Object.assign(e.arg, e.aliasArg); }
                        if (nextE.aliasArg) { Object.assign(nextE.arg, nextE.aliasArg); }
                        Object.assign(arg, e.arg || {}, nextE.arg || {});
                        if (!column && e.type === INNER_OPERATORS.ARGUMENT) {
                            Object.keys(e.arg).map(k => {
                                arg[k] = { start: firstStart, end: firstEnd };
                                if (e.aliasArg) { arg[k].value = e.aliasArg[k]; }
                            });
                        }
                        if (nextE.type === INNER_OPERATORS.ARGUMENT) {
                            Object.keys(nextE.arg).map(k => {
                                arg[k] = { start: secondStart, end: secondEnd };
                                if (nextE.aliasArg) { arg[k].value = nextE.aliasArg[k]; }
                            });
                        }
                        column = column + secondEnd;
                    }
                });
                const parentIsArgument = parentEntity && parentEntity.type === INNER_OPERATORS.ARGUMENT;
                const newType = parentIsArgument ? INNER_OPERATORS.ARGUMENT : INNER_OPERATORS.TEXT;
                const o = { type: newType, id, arg };
                if (parentIsArgument && sentenceOfOneWord && sentenceVariation[0].aliasArg) {
                    o.aliasArg = sentenceVariation[0].aliasArg;
                }
                if (actionKey) { o.action = actionKey; }
                return o;
            }
        );
    });
}

function getVariationsFromEntity(e, defs, parentEntity, isTheOnlyEntityOfASentence) {
    let sentences = null;
    let isArgument = false;
    let singleAliasDefinedAsArgumentValue = false;
    if (e.type === INNER_OPERATORS.ARGUMENT) {
        sentences = defs.args[e.id];
        if (!sentences) { throw new Error(`Undefined argument ${e.id}`); }
        isArgument = true;
    } else if (e.type === INNER_OPERATORS.ALIAS) {
        sentences = defs.aliases[e.id];
        if (!sentences) { throw new Error(`Undefined alias ${e.id}`); }
        // if the sentence is jjust one alias and the parent entity is an argument,
        // we provide the alias id as the argument value instead of each alias variation,
        // so that all argument alias variations are infered as a single argument value
        if (parentEntity && parentEntity.type === INNER_OPERATORS.ARGUMENT && isTheOnlyEntityOfASentence) {
            singleAliasDefinedAsArgumentValue = true;
        }
    } else {
        return [e];
    }
    let variations = [];
    sentences.forEach(s => {
        const sentence = getVariationsFromSentence(s, defs, null, e);
        variations = variations.concat(sentence);
    });
    if (singleAliasDefinedAsArgumentValue) {
        variations = variations.map(v => {
            if (!(v instanceof Array)) { v.aliasArg = { [parentEntity.id]: e.id }; }
            // if (!(v instanceof Array)) { v.aliasArg = e.id; }
            return v;
        });
    } else if (isArgument) {
        variations = variations.map(v => {
            if (!(v instanceof Array)) { v.arg = { [e.id]: { value: v.id,  } }; }
            return v;
        });
    } 
    if (e.opt) { variations.push({ id: "", type: INNER_OPERATORS.TEXT }); }
    return variations;
}

module.exports = {
    astFromString,
    datasetFromAST,
    datasetFromString,
};
