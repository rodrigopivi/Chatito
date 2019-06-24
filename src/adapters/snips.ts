import * as gen from '../main';
import { ISentenceTokens } from '../types';
import * as utils from '../utils';

export interface ISnipsUtteranceData {
    text: string;
    entity?: string;
    slot_name?: string;
}
export interface ISnipsUtterance {
    data: ISnipsUtteranceData[];
}
export interface ISnipsIntent {
    utterances: ISnipsUtterance[];
}
export interface ISnipsDataset {
    intents: { [intentKey: string]: ISnipsIntent };
    entities: {
        [entityKey: string]: {
            data?: Array<{ value: string; synonyms: string[] }>;
            use_synonyms?: boolean;
            automatically_extensible?: boolean;
        };
    };
    language: string;
}

export interface ISnipsTestingDataset {
    [intent: string]: ISentenceTokens[][];
}

export async function adapter(dsl: string, formatOptions?: any, importer?: gen.IFileImporter, currentPath?: string) {
    const training: ISnipsDataset = { language: 'en', entities: {}, intents: {} };
    const testing: ISnipsTestingDataset = {};
    if (formatOptions) {
        utils.mergeDeep(training, formatOptions);
    }
    const synonymsForSlots: {
        [slot: string]: { [key: string]: Set<string> };
    } = {};
    // const slots: Set<string> = new Set();
    const entities: Set<string> = new Set();
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, isTrainingExample: boolean) => {
        if (isTrainingExample) {
            if (!training.intents[intentKey]) {
                training.intents[intentKey] = { utterances: [] };
            }
            const data = utterance.map(u => {
                const ret: ISnipsUtteranceData = { text: u.value };
                if (u.type === 'Slot' && u.slot) {
                    ret.slot_name = u.slot;
                    if (u.args) {
                        Object.keys(u.args).forEach(key => {
                            if (u.args && key === 'entity') {
                                entities.add(u.args[key]);
                                ret.entity = u.args[key];
                            }
                        });
                    }
                    if (!ret.entity) {
                        ret.entity = u.slot;
                        entities.add(u.slot);
                    }
                    if (u.synonym && ret.entity) {
                        if (!synonymsForSlots[ret.entity]) {
                            synonymsForSlots[ret.entity] = {};
                        }
                        const synonyms = synonymsForSlots[ret.entity];
                        if (!synonyms[u.synonym]) {
                            synonyms[u.synonym] = new Set();
                        }
                        if (u.synonym !== u.value) {
                            synonyms[u.synonym].add(u.value);
                        }
                    }
                }
                return ret;
            });
            training.intents[intentKey].utterances.push({ data });
        } else {
            if (!testing[intentKey]) {
                testing[intentKey] = [];
            }
            testing[intentKey].push(utterance);
        }
    };
    await gen.datasetFromString(dsl, utteranceWriter, importer, currentPath);
    entities.forEach(slotKey => {
        if (!synonymsForSlots[slotKey]) {
            if (!training.entities[slotKey]) {
                training.entities[slotKey] = {};
            }
            return;
        }
        Object.keys(synonymsForSlots[slotKey]).forEach(synonymsValue => {
            if (!training.entities[slotKey]) {
                training.entities[slotKey] = {};
            }
            training.entities[slotKey].use_synonyms = true;
            training.entities[slotKey].automatically_extensible = true;
            if (!training.entities[slotKey].data) {
                training.entities[slotKey].data = [];
            }
            const slotSynonymsSet = synonymsForSlots[slotKey][synonymsValue];
            const synonymsList = slotSynonymsSet.size ? Array.from(slotSynonymsSet) : [];
            (training.entities[slotKey].data as any[]).push({
                synonyms: synonymsList,
                value: synonymsValue
            });
        });
    });
    return { training, testing };
}
