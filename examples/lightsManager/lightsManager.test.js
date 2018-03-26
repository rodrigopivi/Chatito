const fs = require("fs");
const path = require("path");
const generator = require("../../core/datasetGenerator");
const cp = require( "child_process" );

const getExampleFile = filename => path.resolve(__dirname, filename);

test("test dataset generation", () => {
    const fileContent = fs.readFileSync(getExampleFile("lightsManager.chatito"), "utf8");
    const result = generator.datasetFromString(fileContent);
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});

test("test npm command line generator for snips dataset", () => {
    const d = __dirname;
    const generatedFile = path.resolve(`${d}/lightsManager_snips_training_100.json`);
    const npmBin = path.resolve(`${d}/../../bin/chatito.js`);
    const grammarFile = path.resolve(`${d}/lightsManager.chatito`);
    const args = "--format=snips --max=100 --min=100";
    if (fs.existsSync(generatedFile)) { fs.unlinkSync(generatedFile); }
    const child = cp.execSync(`node ${npmBin} ${grammarFile} ${args}`);
    expect(child.toString("utf8")).toMatchSnapshot();
    expect(fs.existsSync(generatedFile)).toBeTruthy();
    fs.unlinkSync(generatedFile);
    expect(fs.existsSync(generatedFile)).toBeFalsy();
});

test("test npm command line generator for rasa dataset", () => {
    const d = __dirname;
    const generatedFile = path.resolve(`${d}/lightsManager_rasa_training_100.json`);
    const npmBin = path.resolve(`${d}/../../bin/chatito.js`);
    const grammarFile = path.resolve(`${d}/lightsManager.chatito`);
    const args = "--format=rasa --max=100 --min=100";
    if (fs.existsSync(generatedFile)) { fs.unlinkSync(generatedFile); }
    const child = cp.execSync(`node ${npmBin} ${grammarFile} ${args}`);
    expect(child.toString("utf8")).toMatchSnapshot();
    expect(fs.existsSync(generatedFile)).toBeTruthy();
    fs.unlinkSync(generatedFile);
    expect(fs.existsSync(generatedFile)).toBeFalsy();
});