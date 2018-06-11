import * as utils from './utils';

import {
    IChatitoCache, IChatitoEntityAST, IChatitoParser, IEntities, IEntityDef, ISentenceTokens,
    IStatCache, IUtteranceWriter,
} from './types';

const chatito = (require('../parser/chatito') as IChatitoParser);

// recursive function that generates variations using a cache
// that uses counts to avoid repetitions
const getVariationsFromEntity = async <T>(
    ed: IChatitoEntityAST, entities: IEntities, optional: boolean, cache: IChatitoCache,
): Promise<ISentenceTokens[]> => {
    // if this entity is a slot variation, add that as the key
    const variationKey = ed.variation ? `#${ed.variation}` : '';
    const cacheKey = `${ed.type}-${ed.key}${variationKey}`;
    let cacheStats = cache.get(cacheKey);
    if (!cacheStats) { // if the entity is not cache, create an empty cache for it
        const counts: IChatitoCache[] = [];
        const totalCounts: number[] = [];
        const maxCounts: number[] = [];
        for (const c of ed.inner) { // get counts for each of the sentences inside the entity
            counts.push(new Map());
            totalCounts.push(0);
            let mxc = utils.maxSentencesForSentence(entities)(c);
            if (optional) { mxc++; }
            maxCounts.push(mxc);
        }
        const currentEntityCache: IStatCache = {
            counts, maxCounts, optional, optionalCounts: 0, totalCounts,
        };
        cache.set(cacheKey, currentEntityCache);
        cacheStats = cache.get(cacheKey);
        if (!cacheStats) { throw new Error('No cache map set'); }
    }
    // each sentence generation should use the ratio between the cache counts and the max possible
    // combinations, so that generation follows the probability distribuition avoiding repetitions
    let max = utils.maxSentencesForEntity(ed, entities);
    if (optional) { max++; }
    const totalAccumulated = cacheStats.totalCounts.reduce((p, n) => p + n) + cacheStats.optionalCounts;
    if (totalAccumulated === max) { // reset cache counts if max is reached
        cacheStats.totalCounts = new Array(cacheStats.totalCounts.length).fill(0);
        cacheStats.optionalCounts = 0;
    }
    const allCounts = cacheStats.maxCounts.map((c, i) => {
        if (!cacheStats) { return 1; }
        return cacheStats.totalCounts[i] / cacheStats.maxCounts[i];
    });
    let min = Math.min.apply(Math, allCounts);
    if (cacheStats.optional && cacheStats.optionalCounts / max < min / max) { min = min / max; }
    // randomly select an index from those that have the same probabilities to be selected
    const counterIndexes: number[] = [];
    allCounts.forEach((c: number, i) => { if (c <= min || !c) { counterIndexes.push(i); } });
    if (cacheStats.optional && cacheStats.optionalCounts <= min / max) { counterIndexes.push(-1); }
    utils.shuffle(counterIndexes);
    const sentenceIndex = counterIndexes[0];
    if (sentenceIndex === -1) {
        cacheStats.optionalCounts++;
        return []; // increment optional and return empty if optional is randomly selected
    }
    cacheStats.totalCounts[sentenceIndex]++;
    const sentence = ed.inner[sentenceIndex];
    let accumulator: ISentenceTokens[] = [];
    for (const t of sentence) { // slots and alias entities generate the sentences recursively
        if (t.type === 'Slot' || t.type === 'Alias') {
            const def = entities[t.type];
            const innerEntityKey = t.variation ? `${t.value}#${t.variation}` : t.value;
            if (!def[innerEntityKey]) { throw new Error(`${t.type} not defined: ${innerEntityKey}`); }
            const sentenceVariation = await getVariationsFromEntity(
                def[innerEntityKey], entities, !!t.opt, cacheStats.counts[sentenceIndex],
            );
            if (sentenceVariation.length) {
                const returnSentence = sentenceVariation.reduce((prev, next) => ({
                    type: next.type, value: prev.value + next.value,
                }), { value: '', type: 'Text' });
                if (t.type === 'Slot') {
                    returnSentence.value = returnSentence.value.trim();
                    returnSentence.type = t.type;
                    returnSentence.slot = t.value;
                }
                accumulator = accumulator.concat(returnSentence);
            }
        } else { accumulator = accumulator.concat(t); }
    }
    if (accumulator.length === 1 && !accumulator[0].value) { return []; }
    return accumulator;
};

