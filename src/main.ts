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
        const maxCounts: number[] = []; // calcs the max possible utterancees for each sentence
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
            let mxc = utils.maxSentencesForSentence(entities)(c);
            if (optional) {
                mxc++;
            }
            maxCounts.push(mxc);
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
        const currentEntityCache: IStatCache = { counts, maxCounts, optional, probabilities };
        cache.set(cacheKey, currentEntityCache);
        cacheStats = cache.get(cacheKey) as IStatCache;
    }
    // NOTE: if an entity has 5 sentences we add one (the optional empty sentence) and get that probability
    const optionalProb = 100 / (cacheStats.probabilities.length + 1);
    let sentenceIndex = chance.weighted(Array.from(cacheStats.probabilities.keys()), cacheStats.probabilities);
    if (cacheStats.optional && chance.bool({ likelihood: optionalProb })) {
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
            const innerEntityKey = t.variation ? `${t.value}#${t.variation}` : t.value;
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
        const maxPossibleCombinations = utils.maxSentencesForEntity(operatorDefinitions.Intent[intentKey], operatorDefinitions);
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
                intentMax = maxIntentExamples;
                logger.warn(
                    `Can't generate ${intentMax} examples. Using the maximum possible combinations: ${maxIntentExamples}. NOTE: Using the maximum leads to overfitting.`
                );
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
                    m += `the maximun ammount of possible unique generated examples. `;
                    m += `The generator has stopped at ${maxEx - maxIntentExamples} examples for intent ${intentKey}.`;
                    logger.warn(m);
                    maxIntentExamples = 0;
                }
            }
        }
    }
};
