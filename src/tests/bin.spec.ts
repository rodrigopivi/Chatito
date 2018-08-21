import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

test('test npm command line generator for large example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/dateBooking_large`);
    const generatedTrainingFile = path.resolve(generatedDir, 'bookRestaurantsAtDatetime_training.ndjson');
    const generatedTestingFile = path.resolve(generatedDir, 'bookRestaurantsAtDatetime_testing.ndjson');
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/dateBooking_large.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    if (fs.existsSync(generatedDir)) {
        fs.rmdirSync(generatedDir);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
    const fileBuffer = fs.readFileSync(generatedTrainingFile);
    const fileString = fileBuffer.toString();
    const lines = fileString.split('\n');
    expect(lines.length - 1).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for medium example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/citySearch_medium`);
    const generatedTrainingFile = path.resolve(generatedDir, 'findByCityAndCategory_training.ndjson');
    const generatedTestingFile = path.resolve(generatedDir, 'findByCityAndCategory_testing.ndjson');
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    if (fs.existsSync(generatedDir)) {
        fs.rmdirSync(generatedDir);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const fileBuffer1 = fs.readFileSync(generatedTrainingFile);
    const fileString1 = fileBuffer1.toString();
    const lines1 = fileString1.split('\n');
    expect(lines1.length - 1).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const fileBuffer2 = fs.readFileSync(generatedTestingFile);
    const fileString2 = fileBuffer2.toString();
    const lines2 = fileString2.split('\n');
    expect(lines2.length - 1).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for rasa medium example', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/citySearch_medium_rasa_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/citySearch_medium_rasa_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=rasa`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.rasa_nlu_data).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples.length).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.findByCityAndCategory).not.toBeNull();
    expect(testingDataset.findByCityAndCategory.length).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test('test npm command line generator for snips medium example', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/citySearch_medium_snips_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/citySearch_medium_snips_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=snips`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.intents).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory.utterances).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory.utterances.length).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.findByCityAndCategory).not.toBeNull();
    expect(testingDataset.findByCityAndCategory.length).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});
