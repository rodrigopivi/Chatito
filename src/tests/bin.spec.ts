import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

test('test npm command line generator for large example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/dateBooking_large`);
    const generatedFile = path.resolve(generatedDir, 'bookRestaurantsAtDatetime.ndjson');
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/dateBooking_large.chatito`);
    if (fs.existsSync(generatedFile)) { fs.unlinkSync(generatedFile); }
    if (fs.existsSync(generatedDir)) { fs.rmdirSync(generatedDir); }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedFile)).toBeTruthy();
    const fileBuffer = fs.readFileSync(generatedFile);
    const fileString = fileBuffer.toString();
    const lines = fileString.split('\n');
    expect(lines.length - 1).toEqual(1000);
    fs.unlinkSync(generatedFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for medium example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/citySearch_medium`);
    const generatedFile = path.resolve(generatedDir, 'findByCityAndCategory.ndjson');
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedFile)) { fs.unlinkSync(generatedFile); }
    if (fs.existsSync(generatedDir)) { fs.rmdirSync(generatedDir); }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedFile)).toBeTruthy();
    const fileBuffer = fs.readFileSync(generatedFile);
    const fileString = fileBuffer.toString();
    const lines = fileString.split('\n');
    expect(lines.length - 1).toEqual(1000);
    fs.unlinkSync(generatedFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for rasa medium example', () => {
    const d = __dirname;
    const generatedFile = path.resolve(`${d}/../../examples/citySearch_medium_rasa.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedFile)) { fs.unlinkSync(generatedFile); }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=rasa`);
    expect(fs.existsSync(generatedFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.rasa_nlu_data).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples.length).toEqual(1000);
    fs.unlinkSync(generatedFile);
    expect(fs.existsSync(generatedFile)).toBeFalsy();
});

test('test npm command line generator for snips medium example', () => {
    const d = __dirname;
    const generatedFile = path.resolve(`${d}/../../examples/citySearch_medium_snips.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedFile)) { fs.unlinkSync(generatedFile); }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=snips`);
    expect(fs.existsSync(generatedFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.intents).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory.utterances).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory.utterances.length).toEqual(1000);
    fs.unlinkSync(generatedFile);
    expect(fs.existsSync(generatedFile)).toBeFalsy();
});
