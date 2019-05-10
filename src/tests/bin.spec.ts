import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

test('test npm command line generator for large example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/dateBooking_large`);
    const generatedTrainingFile = path.resolve(generatedDir, 'default_dataset_training.json');
    const generatedTestingFile = path.resolve(generatedDir, 'default_dataset_testing.json');
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
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --outputPath=${generatedDir}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const trainingDataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(trainingDataset).not.toBeNull();
    expect(trainingDataset.bookRestaurantsAtDatetime).not.toBeNull();
    expect(trainingDataset.bookRestaurantsAtDatetime.length).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.bookRestaurantsAtDatetime).not.toBeNull();
    expect(testingDataset.bookRestaurantsAtDatetime.length).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for medium example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/citySearch_medium`);
    const generatedTrainingFile = path.resolve(generatedDir, 'default_dataset_training.json');
    const generatedTestingFile = path.resolve(generatedDir, 'default_dataset_testing.json');
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
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --outputPath=${generatedDir}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const trainingDataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(trainingDataset).not.toBeNull();
    expect(trainingDataset.findByCityAndCategory).not.toBeNull();
    expect(trainingDataset.findByCityAndCategory.length).toEqual(1000);
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.findByCityAndCategory).not.toBeNull();
    expect(testingDataset.findByCityAndCategory.length).toEqual(100);
    fs.unlinkSync(generatedTrainingFile);
    fs.unlinkSync(generatedTestingFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for process all directory examples', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/citySearch_medium`);
    const generatedTrainingFile = path.resolve(generatedDir, 'default_dataset_training.json');
    const generatedTestingFile = path.resolve(generatedDir, 'default_dataset_testing.json');
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFiles = path.resolve(`${d}/../../examples/`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    if (fs.existsSync(generatedDir)) {
        fs.rmdirSync(generatedDir);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFiles} --outputPath=${generatedDir}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const trainingDataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(trainingDataset).not.toBeNull();
    expect(trainingDataset.findByCityAndCategory).not.toBeNull();
    expect(trainingDataset.findByCityAndCategory.length).toEqual(1000);
    expect(trainingDataset.bookRestaurantsAtDatetime).not.toBeNull();
    expect(trainingDataset.bookRestaurantsAtDatetime.length).toEqual(1000);
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.findByCityAndCategory).not.toBeNull();
    expect(testingDataset.findByCityAndCategory.length).toEqual(100);
    expect(testingDataset.bookRestaurantsAtDatetime).not.toBeNull();
    expect(testingDataset.bookRestaurantsAtDatetime.length).toEqual(100);
    fs.unlinkSync(generatedTrainingFile);
    fs.unlinkSync(generatedTestingFile);
    fs.rmdirSync(generatedDir);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
    expect(fs.existsSync(generatedDir)).toBeFalsy();
});

