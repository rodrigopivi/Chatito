import * as gen from '../main';
import { ISentenceTokens } from '../types';
import * as utils from '../utils';

export interface IDefaultDataset {
    [intent: string]: ISentenceTokens[][];
}
export async function adapter(dsl: string, formatOptions?: any, importer?: gen.IFileImporter, currentPath?: string) {
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
    await gen.datasetFromString(dsl, utteranceWriter, importer, currentPath);
    return { training, testing };
}
