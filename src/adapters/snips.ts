import * as gen from '../main';
import { ISentenceTokens, IUtteranceWriter } from '../types';
import * as utils from '../utils';

export interface ISnipsUtteranceData { text: string; entity?: string; slot_name?: string; }
export interface ISnipsUtterance { data: ISnipsUtteranceData[]; }
export interface ISnipsIntent { utterances: ISnipsUtterance[]; }
export interface ISnipsDataset {
    intents: { [intentKey: string]: ISnipsIntent; };
    entities: {
        [entityKey: string]: {
            data?: Array<{ value: string; synonyms: string[] }>;
            use_synonyms?: boolean;
            automatically_extensible?: boolean;
        };
    };
    language: string;
}

export async function adapter(dsl: string, formatOptions?: any) {
    const dataset: ISnipsDataset = { intents: {}, entities: {}, language: 'en' };
    if (formatOptions) { utils.mergeDeep(dataset, formatOptions); }
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, n: number) => {
        if (!dataset.intents[intentKey]) { dataset.intents[intentKey] = { utterances: [] }; }
        const data = utterance.map((u) => {
            const ret: ISnipsUtteranceData = { text: u.value };
            if (u.type === 'Slot' && u.slot) {
                if (!dataset.entities[u.slot]) { dataset.entities[u.slot] = {}; }
                ret.slot_name = u.slot;
                ret.entity = u.slot;
            }
            return ret;
        });
        dataset.intents[intentKey].utterances.push({ data });

    };
    await gen.datasetFromString(dsl, utteranceWriter);
    return dataset;
}
