#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const gen = require("../core/datasetGenerator");

const workingDirectory = process.cwd();
const getExampleFilePath = filename => path.resolve(workingDirectory, filename);

// parse config filename argument
let configFile = null;
if (!argv._ || !argv._.length) {
    console.error("Invalid chatito file.");
    process.exit(1);
}
configFile = argv._[0];

let postProcessor = null;
if (!argv.format || ["rasa", "snips"].indexOf(argv.format.toLowerCase()) == -1) {
    console.error("Invalid format argument, can only be rasa or snips. e.g: npx chatito file.chatito --format=snips");
    process.exit(1);
}
postProcessor = argv.format.toLowerCase() == "rasa" ? gen.rasaGenerator.postProcessor : gen.snipsGenerator.postProcessor;

let max = null;
if (argv.max !== undefined) {
    max = parseInt(argv.max, 10);
}

let min = null;
if (argv.min !== undefined) {
    min = parseInt(argv.min, 10);
}

try {
    // parse the formatOptions argument
    let formatOptions = null;
    if (argv.formatOptions) { formatOptions = JSON.parse(fs.readFileSync(path.resolve(argv.formatOptions), "utf8")); }
    const dslFilePath = getExampleFilePath(configFile);
    const file = fs.readFileSync(dslFilePath, "utf8");
    const fullDataset = gen.datasetFromString(file, argv.format, formatOptions);
    const { dataset, testingExamples, stats } = postProcessor(fullDataset, max, min);
    const splittedPath = path.posix.basename(dslFilePath).split(".");
    if (!splittedPath.length || "chatito" !== splittedPath[splittedPath.length - 1].toLowerCase() ) {
        throw new Error("Invalid filename extension.");
    }
    const format = argv.format.toLowerCase();
    const trainingJsonFileName = splittedPath.slice(0, splittedPath.length - 1).concat([`_${format}_training_${stats.training}.json`]).join("");
    const trainingJsonFilePath = path.resolve(path.dirname(dslFilePath), trainingJsonFileName);
    fs.writeFileSync(trainingJsonFilePath, JSON.stringify(dataset, null, 4));
    console.log(trainingJsonFilePath);
    if (stats.testing) {
        const testingJsonFileName = splittedPath.slice(0, splittedPath.length - 1).concat([`_${format}_testing_${stats.testing}.json`]).join("");
        const testingJsonFilePath = path.resolve(path.dirname(dslFilePath), testingJsonFileName);
        fs.writeFileSync(testingJsonFilePath, JSON.stringify(testingExamples, null, 4));
        console.log(testingJsonFilePath);
    }
    console.log(stats);
} catch (e) {
    if (e && e.message && e.location) {
        console.log("==== CHATITO SYNTAX ERROR ====");
        console.log("    ", e.message);
        console.log(`     Line: ${e.location.start.line}, Column: ${e.location.start.column}`);
        console.log("==============================");
    }
    console.log("FULL ERROR REPORT:");
    console.error(e);
    process.exit(1);
}