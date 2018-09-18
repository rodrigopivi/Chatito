import * as utils from './utils';

import {
    IChatitoCache,
    IChatitoEntityAST,
    IChatitoParser,
    IEntities,
    IEntityDef,
    ISentenceTokens,
    IStatCache,
    IUtteranceWriter
} from './types';

// tslint:disable-next-line:no-var-requires
const chatito = require('../parser/chatito') as IChatitoParser;

const chatitoFormatPostProcess = (data: ISentenceTokens[]) => {
    const arr = data.reduce(
        (accumulator: ISentenceTokens[], next: ISentenceTokens, i, arrShadow) => {
            if (accumulator.length) {
                const lastWord = accumulator[accumulator.length - 1];
                if (lastWord.type === next.type && lastWord.type === 'Text') {
                    accumulator[accumulator.length - 1] = {
                        type: lastWord.type,
                        value: (lastWord.value + next.value).replace(/\s+/g, ' ')
                    };
                } else {
                    accumulator.push(next);
                }
            } else if (next.value.trim()) {
                accumulator.push(next);
            }
            if (i === arrShadow.length - 1) {
                // if its the last token of a sentence
                // remove empty strings at the end
                if (!accumulator[accumulator.length - 1].value.trim()) {
                    accumulator.pop();
                }
                if (accumulator.length) {
                    accumulator[accumulator.length - 1] = Object.assign({}, accumulator[accumulator.length - 1], {
                        value: accumulator[accumulator.length - 1].value.replace(/\s+$/g, '')
                    });
                }
            }
            return accumulator;
        },
        [] as ISentenceTokens[]
    );
    if (arr.length) {
        arr[0] = Object.assign({}, arr[0], {
            value: arr[0].value.replace(/^\s+/, '')
        });
    }
    return arr;
};

// recursive function that generates variations using a cache
// that uses counts to avoid repetitions
const getVariationsFromEntity = async <T>(
    ed: IChatitoEntityAST,
    entities: IEntities,
    optional: boolean,
    cache: IChatitoCache,
): Promise<ISentenceTokens[]> => {
    // if this entity is a slot variation, add that as the key
    const variationKey = ed.variation ? `#${ed.variation}` : '';
    const cacheKey = `${ed.type}-${ed.key}${variationKey}`;
    let cacheStats = cache.get(cacheKey) as IStatCache;
    if (!cacheStats) {
        // if the entity is not cache, create an empty cache for it
        const counts: IChatitoCache[] = [];
        const totalCounts: number[] = [];
        const maxCounts: number[] = [];
        for (const c of ed.inner) {
            // get counts for each of the sentences inside the entity
            counts.push(new Map());
            totalCounts.push(0);
            let mxc = utils.maxSentencesForSentence(entities)(c);
            if (optional) {
                mxc++;
            }
            maxCounts.push(mxc);
        }
        const currentEntityCache: IStatCache = {
            counts,
            maxCounts,
            optional,
            optionalCounts: 0,
            totalCounts
        };
        cache.set(cacheKey, currentEntityCache);
        cacheStats = cache.get(cacheKey) as IStatCache;
    }
    // each sentence generation should use the ratio between the cache counts and the max possible
    // combinations, so that generation follows the probability distribuition avoiding repetitions
    let max = utils.maxSentencesForEntity(ed, entities);
    if (optional) {
        max++;
    }
    const totalAccumulated = cacheStats.totalCounts.reduce((p, n) => p + n) + cacheStats.optionalCounts;
    if (totalAccumulated === max) {
        // reset cache counts if max is reached
        cacheStats.totalCounts = new Array(cacheStats.totalCounts.length).fill(0);
        cacheStats.optionalCounts = 0;
    }
    const allCounts = cacheStats.maxCounts.map((c, i) => {
        return cacheStats.totalCounts[i] / cacheStats.maxCounts[i];
    });
    let min = Math.min.apply(Math, allCounts);
    if (cacheStats.optional && cacheStats.optionalCounts / max < min / max) {
        min = min / max;
    }
    // randomly select an index from those that have the same probabilities to be selected
    const counterIndexes: number[] = [];
    allCounts.forEach((c: number, i) => {
        if (c <= min || !c) {
            counterIndexes.push(i);
        }
    });
    if (cacheStats.optional && cacheStats.optionalCounts <= min / max) {
        counterIndexes.push(-1);
    }
    utils.shuffle(counterIndexes);
    const sentenceIndex = counterIndexes[0];
    if (sentenceIndex === -1) {
        cacheStats.optionalCounts++;
        return []; // increment optional and return empty if optional is randomly selected
    }
    cacheStats.totalCounts[sentenceIndex]++;
    const sentence = ed.inner[sentenceIndex];
    let accumulator: ISentenceTokens[] = [];
    // For slots where a sentence is composed of only one alias, we add the synonym tag,
    // to denote that the generated alias is a synonym of its alias name
    const slotSynonyms = ed.type === 'SlotDefinition' && sentence.length === 1 && sentence[0].type === 'Alias';
    for (const t of sentence) {
        // slots and alias entities generate the sentences recursively
        const slotsInSentenceKeys: Set<string> = new Set([]);
        if (t.type === 'Slot' || t.type === 'Alias') {
            const def = entities[t.type];
            const innerEntityKey = t.variation ? `${t.value}#${t.variation}` : t.value;
            const currentCache = slotsInSentenceKeys.has(innerEntityKey) ? cacheStats.counts[sentenceIndex] : new Map();
            slotsInSentenceKeys.add(innerEntityKey);
            const sentenceVariation = await getVariationsFromEntity(def[innerEntityKey], entities, !!t.opt, currentCache);
            if (sentenceVariation.length) {
                const returnSentenceTokens = chatitoFormatPostProcess(sentenceVariation);
                for (const returnToken of returnSentenceTokens) {
                    if (slotSynonyms) {
                        returnToken.synonym = t.value;
                    }
                    if (t.type === 'Slot') {
                        if (def[innerEntityKey].args) {
                            returnToken.args = def[innerEntityKey].args;
                        }
                        returnToken.value = returnToken.value.trim();
                        returnToken.type = t.type;
                        returnToken.slot = t.value;
                    }
                    accumulator = accumulator.concat(returnToken);
                }
            }
        } else {
            accumulator = accumulator.concat(t);
        }
    }
    return accumulator;
};

