import * as gen from '../main';
import { ISentenceTokens, IUtteranceWriter } from '../types';
import * as utils from '../utils';

export interface IRasaEntity { start: number; end: number; value: string; entity: string; }
export interface IRasaExample { text: string; intent: string; entities: IRasaEntity[]; }
export interface IRasaDataset {
    rasa_nlu_data: { regex_features: any[]; entity_synonyms: any[]; common_examples: IRasaExample[]; };
}

export async function adapter(dsl: string, formatOptions?: any) {
    const dataset: IRasaDataset = { rasa_nlu_data: { regex_features : [], entity_synonyms: [], common_examples: [] } };
    if (formatOptions) { utils.mergeDeep(dataset, formatOptions); }
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, n: number) => {
        const example = utterance.reduce((acc, next) => {
            if (next.type === 'Slot' && next.slot) {
                acc.entities.push({
                    end: acc.text.length + next.value.length,
                    entity: next.slot,
                    start: acc.text.length,
                    value: next.value,
                });
            }
            acc.text += next.value;
            return acc;
        }, ({ text: '', intent: intentKey, entities: [] }) as IRasaExample);
        dataset.rasa_nlu_data.common_examples.push(example);
    };
    await gen.datasetFromString(dsl, utteranceWriter);
    return dataset;
}
