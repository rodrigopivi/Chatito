const fs = require("fs");
const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const generator = require("../core/datasetGenerator");

const workingDirectory = process.cwd();
const getExampleFilePath = filename => path.resolve(workingDirectory, filename);

console.log(argv);

let configFile = null;
if (!argv._ || !argv._.length) {
    console.error("ERROR: Invalid chatito file.");
    process.exit(1);
}
configFile = argv._[0];

try {
    const dslFilePath = getExampleFilePath(configFile);
    const dataset = generator.datasetFromFile(dslFilePath);
    const splittedPath = path.basename(dslFilePath).split(".");
    let jsonFileName;
    if (splittedPath.length) {
        jsonFileName = [].concat(splittedPath.splice(0, splittedPath.length - 1)).concat([".json"]).join("");
    } else {
        jsonFileName = [].concat(splittedPath).join("");
    }
    const jsonFilePath = path.resolve(path.dirname(dslFilePath), jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(dataset, null, 4));
} catch (e) {
    console.error("ERROR", e.message);
    process.exit(1);
}