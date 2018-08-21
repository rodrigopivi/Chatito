import * as gen from '../main';
import { ISentenceTokens, IUtteranceWriter } from '../types';
import * as utils from '../utils';

export interface IDefaultDataset {
    [intent: string]: ISentenceTokens[][];
}
export async function adapter(dsl: string, formatOptions?: any) {
    const training: IDefaultDataset = {};
    const testing: IDefaultDataset = {};
    if (formatOptions) {
        utils.mergeDeep(training, formatOptions);
    }
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, isTrainingExample: boolean) => {
        const dataset = isTrainingExample ? training : testing;
        if (!dataset[intentKey]) {
            dataset[intentKey] = [];
        }
        dataset[intentKey].push(utterance);
    };
    await gen.datasetFromString(dsl, utteranceWriter);
    return { training, testing };
}