export const astFromString = (str: string) => chatito.parse(str);
export const datasetFromString = (str: string, writterFn: IUtteranceWriter) => {
    const ast = astFromString(str);
    return datasetFromAST(ast, writterFn);
};

export const datasetFromAST = async (ast: IChatitoEntityAST[], writterFn: IUtteranceWriter) => {
    const operatorDefinitions: IEntities = { Intent: {}, Slot: {}, Alias: {} };
    if (!ast || !ast.length) { return; }
    ast.forEach((od) => {
        let entity: IEntityDef;
        if (od.type === 'IntentDefinition') {
            entity = operatorDefinitions.Intent;
        } else if (od.type === 'SlotDefinition') {
            entity = operatorDefinitions.Slot;
        } else if (od.type === 'AliasDefinition') {
            entity = operatorDefinitions.Alias;
        } else { throw new Error(`Unknown definition definition for ${od.type}`); }
        const odKey = od.variation ? `${od.key}#${od.variation}` : od.key;
        if (entity[odKey]) { throw new Error(`Duplicate definition for ${od.type} '${odKey}'`); }
        entity[odKey] = od;
    });
    const intentKeys = Object.keys(operatorDefinitions.Intent);
    if (!intentKeys || !intentKeys.length) { throw new Error('No actions found'); }
    for (const intentKey of intentKeys) { // and for all tokens inside the sentence
        const maxPossibleCombinations = utils.maxSentencesForEntity(
            operatorDefinitions.Intent[intentKey], operatorDefinitions,
        );
        let maxIntentExamples = maxPossibleCombinations; // counter that will change
        const intentMax = operatorDefinitions.Intent[intentKey].max;
        if (intentMax) {
            if (intentMax > maxIntentExamples) {
                throw new Error(`Can't generate ${intentMax} examples. Max possible examples is ${maxIntentExamples}`);
            } else if (intentMax < maxIntentExamples) { maxIntentExamples = intentMax; }
        }
        const maxEx = maxIntentExamples;
        const globalCache: IChatitoCache = new Map();
        const collitionsCache: { [id: string]: boolean } = {};
        let duplicatesCounter = 0;
        while (maxIntentExamples) {
            const intentSentence = await getVariationsFromEntity(
                operatorDefinitions.Intent[intentKey], operatorDefinitions, false, globalCache,
            );
            const utterance = chatitoFormatPostProcess(intentSentence);
            const utteranceString = utterance.reduce((p, n) => p + n.value, '');
            if (!collitionsCache[utteranceString]) {
                collitionsCache[utteranceString] = true;
                writterFn(utterance, intentKey, maxEx);
                maxIntentExamples--;
            } else {
                duplicatesCounter++;
                if (duplicatesCounter > maxPossibleCombinations * maxPossibleCombinations) {
                    // prevent cases where duplicates are part of the entity definitions
                    let m = `Too many duplicates while generating dataset! Looks like we have probably reached `;
                    m += `the maximun ammount of possible unique generated examples. `;
                    m += `The generator has stopped at ${maxEx - maxIntentExamples} examples for intent ${intentKey}.`;
                    // tslint:disable-next-line:no-console
                    console.warn(m);
                    maxIntentExamples = 0;
                }
            }
        }
    }
};

const chatitoFormatPostProcess = (data: ISentenceTokens[]) => {
    const arr = data.reduce((
        accumulator: ISentenceTokens[], next: ISentenceTokens, i, arrShadow,
    ) => {
        if (accumulator.length) {
            const lastWord = accumulator[accumulator.length - 1];
            if (lastWord.type === next.type && lastWord.type === 'Text') {
                accumulator[accumulator.length - 1] = {
                    type: lastWord.type,
                    value: (lastWord.value + next.value).replace(/\s+/g, ' '),
                };
            } else { accumulator.push(next); }
        } else { accumulator.push(next); }
        if (i === arrShadow.length - 1) { // if its the last token of a sentence
            // remove empty strings at the end
            if (!accumulator[accumulator.length - 1].value.trim()) { accumulator.pop(); }
            if (accumulator.length) {
                accumulator[accumulator.length - 1] = Object.assign(
                    {},
                    accumulator[accumulator.length - 1],
                    { value: accumulator[accumulator.length - 1].value.replace(/\s+$/g, '') },
                );
            }
        }
        return accumulator;
    }, ([] as ISentenceTokens[]));
    if (arr.length) {
        arr[0] = Object.assign({}, arr[0], { value: arr[0].value.replace(/^\s+/, '') });
    }
    return arr;
};
