const chatito = require("./chatito");
const rasaGenerator = require("./rasaGenerator");
const snipsGenerator = require("./snipsGenerator");
const utils = require("./utils");

const OPERATOR_DEFS = {
    ACTION_DEF_KEY: "ActionDefinition",
    ARGUMENT_DEF_KEY: "ArgumentDefinition",
    ALIAS_DEF_KEY: "AliasDefinition",
};
const INNER_OPERATORS = { ALIAS: "Alias", TEXT: "Text", ARGUMENT: "Argument" };
const DATASET_ADAPTERS = { rasa: rasaGenerator.adapter, snips: snipsGenerator.adapter };

const astFromString = str => chatito.parse(str);

function datasetFromString(str, datasetAdapter = "rasa", options) {
    const ast = astFromString(str);
    let adapter = datasetAdapter;
    if (typeof adapter === "string") { adapter = DATASET_ADAPTERS[datasetAdapter]; }
    if (!adapter) { throw new Error("Invalid dataset adapter provided"); }
    const { definitions, dataset } = datasetFromAST(ast);
    return adapter(dataset, definitions, options);
}

function datasetFromAST(ast) {
    const operatorDefinitions = {
        actions: {},
        args: {},
        aliases: {},
    };
    const cache = {};
    if (!ast || !ast.length) { return; }
    ast.forEach(od => {
        if (od.type === OPERATOR_DEFS.ACTION_DEF_KEY) {
            if (operatorDefinitions.actions[od.key]) { throw new Error(`Duplicate definition for ${od.key}`); }
            operatorDefinitions.actions[od.key] = od;
        } else if (od.type === OPERATOR_DEFS.ARGUMENT_DEF_KEY) {
            if (operatorDefinitions.args[od.key]) { throw new Error(`Duplicate argument for ${od.key}`); }
            operatorDefinitions.args[od.key] = od;
        } else if (od.type === OPERATOR_DEFS.ALIAS_DEF_KEY) {
            if (operatorDefinitions.aliases[od.key]) { throw new Error(`Duplicate alias for ${od.key}`); }
            operatorDefinitions.aliases[od.key] = od;
        }
    });
    const actions = Object.keys(operatorDefinitions.actions);
    if (!actions || !actions.length) { throw new Error("No actions found"); }
    let dataset = [];
    actions.forEach(actionKey => {
        const sentences = operatorDefinitions.actions[actionKey].inner;
        const variationsMatrix = sentences.map(s => getVariationsFromSentence(
            s, operatorDefinitions, actionKey, null, cache
        ));
        dataset = dataset.concat(variationsMatrix);
    });
    return { definitions: operatorDefinitions, dataset: utils.flatten(dataset) };
}

function getVariationsFromSentence(s, defs, actionKey, parentEntity, cache) {
    const sentence = [].concat(s);
    const sentenceOfOneWord = sentence.length === 1;
    if (sentenceOfOneWord) { sentence.push({ id: "", type: INNER_OPERATORS.TEXT }); }
    return sentence.reduce((entity, nextEntity) => {
        let variations = null;
        if (entity instanceof Array) {
            variations = utils.cartesian(
                entity,
                getVariationsFromEntity(nextEntity, defs, parentEntity, sentenceOfOneWord, cache)
            );
        } else {
            variations = utils.cartesian(
                getVariationsFromEntity(entity, defs, parentEntity, sentenceOfOneWord, cache),
                getVariationsFromEntity(nextEntity, defs, parentEntity, sentenceOfOneWord, cache)
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

function getVariationsFromEntity(e, defs, parentEntity, isTheOnlyEntityOfASentence, cache) {
    let sentences = null;
    let isArgument = false;
    let singleAliasDefinedAsArgumentValue = false;
    let cacheThisEntity = false;
    if (e.type === INNER_OPERATORS.ARGUMENT) {
        if (!defs.args[e.id]) { throw new Error(`Undefined argument ${e.id}`); }
        sentences = defs.args[e.id].inner;
        isArgument = true;
        cacheThisEntity = true;
    } else if (e.type === INNER_OPERATORS.ALIAS) {
        if (!defs.aliases[e.id]) { throw new Error(`Undefined alias ${e.id}`); }
        sentences = defs.aliases[e.id].inner;
        // if the sentence is jjust one alias and the parent entity is an argument,
        // we provide the alias id as the argument value instead of each alias variation,
        // so that all argument alias variations are infered as a single argument value
        if (parentEntity && parentEntity.type === INNER_OPERATORS.ARGUMENT && isTheOnlyEntityOfASentence) {
            singleAliasDefinedAsArgumentValue = true;
        }
        cacheThisEntity = true;
    } else {
        return [e];
    }
    let variations = [];
    if (cache[e.type] && cache[e.type][e.id]) {
        variations = [].concat(cache[e.type][e.id]);
    } else {
        sentences.forEach(s => {
            variations = variations.concat(getVariationsFromSentence(s, defs, null, e, cache));
        });
        if (cacheThisEntity) {
            if (!cache[e.type]) { cache[e.type] = {}; }
            cache[e.type][e.id] = [].concat(variations);
        }
    }
    if (singleAliasDefinedAsArgumentValue) {
        variations = variations.map(v => {
            if (!(v instanceof Array)) { v.aliasArg = { [parentEntity.id]: e.id }; }
            return v;
        });
    } else if (isArgument) {
        variations = variations.map(v => {
            if (!(v instanceof Array) && v.id) { v.arg = { [e.id]: { value: v.id, } }; }
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
    rasaGenerator,
    snipsGenerator,
};
