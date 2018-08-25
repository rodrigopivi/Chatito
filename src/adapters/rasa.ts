import * as gen from '../main';
import { ISentenceTokens } from '../types';
import * as utils from '../utils';

export interface IRasaEntity {
    start: number;
    end: number;
    value: string;
    entity: string;
}
export interface IRasaExample {
    text: string;
    intent: string;
    entities: IRasaEntity[];
}
export interface IRasaDataset {
    rasa_nlu_data: {
        regex_features: any[];
        entity_synonyms: Array<{ value: string; synonyms: string[] }>;
        common_examples: IRasaExample[];
    };
}

interface IRasaTestingDataset {
    [intent: string]: ISentenceTokens[][];
}

export async function adapter(dsl: string, formatOptions?: any) {
    const training: IRasaDataset = {
        rasa_nlu_data: {
            regex_features: [],
            entity_synonyms: [],
            common_examples: []
        }
    };
    const testing: IRasaTestingDataset = {};
    const synonyms: { [key: string]: Set<string> } = {};
    if (formatOptions) {
        utils.mergeDeep(training, formatOptions);
    }
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, isTrainingExample: boolean) => {
        if (isTrainingExample) {
            const example = utterance.reduce(
                (acc, next) => {
                    if (next.type === 'Slot' && next.slot) {
                        if (next.synonym) {
                            if (!synonyms[next.synonym]) {
                                synonyms[next.synonym] = new Set();
                            }
                            if (next.synonym !== next.value) {
                                synonyms[next.synonym].add(next.value);
                            }
                        }
                        acc.entities.push({
                            end: acc.text.length + next.value.length,
                            entity: next.slot,
                            start: acc.text.length,
                            value: next.value
                        });
                    }
                    acc.text += next.value;
                    return acc;
                },
                { text: '', intent: intentKey, entities: [] } as IRasaExample
            );
            training.rasa_nlu_data.common_examples.push(example);
        } else {
            if (!testing[intentKey]) {
                testing[intentKey] = [];
            }
            testing[intentKey].push(utterance);
        }
    };
    await gen.datasetFromString(dsl, utteranceWriter);
    Object.keys(synonyms).forEach(k => {
        training.rasa_nlu_data.entity_synonyms.push({
            synonyms: [...synonyms[k]],
            value: k
        });
    });
    return { training, testing };
}
