const fs = require("fs");
const path = require("path");
const generator = require("../../core/datasetGenerator");
const cp = require( "child_process" );

const getExampleFile = filename => path.resolve(__dirname, filename);

test("test dataset generation", () => {
    const fileContent = fs.readFileSync(getExampleFile("spanishEventsConcierge.chatito"), "utf8");
    const result = generator.datasetFromString(fileContent);
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});

test("test npm command line generator for snips dataset", () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/spanishEventsConcierge_snips_training_15.json`);
    const generatedTestingFile = path.resolve(`${d}/spanishEventsConcierge_snips_testing_1713.json`);
    const snipsOptionsFile = path.resolve(`${d}/snips.json`);
    const npmBin = path.resolve(`${d}/../../bin/chatito.js`);
    const grammarFile = path.resolve(`${d}/spanishEventsConcierge.chatito`);
    const args = `--format=snips --max=15 --min=10 --formatOptions=${snipsOptionsFile}`;
    if (fs.existsSync(generatedTrainingFile)) { fs.unlinkSync(generatedTrainingFile); }
    if (fs.existsSync(generatedTestingFile)) { fs.unlinkSync(generatedTestingFile); }
    const child = cp.execSync(`node ${npmBin} ${grammarFile} ${args}`);
    expect(child.toString("utf8")).toMatchSnapshot();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    fs.unlinkSync(generatedTrainingFile);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});

test("test npm command line generator for rasa dataset", () => {
    const d = __dirname;
    const generatedTrainingFile = path.resolve(`${d}/spanishEventsConcierge_rasa_training_15.json`);
    const generatedTestingFile = path.resolve(`${d}/spanishEventsConcierge_rasa_testing_1713.json`);
    const rasaOptionsFile = path.resolve(`${d}/rasa.json`);
    const npmBin = path.resolve(`${d}/../../bin/chatito.js`);
    const grammarFile = path.resolve(`${d}/spanishEventsConcierge.chatito`);
    const args = `--format=rasa --max=15 --min=10 --formatOptions=${rasaOptionsFile}`;
    if (fs.existsSync(generatedTrainingFile)) { fs.unlinkSync(generatedTrainingFile); }
    if (fs.existsSync(generatedTestingFile)) { fs.unlinkSync(generatedTestingFile); }
    const child = cp.execSync(`node ${npmBin} ${grammarFile} ${args}`);
    expect(child.toString("utf8")).toMatchSnapshot();
    expect(fs.existsSync(generatedTrainingFile)).toBeTruthy();
    expect(fs.existsSync(generatedTestingFile)).toBeTruthy();
    fs.unlinkSync(generatedTrainingFile);
    fs.unlinkSync(generatedTestingFile);
    expect(fs.existsSync(generatedTrainingFile)).toBeFalsy();
    expect(fs.existsSync(generatedTestingFile)).toBeFalsy();
});