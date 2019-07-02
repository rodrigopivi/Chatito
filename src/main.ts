import { Chance } from 'chance';
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
import * as utils from './utils';

const logger = console;

export const VALID_DISTRIBUTIONS = ['regular', 'even'] as const;

export interface IConfigOptions {
    defaultDistribution?: typeof VALID_DISTRIBUTIONS[number];
}

type Configuration = Required<IConfigOptions>;

export const config: Configuration = {
    defaultDistribution: 'regular'
};

// tslint:disable-next-line:no-var-requires
const chatito = require('../parser/chatito') as IChatitoParser;
const chance = new Chance();

/**
 * Returns the entity key for the Alias/Slot that `token` refers to
 * @param token Sentence's token
 */
const getEntityKey = (token: ISentenceTokens) => (token.variation ? `${token.value}#${token.variation}` : token.value);

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
                if (accumulator.length) {
                    if (!accumulator[accumulator.length - 1].value.trim()) {
                        accumulator.pop();
                    }
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
    if (!arr.length) {
        throw new Error(`Some sentence generated an empty string. Can't map empty to an intent.`);
    }
    return arr;
};

const calcSentencesProbabilities = (
    isPercentageProbability: boolean,
    isEvenDistribution: boolean,
    definedSentenceProbabilities: Array<number | null>,
    sumOfTotalProbabilitiesDefined: number,
    maxCounts: number[]
) => {
    let sentencesWithNullProbabilityCount = 0;
    let totalMaxCountsToShareBetweenNullProbs = 0;
    definedSentenceProbabilities.forEach((prob, i) => {
        if (prob === null) {
            sentencesWithNullProbabilityCount += 1;
            totalMaxCountsToShareBetweenNullProbs += maxCounts[i];
        }
    });
    let probabilities: number[];
    if (isPercentageProbability) {
        // if defined probabilities is percentual, then calculate each sentence chances in percent
        probabilities = definedSentenceProbabilities.map((p, i) => {
            if (p !== null) {
                return p;
            }
            if (isEvenDistribution) {
                return (100 - sumOfTotalProbabilitiesDefined) / sentencesWithNullProbabilityCount;
            }
            return (((maxCounts[i] * 100) / totalMaxCountsToShareBetweenNullProbs) * (100 - sumOfTotalProbabilitiesDefined)) / 100;
        });
    } else {
        // if probabilityTypeDefined is weighted, then multiply the weight by max counts
        probabilities = definedSentenceProbabilities.map((p, i) => {
            if (p !== null) {
                return isEvenDistribution ? p : maxCounts[i] * p;
            }
            if (isEvenDistribution) {
                return 1;
            }
            return maxCounts[i];
        });
    }
    return probabilities;
};

