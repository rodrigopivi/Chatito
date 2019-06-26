import { WriteStream } from 'fs';
import * as Tokenizer from 'wink-tokenizer';
import * as gen from '../main';
import { ISentenceTokens } from '../types';

const tokenizer = new Tokenizer();

export interface IDefaultDataset {
    [intent: string]: ISentenceTokens[][];
}
export interface IFlairWriteStreams {
    trainClassification: WriteStream;
    testClassification: WriteStream;
    trainNER: WriteStream;
    testNER: WriteStream;
}

// NOTE: Flair adapter uses write streams to text files and requires two different formats
// reference https://github.com/zalandoresearch/flair/blob/master/resources/docs/TUTORIAL_6_CORPUS.md
// E.G:
// npm run generate -- ./examples --format=flair --outputPath=./output --trainingFileName=training.txt --testingFileName=testing.txt
export async function streamAdapter(dsl: string, ws: IFlairWriteStreams, imp?: gen.IFileImporter, currPath?: string) {
    // NOTE: the utteranceWriter is called with each sentences with aliases already replaced,
    //       so the sentence toke can only be text or slot types.
    const utteranceWriter = (utterance: ISentenceTokens[], intentKey: string, isTrainingExample: boolean) => {
        // classification dataset in FastText format
        const classificationText = utterance.map(v => v.value).join('');
        const classificationLabel = intentKey.replace(/\s+/g, '');
        const writeStreamClassif = isTrainingExample ? ws.trainClassification : ws.testClassification;
        writeStreamClassif.write(`__label__${classificationLabel} ${classificationText}` + '\n');
        // named entity recognition dataset in two column with BIO-annotated NER tags (requires tokenization)
        const writeStreamNER = isTrainingExample ? ws.trainNER : ws.testNER;
        utterance.forEach(v => {
            const wordTokens = tokenizer.tokenize(v.value);
            if (v.type === 'Slot') {
                wordTokens.forEach((wt, idx) => {
                    const slotBorI = idx === 0 ? 'B' : 'I';
                    const slotTag = v.slot!.toLocaleUpperCase().replace(/\s+/g, '');
                    writeStreamNER.write(`${wt.value} ${slotBorI}-${slotTag}` + '\n');
                });
            } else {
                wordTokens.forEach(wt => writeStreamNER.write(`${wt.value} O` + '\n'));
            }
        });
        writeStreamNER.write('\n'); // always write an extra EOL at the end of sentences
    };
    await gen.datasetFromString(dsl, utteranceWriter, imp, currPath);
}