export const astFromString = (str: string) => chatito.parse(str);
export const datasetFromString = (str: string, writterFn: IUtteranceWriter) => {
    const ast = astFromString(str);
    return datasetFromAST(ast, writterFn);
};

export const datasetFromAST = async (ast: IChatitoEntityAST[], writterFn: IUtteranceWriter) => {
    const operatorDefinitions: IEntities = { Intent: {}, Slot: {}, Alias: {} };
    if (!ast || !ast.length) {
        return;
    }
    ast.forEach(od => {
        let entity: IEntityDef;
        if (od.type === 'IntentDefinition') {
            entity = operatorDefinitions.Intent;
        } else if (od.type === 'SlotDefinition') {
            entity = operatorDefinitions.Slot;
        } else if (od.type === 'AliasDefinition') {
            entity = operatorDefinitions.Alias;
        } else if (od.type === 'Comment') {
            return; // skip comments
        } else {
            throw new Error(`Unknown definition definition for ${od.type}`);
        }
        const odKey = od.variation ? `${od.key}#${od.variation}` : od.key;
        if (entity[odKey]) {
            throw new Error(`Duplicate definition for ${od.type} '${odKey}'`);
        }
        entity[odKey] = od;
    });
    const intentKeys = Object.keys(operatorDefinitions.Intent);
    if (!intentKeys || !intentKeys.length) {
        throw new Error('No actions found');
    }
    for (const intentKey of intentKeys) {
        // and for all tokens inside the sentence
        const maxPossibleCombinations = utils.maxSentencesForEntity(operatorDefinitions.Intent[intentKey], operatorDefinitions);
        let maxIntentExamples = maxPossibleCombinations; // counter that will change
        const entityArgs = operatorDefinitions.Intent[intentKey].args;
        // by default if no training or testing arguments are declared, all go to training
        let trainingN = maxIntentExamples;
        let testingN = 0;
        let generatedTrainingExamplesCount = 0;
        if (entityArgs) {
            if (entityArgs.training) {
                trainingN = parseInt(entityArgs.training, 10);
                if (trainingN < 1) {
                    throw new Error(`The 'training' argument for ${intentKey} must be higher than 0.`);
                }
                if (entityArgs.testing) {
                    testingN = parseInt(entityArgs.testing, 10);
                    if (testingN < 1) {
                        throw new Error(`The 'testing' argument for ${intentKey} must be higher than 0.`);
                    }
                }
            }
            const intentMax = trainingN + testingN;
            if (intentMax > maxIntentExamples) {
                throw new Error(`Can't generate ${intentMax} examples. Max possible examples is ${maxIntentExamples}`);
            } else if (intentMax < maxIntentExamples) {
                maxIntentExamples = intentMax;
            }
        }
        const maxEx = maxIntentExamples;
        const globalCache: IChatitoCache = new Map();
        const collitionsCache: { [id: string]: boolean } = {};
        let duplicatesCounter = 0;
        while (maxIntentExamples) {
            const intentSentence = await getVariationsFromEntity(
                operatorDefinitions.Intent[intentKey],
                operatorDefinitions,
                false,
                globalCache
            );
            const utterance = chatitoFormatPostProcess(intentSentence);
            const utteranceString = utterance.reduce((p, n) => p + n.value, '');
            if (!collitionsCache[utteranceString]) {
                collitionsCache[utteranceString] = true;
                writterFn(utterance, intentKey, generatedTrainingExamplesCount < trainingN);
                maxIntentExamples--;
                generatedTrainingExamplesCount++;
            } else {
                duplicatesCounter++;
                // note: trick to make all combinations for small datasets, but avoid them for large ones
                const maxDupes = maxPossibleCombinations * maxPossibleCombinations;
                const maxDupesLimit = Math.floor(maxPossibleCombinations / 2);
                if (duplicatesCounter > (maxPossibleCombinations > 10000 ? maxDupesLimit : maxDupes)) {
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