test('test npm command line generator for rasa medium example', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/rasa_dataset_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/rasa_dataset_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=rasa --outputPath=${d}/../../examples`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.rasa_nlu_data).not.toBeNull();
    expect(dataset.rasa_nlu_data.entity_synonyms).not.toBeNull();
    expect(dataset.rasa_nlu_data.entity_synonyms.length).toEqual(3);
    expect(dataset.rasa_nlu_data.common_examples).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples.length).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.rasa_nlu_data).not.toBeNull();
    expect(testingDataset.rasa_nlu_data.common_examples).not.toBeNull();
    expect(testingDataset.rasa_nlu_data.common_examples.length).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test('test npm command line generator for rasa directory examples', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/rasa_dataset_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/rasa_dataset_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=rasa --outputPath=${d}/../../examples`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.rasa_nlu_data).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples).not.toBeNull();
    expect(dataset.rasa_nlu_data.common_examples.length).toEqual(2030);
    expect(dataset.rasa_nlu_data.entity_synonyms).not.toBeNull();
    expect(dataset.rasa_nlu_data.entity_synonyms.length).toEqual(3);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.rasa_nlu_data).not.toBeNull();
    expect(testingDataset.rasa_nlu_data.common_examples).not.toBeNull();
    expect(testingDataset.rasa_nlu_data.common_examples.length).toEqual(200);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test('test npm command line generator for snips medium example', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/snips_dataset_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/snips_dataset_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=snips --outputPath=${d}/../../examples`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.entities).not.toBeNull();
    expect(dataset.entities.location).not.toBeNull();
    expect(dataset.entities.location.data).not.toBeNull();
    expect(dataset.entities.location.data.length).toEqual(3);
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

test('test npm command line generator for snips all examples', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/snips_dataset_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/snips_dataset_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=snips --outputPath=${d}/../../examples`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.entities).not.toBeNull();
    expect(dataset.entities.location).not.toBeNull();
    expect(dataset.entities.location.data).not.toBeNull();
    expect(dataset.entities.location.data.length).toEqual(3);
    expect(dataset.intents).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory.utterances).not.toBeNull();
    expect(dataset.intents.findByCityAndCategory.utterances.length).toEqual(1000);
    expect(dataset.intents.bookRestaurantsAtDatetime).not.toBeNull();
    expect(dataset.intents.bookRestaurantsAtDatetime.utterances).not.toBeNull();
    expect(dataset.intents.bookRestaurantsAtDatetime.utterances.length).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.findByCityAndCategory).not.toBeNull();
    expect(testingDataset.findByCityAndCategory.length).toEqual(100);
    expect(testingDataset.bookRestaurantsAtDatetime).not.toBeNull();
    expect(testingDataset.bookRestaurantsAtDatetime.length).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test('test npm command line generator for luis medium example', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/luis_dataset_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/luis_dataset_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/citySearch_medium.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=luis --outputPath=${d}/../../examples`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.data).not.toBeNull();
    expect(dataset.data.length).toEqual(1000);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.data).not.toBeNull();
    expect(testingDataset.data.length).toEqual(100);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test('test npm command line generator for luis directory examples', () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/../../examples/luis_dataset_training.json`);
    const generatedTestingFile = path.resolve(`${d}/../../examples/luis_dataset_testing.json`);
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedTestingFile)) {
        fs.unlinkSync(generatedTestingFile);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --format=luis --outputPath=${d}/../../examples`);
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const dataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(dataset).not.toBeNull();
    expect(dataset.data).not.toBeNull();
    expect(dataset.data.length).toEqual(2030);
    fs.unlinkSync(generatedTrainingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    const testingDataset = JSON.parse(fs.readFileSync(generatedTestingFile, 'utf8'));
    expect(testingDataset).not.toBeNull();
    expect(testingDataset.data).not.toBeNull();
    expect(testingDataset.data.length).toEqual(200);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test('test npm command line generator for imports example', () => {
    const d = __dirname;
    const generatedDir = path.resolve(`${d}/../../examples/importing/main`);
    const generatedTrainingFile = path.resolve(generatedDir, 'default_dataset_training.json');
    const npmBin = path.resolve(`${d}/../bin.ts`);
    const grammarFile = path.resolve(`${d}/../../examples/importing/main.chatito`);
    if (fs.existsSync(generatedTrainingFile)) {
        fs.unlinkSync(generatedTrainingFile);
    }
    if (fs.existsSync(generatedDir)) {
        fs.rmdirSync(generatedDir);
    }
    const child = cp.execSync(`node -r ts-node/register ${npmBin} ${grammarFile} --outputPath=${generatedDir}`);
    expect(fs.existsSync(generatedDir)).toBeTruthy();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    const trainingDataset = JSON.parse(fs.readFileSync(generatedTrainingFile, 'utf8'));
    expect(trainingDataset).not.toBeNull();
    expect(trainingDataset.greet).not.toBeNull();
    expect(trainingDataset.greet.length).toEqual(30);
    fs.unlinkSync(generatedTrainingFile);
    fs.rmdirSync(generatedDir);
});
