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

export interface IRasaTestingDataset {
    [intent: string]: ISentenceTokens[][];
}

export async function adapter(dsl: string, formatOptions?: any, importer?: gen.IFileImporter, currentPath?: string) {
    const training: IRasaDataset = {
        rasa_nlu_data: {
            regex_features: [],
            entity_synonyms: [],
            common_examples: []
        }
    };
    const testing = { rasa_nlu_data: { common_examples: [] as IRasaExample[] } };
    const synonyms: { [key: string]: Set<string> } = {};
    if (formatOptions) {
        utils.mergeDeep(training, formatOptions);
    }
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, isTrainingExample: boolean) => {
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
                        value: next.synonym ? next.synonym : next.value
                    });
                }
                acc.text += next.value;
                return acc;
            },
            { text: '', intent: intentKey, entities: [] } as IRasaExample
        );
        if (isTrainingExample) {
            training.rasa_nlu_data.common_examples.push(example);
        } else {
            testing.rasa_nlu_data.common_examples.push(example);
        }
    };
    await gen.datasetFromString(dsl, utteranceWriter, importer, currentPath);
    Object.keys(synonyms).forEach(k => {
        training.rasa_nlu_data.entity_synonyms.push({
            synonyms: [...synonyms[k]],
            value: k
        });
    });
    return { training, testing };
}