// recursive function that generates variations using a cache
// that uses counts to avoid repetitions
export const getVariationsFromEntity = async <T>(
    ed: IChatitoEntityAST,
    entities: IEntities,
    optional: boolean,
    cache: IChatitoCache
): Promise<ISentenceTokens[]> => {
    // if this entity is a slot variation, add that as the key
    const variationKey = ed.variation ? `#${ed.variation}` : '';
    const cacheKey = `${ed.type}-${ed.key}${variationKey}`;
    let cacheStats = cache.get(cacheKey) as IStatCache;
    if (!cacheStats) {
        // if the entity is not cache, create an empty cache for it
        const counts: IChatitoCache[] = [];
        const maxCounts: number[] = ed.inner.map(s => s.cardinality!);
        let probabilityTypeDefined: 'w' | '%' | null = null;
        const definedSentenceProbabilities: Array<number | null> = []; // the posibility operators defined for sentences
        let isEvenDistribution = config.defaultDistribution === 'even';
        if (ed.args && ed.args.distribution) {
            isEvenDistribution = ed.args.distribution === 'even';
        }
        let sumOfTotalProbabilitiesDefined = 0;
        for (const c of ed.inner) {
            // get counts for each of the sentences inside the entity
            counts.push(new Map());
            if (c.probability === null) {
                definedSentenceProbabilities.push(null);
            } else {
                const p = c.probability || '';
                const isPercent = p.slice(-1) === '%';
                const setenceProbabilityType = isPercent ? '%' : 'w';
                if (probabilityTypeDefined === null) {
                    probabilityTypeDefined = setenceProbabilityType;
                } else if (setenceProbabilityType !== probabilityTypeDefined) {
                    throw new Error(`All probability definitions for "${cacheKey}" must be of the same type.`);
                }
                const prob = parseFloat(isPercent ? p.slice(0, -1) : p);
                if (isPercent) {
                    if (prob <= 0 || prob > 100) {
                        throw new Error(`Probability "${p}" must be greater than 0 up to 100. At ${cacheKey}`);
                    }
                } else if (setenceProbabilityType === 'w') {
                    if (prob <= 0) {
                        throw new Error(`Probability weight "${p}" must be greater than 0. At ${cacheKey}`);
                    }
                }
                sumOfTotalProbabilitiesDefined += prob;
                definedSentenceProbabilities.push(prob);
            }
        }
        if (probabilityTypeDefined === '%' && sumOfTotalProbabilitiesDefined && sumOfTotalProbabilitiesDefined > 100) {
            throw new Error(
                `The sum of sentence probabilities (${sumOfTotalProbabilitiesDefined}) for an entity can't be higher than 100%. At ${cacheKey}`
            );
        }
        const isPercentageProbability = probabilityTypeDefined === '%';
        const probabilities = calcSentencesProbabilities(
            isPercentageProbability,
            isEvenDistribution,
            definedSentenceProbabilities,
            sumOfTotalProbabilitiesDefined,
            maxCounts
        );
        const currentEntityCache: IStatCache = { counts, maxCounts, probabilities };
        cache.set(cacheKey, currentEntityCache);
        cacheStats = cache.get(cacheKey) as IStatCache;
    }
    // NOTE: if an entity has 5 sentences we add one (the optional empty sentence) and get that probability
    const optionalProb = 100 / (cacheStats.probabilities.length + 1);
    let sentenceIndex = chance.weighted(Array.from(cacheStats.probabilities.keys()), cacheStats.probabilities);
    if (optional && chance.bool({ likelihood: optionalProb })) {
        sentenceIndex = -1;
    }
    if (sentenceIndex === -1) {
        return [];
    }
    const sentence = ed.inner[sentenceIndex].sentence;
    let accumulator: ISentenceTokens[] = [];
    // For slots where a sentence is composed of only one alias, we add the synonym tag,
    // to denote that the generated alias is a synonym of its alias name
    const isSlotDefSentenceWithOnlyOneAlias = ed.type === 'SlotDefinition' && sentence.length === 1 && sentence[0].type === 'Alias';
    for (const t of sentence) {
        // slots and alias entities generate the sentences recursively
        const slotsInSentenceKeys: Set<string> = new Set([]);
        if (t.type === 'Slot' || t.type === 'Alias') {
            const def = entities[t.type];
            const innerEntityKey = getEntityKey(t);
            const currentCache = slotsInSentenceKeys.has(innerEntityKey) ? cacheStats.counts[sentenceIndex] : new Map();
            slotsInSentenceKeys.add(innerEntityKey);
            const sentenceVariation = await getVariationsFromEntity(def[innerEntityKey], entities, !!t.opt, currentCache);
            if (sentenceVariation.length) {
                const returnSentenceTokens = chatitoFormatPostProcess(sentenceVariation);
                for (const returnToken of returnSentenceTokens) {
                    const ettArgs = def[innerEntityKey].args;
                    if (isSlotDefSentenceWithOnlyOneAlias && ettArgs && ettArgs.synonym === 'true') {
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

/**
 * Picks the `combinationNumber`th example amongst all possible `entity` examples.
 *
 * @param defs All entities definitions
 * @param entity Entity to get the example from
 * @param combinationNumber The number of the example
 */
export const getExampleByNumber = (defs: IEntities, entity: IChatitoEntityAST, combinationNumber: number): ISentenceTokens[] => {
    let lookupNumber = combinationNumber;
    const sentence = entity.inner.find(s => {
        if (lookupNumber < s.cardinality!) {
            return true;
        }
        lookupNumber -= s.cardinality!;
        return false;
    });
    if (!sentence) {
        return [];
    }
    let prevCardinality = 1;
    let prevRemaining = 0;
    const isSlotDefSentenceWithOnlyOneAlias =
        entity.type === 'SlotDefinition' && sentence.sentence.length === 1 && sentence.sentence[0].type === 'Alias';
    const resultTokens = sentence.sentence.reduce(
        (example, token) => {
            if (token.type === 'Text') {
                return example.concat([token]);
            }
            if (token.type === 'Slot' || token.type === 'Alias') {
                let cardinality = token.opt ? 1 : 0;
                const innerEntity = token.type === 'Alias' ? defs.Alias : defs.Slot;
                const entityKey = getEntityKey(token);
                cardinality += innerEntity[entityKey].cardinality!;
                lookupNumber = (lookupNumber - prevRemaining) / prevCardinality;
                prevRemaining = lookupNumber % cardinality;
                prevCardinality = cardinality;
                if (prevRemaining === 0 && token.opt) {
                    return example;
                }
                const innerNumber = token.opt ? prevRemaining - 1 : prevRemaining;
                let tokens = getExampleByNumber(defs, innerEntity[entityKey], innerNumber);
                tokens = chatitoFormatPostProcess(tokens).map(t => {
                    const ettArgs = innerEntity[entityKey].args;
                    if (isSlotDefSentenceWithOnlyOneAlias && ettArgs && ettArgs.synonym === 'true') {
                        t.synonym = token.value;
                    }
                    if (token.type === 'Slot') {
                        if (innerEntity[entityKey].args) {
                            t.args = innerEntity[entityKey].args;
                        }
                        t.value = t.value.trim();
                        t.type = token.type;
                        t.slot = token.value;
                    }
                    return t;
                });
                return example.concat(tokens);
            }
            throw Error(`Unknown token type: ${token.type}`);
        },
        [] as ISentenceTokens[]
    );
    return chatitoFormatPostProcess(resultTokens);
};

/**
 * Returns a generator providing every possible combination of entity's examples
 * including duplicates.
 *
 * @param defs All entities definitions
 * @param entity Entity to get all examples for
 */
export function* allExamplesGenerator(defs: IEntities, entity: IChatitoEntityAST) {
    for (let i = 0; i < entity.cardinality!; i++) {
        yield getExampleByNumber(defs, entity, i);
    }
}

/**
 * Calculates the cardinality of the `sentence`.
 * All the entities used in the sentence must already have their cardinalities
 * calculated.
 *
 * @param defs All entities definitions
 * @param sentence Sentence tokens
 */
const getCardinality = (defs: IEntities, sentence: ISentenceTokens[]) => {
    return sentence.reduce((acc, token) => {
        if (token.type === 'Text') {
            return acc;
        }
        const entity = token.type === 'Alias' ? defs.Alias : defs.Slot;
        const entityKey = getEntityKey(token);

        let tokenCardinality = entity[entityKey].cardinality!;
        if (token.opt) {
            tokenCardinality += 1;
        }
        return acc * tokenCardinality;
    }, 1);
};

/**
 * Calculates the cardinality of the `entity`.
 * All the entities used in the entity must already have their cardinalities
 * calculated.
 *
 * @param defs All entities definitions
 * @param entity Entity to calc cardinality for
 */
const calcCardinality = (defs: IEntities, entity: IChatitoEntityAST) => {
    entity.inner.forEach(sentence => {
        const cardinality = getCardinality(defs, sentence.sentence);
        sentence.cardinality = cardinality;
    });
    entity.cardinality = entity.inner.reduce((acc, sentence) => acc + sentence.cardinality!, 0);
};

/**
 * Returns human readable string representing an entity.
 * Returns the same string for entity definition and it's use in a token.
 *
 * @param item Token or Entity definition
 */
const getRefKey = (item: IChatitoEntityAST | ISentenceTokens) => {
    const type = item.type.replace('Definition', '');
    const key = 'key' in item ? item.key : getEntityKey(item);
    switch (type) {
        case 'Intent':
            return `%[${key}]`;
        case 'Alias':
            return `~[${key}]`;
        case 'Slot':
            return `@[${key}]`;

        default:
            return `(${key})`;
    }
};

/**
 * Returns true if the `entity` has any entity with cardinality not yet being
 * calculated.
 * Also populates `refs` map.
 *
 * @param defs All entities definitions
 * @param entity An Entity
 * @param refs A map of entities references
 */
const hasTokenWithoutCardinality = (defs: IEntities, entity: IChatitoEntityAST, refs: { [key: string]: Set<string> }) => {
    const parentKey = getRefKey(entity);
    return entity.inner.some(sentence =>
        sentence.sentence.some(token => {
            if (token.type === 'Text') {
                return false;
            }
            const entityKey = getEntityKey(token);
            const refKey = getRefKey(token);
            if (refKey in refs) {
                refs[refKey].add(parentKey);
            } else {
                refs[refKey] = new Set([parentKey]);
            }
            if (!defs[token.type][entityKey]) {
                throw new Error(`${token.type} not defined: ${entityKey}`);
            }
            return defs[token.type][entityKey].cardinality === undefined;
        })
    );
};

/**
 * Throws an error showing loop path if there is any in entities references (`refs`)
 * starting with `path` path.
 *
 * @param path Current path
 * @param refs Entities references map
 */
const checkLoopIn = (path: string[], refs: { [key: string]: Set<string> }) => {
    const last = path[path.length - 1];
    if (refs[last]) {
        for (const parent of refs[last]) {
            if (parent === path[0]) {
                const loop = path.concat([parent]).reverse();
                throw new Error(`You have a circular nesting: ${loop.join(' -> ')}. Infinite loop prevented.`);
            } else {
                checkLoopIn(path.concat([parent]), refs);
            }
        }
    }
};

/**
 * Throws an error showing loop path if there is any in entities references (`refs`)
 *
 * @param refs Entities references map
 */
const checkLoop = (refs: { [key: string]: Set<string> }) => {
    for (const key of Object.keys(refs)) {
        const path = [key];
        checkLoopIn(path, refs);
    }
};

/**
 * Throws an error showing slots nesting path if there is any
 * in the entitiesreferences (`refs`) starting with `path` path.
 *
 * @param path Current path
 * @param refs Entities references map
 */
const findNestedSlots = (path: string[], refs: { [key: string]: Set<string> }) => {
    const last = path[path.length - 1];
    if (refs[last]) {
        for (const parent of refs[last]) {
            const firstIndex = path.findIndex(item => item.startsWith('@'));
            if (firstIndex !== -1 && parent.startsWith('@')) {
                const slotsPath = path
                    .slice(firstIndex)
                    .reverse()
                    .join(' -> ');
                throw new Error(`You have nested slots: ${parent} -> ${slotsPath}. A slot can't reference other slot.`);
            } else {
                findNestedSlots(path.concat([parent]), refs);
            }
        }
    }
};

/**
 * Throws an error showing slots nesting path if there is any
 * in the entitiesreferences (`refs`).
 *
 * @param refs Entities references map
 */
const checkNestedSlots = (refs: { [key: string]: Set<string> }) => {
    for (const key of Object.keys(refs)) {
        const path = [key];
        findNestedSlots(path, refs);
    }
};

/**
 * Calculates cardinalities for all entities.
 * Also checks for nested slots.
 *
 * @param defs All entities definitions
 */
const preCalcCardinality = (defs: IEntities) => {
    // cycle through uncalculated:
    const uncalced = {
        Intent: [] as string[],
        Alias: [] as string[],
        Slot: [] as string[]
    };
    const refs: { [key: string]: Set<string> } = {};
    let totalUncalced = 0;
    let lastUncalced = -1;
    do {
        totalUncalced = 0;
        for (const type of Object.keys(uncalced) as Array<keyof typeof uncalced>) {
            uncalced[type] = Object.keys(defs[type]).filter(key => defs[type][key].cardinality === undefined);
            uncalced[type].forEach(key => {
                if (!hasTokenWithoutCardinality(defs, defs[type][key], refs)) {
                    calcCardinality(defs, defs[type][key]);
                } else {
                    totalUncalced += 1;
                }
            });
        }
        if (lastUncalced === totalUncalced) {
            checkLoop(refs);
        }
        lastUncalced = totalUncalced;
    } while (totalUncalced > 0);
    checkNestedSlots(refs);
};

/**
 * Adds missing alias definitions.
 * When alias is used in sentence tokens but not defined.
 *
 * @param defs All entities definitions
 */
const addMissingAliases = (defs: IEntities) => {
    const aliases = new Set<string>();
    for (const entities of [defs.Alias, defs.Slot, defs.Intent]) {
        for (const key of Object.keys(entities)) {
            entities[key].inner.forEach(sentence => {
                sentence.sentence.forEach(token => {
                    if (token.type === 'Alias') {
                        aliases.add(token.value);
                    }
                });
            });
        }
    }
    for (const alias of aliases) {
        if (!defs.Alias[alias]) {
            defs.Alias[alias] = {
                inner: [{ sentence: [{ value: alias, type: 'Text' }], probability: null }],
                key: alias,
                type: 'AliasDefinition'
            };
        }
    }
};

export type IFileImporter = (
    fromPath: string,
    importFile: string
) => {
    filePath: string;
    dsl: string;
};

export const astFromString = (str: string) => chatito.parse(str);
export const datasetFromString = (str: string, writterFn: IUtteranceWriter, importer?: IFileImporter, currentPath?: string) => {
    const ast = astFromString(str);
    return datasetFromAST(ast, writterFn, importer, currentPath);
};

export const getImports = (from: string, to: string, importer: IFileImporter) => {
    const fileContent = importer(from, to);
    if (!fileContent || !fileContent.dsl) {
        throw new Error(`Failed importing ${to}`);
    }
    try {
        const importAst = astFromString(fileContent.dsl);
        let outAst: IChatitoEntityAST[] = [];
        importAst.forEach(ett => {
            if (ett.type === 'ImportFile' && ett.value) {
                outAst = [...outAst, ...getImports(fileContent.filePath, ett.value, importer)];
            } else if (ett.type === 'AliasDefinition' || ett.type === 'SlotDefinition') {
                outAst = [...outAst, ett];
            }
        });
        return outAst;
    } catch (e) {
        throw new Error(`Failed importing ${to}. ${e.message} - ${JSON.stringify(e.location)}`);
    }
};

export const definitionsFromAST = (initialAst: IChatitoEntityAST[], importHandler?: IFileImporter, currPath?: string) => {
    const operatorDefinitions: IEntities = { Intent: {}, Slot: {}, Alias: {} };
    if (!initialAst || !initialAst.length) {
        return;
    }
    const importer = importHandler ? importHandler : () => ({ filePath: '', dsl: '' });
    const currentPath = currPath ? currPath : '';
    // gete imports first
    let ast: IChatitoEntityAST[] = [...initialAst];
    initialAst.forEach(od => {
        if (od.type === 'ImportFile' && od.value) {
            ast = [...ast, ...getImports(currentPath, od.value, importer)];
        }
    });
    ast.forEach(od => {
        let entity: IEntityDef;
        if (od.type === 'IntentDefinition') {
            entity = operatorDefinitions.Intent;
        } else if (od.type === 'SlotDefinition') {
            entity = operatorDefinitions.Slot;
        } else if (od.type === 'AliasDefinition') {
            entity = operatorDefinitions.Alias;
        } else {
            // type is 'Comment' or 'ImportFile'
            return; // skip comments
        }
        const odKey = od.variation ? `${od.key}#${od.variation}` : od.key;
        if (entity[odKey]) {
            throw new Error(`Duplicate definition for ${od.type} '${odKey}'`);
        }
        entity[odKey] = od;
    });
    addMissingAliases(operatorDefinitions);
    preCalcCardinality(operatorDefinitions);
    return operatorDefinitions;
};

export const datasetFromAST = async (
    initialAst: IChatitoEntityAST[],
    writterFn: IUtteranceWriter,
    importHandler?: IFileImporter,
    currPath?: string
) => {
    const operatorDefinitions = definitionsFromAST(initialAst, importHandler, currPath);
    if (!operatorDefinitions) {
        return;
    }
    const intentKeys = Object.keys(operatorDefinitions.Intent);
    if (!intentKeys || !intentKeys.length) {
        return;
    }
    for (const intentKey of intentKeys) {
        // and for all tokens inside the sentence
        const maxPossibleCombinations = operatorDefinitions.Intent[intentKey].cardinality!;
        let maxIntentExamples = maxPossibleCombinations; // counter that will change
        const entityArgs = operatorDefinitions.Intent[intentKey].args;
        // by default if no training or testing arguments are declared, all go to training
        let trainingN = maxIntentExamples;
        let testingN = 0;
        let generatedTrainingExamplesCount = 0;
        let generatedTestingExamplesCount = 0;
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
            let intentMax = trainingN + testingN;
            if (intentMax > maxIntentExamples) {
                logger.warn(
                    `Can't generate ${intentMax} examples. ` +
                        `Using the maximum possible combinations: ${maxIntentExamples}. ` +
                        'NOTE: Using the maximum leads to overfitting.'
                );
                intentMax = maxIntentExamples;
            } else if (intentMax < maxIntentExamples) {
                maxIntentExamples = intentMax;
            }
        }
        const maxEx = maxIntentExamples;
        const globalCache: IChatitoCache = new Map();
        const collitionsCache: { [id: string]: boolean } = {};
        if (maxIntentExamples >= maxPossibleCombinations) {
            for (const utterance of allExamplesGenerator(operatorDefinitions, operatorDefinitions.Intent[intentKey])) {
                const utteranceString = utterance.reduce((p, n) => p + n.value, '');
                if (!collitionsCache[utteranceString]) {
                    collitionsCache[utteranceString] = true;
                    const completedTraining = generatedTrainingExamplesCount >= trainingN;
                    const completedTesting = generatedTestingExamplesCount >= testingN;
                    let isTrainingExample = !completedTraining;
                    if (!completedTraining && !completedTesting) {
                        const trainingLeft = trainingN - generatedTrainingExamplesCount;
                        const testingLeft = testingN - generatedTestingExamplesCount;
                        isTrainingExample = Math.random() < trainingLeft / (trainingLeft + testingLeft);
                    }
                    writterFn(utterance, intentKey, isTrainingExample);
                    if (isTrainingExample) {
                        generatedTrainingExamplesCount++;
                    } else {
                        generatedTestingExamplesCount++;
                    }
                }
            }
            continue;
        }
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
                const completedTraining = generatedTrainingExamplesCount >= trainingN;
                const completedTesting = generatedTestingExamplesCount >= testingN;
                let isTrainingExample = !completedTraining;
                if (!completedTraining && !completedTesting) {
                    // reference: https://stackoverflow.com/questions/44263229/generate-a-random-boolean-70-true-30-false
                    isTrainingExample = Math.random() < 0.7;
                }
                writterFn(utterance, intentKey, isTrainingExample);
                maxIntentExamples--;
                if (isTrainingExample) {
                    generatedTrainingExamplesCount++;
                } else {
                    generatedTestingExamplesCount++;
                }
            } else {
                duplicatesCounter++;
                // note: trick to make all combinations for small datasets, but avoid them for large ones
                const smallDupesLimit = 10000;
                const maxDupes = maxPossibleCombinations * maxPossibleCombinations;
                const maxDupesLimit = Math.floor(maxDupes / 2);
                const isBigDataset = maxPossibleCombinations > smallDupesLimit;
                if (
                    (isBigDataset && duplicatesCounter > maxDupesLimit) ||
                    (!isBigDataset && duplicatesCounter > maxDupes * maxPossibleCombinations)
                ) {
                    // prevent cases where duplicates are part of the entity definitions
                    let m = `Too many duplicates while generating dataset! Looks like we have probably reached `;
                    m += `the maximum ammount of possible unique generated examples. `;
                    m += `The generator has stopped at ${maxEx - maxIntentExamples} examples for intent ${intentKey}.`;
                    logger.warn(m);
                    maxIntentExamples = 0;
                }
            }
        }
    }
};
