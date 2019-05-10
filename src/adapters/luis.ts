import * as gen from '../main';
import { ISentenceTokens } from '../types';
import * as utils from '../utils';

export interface ILuisEntityLabel {
    startCharIndex: number;
    endCharIndex: number;
    entityName: string;
}
export interface ILuisExample {
    text: string;
    intentName: string;
    entityLabels: ILuisEntityLabel[];
}
export interface ILuisDataset {
    data: ILuisExample[];
}

export interface ILuisTestingDataset {
    [intent: string]: ISentenceTokens[][];
}

export async function adapter(dsl: string, formatOptions?: any, importer?: gen.IFileImporter, currentPath?: string) {
    const training: ILuisDataset = { data: [] };
    const testing: ILuisDataset = { data: [] };
    if (formatOptions) {
        utils.mergeDeep(training, formatOptions);
    }
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, isTrainingExample: boolean) => {
        const example = utterance.reduce(
            (acc, next) => {
                if (next.type === 'Slot' && next.slot) {
                    acc.entityLabels.push({
                        endCharIndex: acc.text.length + next.value.length,
                        entityName: next.slot,
                        startCharIndex: acc.text.length
                    });
                }
                acc.text += next.value;
                return acc;
            },
            { text: '', intentName: intentKey, entityLabels: [] } as ILuisExample
        );
        if (isTrainingExample) {
            training.data.push(example);
        } else {
            testing.data.push(example);
        }
    };
    await gen.datasetFromString(dsl, utteranceWriter, importer, currentPath);
    return { training, testing };
}
