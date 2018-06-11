import * as gen from '../main';
import { ISentenceTokens, IUtteranceWriter } from '../types';

export interface IDefaultDataset { [intent: string]: ISentenceTokens[][]; }
export async function adapter(dsl: string, formatOptions?: any) {
    const dataset: IDefaultDataset = {};
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, n: number) => {
        if (!dataset[intentKey]) { dataset[intentKey] = []; }
        dataset[intentKey].push(utterance);
    };
    await gen.datasetFromString(dsl, utteranceWriter);
    return dataset;
}
