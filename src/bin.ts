#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as rasa from './adapters/rasa';
import * as snips from './adapters/snips';
import * as web from './adapters/web';
import * as utils from './utils';

// tslint:disable-next-line:no-var-requires
const argv = require('minimist')(process.argv.slice(2));

const adapters = { default: web, rasa, snips };

const workingDirectory = process.cwd();
const getFileWithPath = (filename: string) => path.resolve(workingDirectory, filename);

const chatitoFilesFromDir = async (startPath: string, cb: (filename: string) => Promise<void>) => {
    if (!fs.existsSync(startPath)) {
        // tslint:disable-next-line:no-console
        console.error(`Invalid directory: ${startPath}`);
        process.exit(1);
    }
    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            await chatitoFilesFromDir(filename, cb);
        } else if (/\.chatito$/.test(filename)) {
            await cb(filename);
        }
    }
};

const adapterAccumulator = (format: 'default' | 'rasa' | 'snips', formatOptions?: any) => {
    const trainingDataset: snips.ISnipsDataset | rasa.IRasaDataset | {} = {};
    const testingDataset: any = {};
    const adapterHandler = adapters[format];
    if (!adapterHandler) {
        throw new Error(`Invalid adapter: ${format}`);
    }
    return {
        write: async (fullFilenamePath: string) => {
            // tslint:disable-next-line:no-console
            console.log(`Processing file: ${fullFilenamePath}`);
            const dsl = fs.readFileSync(fullFilenamePath, 'utf8');
            const { training, testing } = await adapterHandler.adapter(dsl, formatOptions);
            utils.mergeDeep(trainingDataset, training);
            utils.mergeDeep(testingDataset, testing);
        },
        save: (outputPath: string) => {
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath);
            }
            const trainingJsonFilePath = path.resolve(outputPath, `${format}_dataset_training.json`);
            fs.writeFileSync(trainingJsonFilePath, JSON.stringify(trainingDataset));
            // tslint:disable-next-line:no-console
            console.log(`Saved training dataset: ./${format}_dataset_training.json`);
            if (Object.keys(testingDataset).length) {
                const testingJsonFilePath = path.resolve(outputPath, `${format}_dataset_testing.json`);
                fs.writeFileSync(testingJsonFilePath, JSON.stringify(testingDataset));
                // tslint:disable-next-line:no-console
                console.log(`Saved testing dataset: ./${format}_dataset_training.json`);
            }
        }
    };
};

(async () => {
    if (!argv._ || !argv._.length) {
        // tslint:disable-next-line:no-console
        console.error('Invalid chatito file.');
        process.exit(1);
    }
    const configFile = argv._[0];
    const format = (argv.format || 'default').toLowerCase();
    if (['default', 'rasa', 'snips'].indexOf(format) === -1) {
        // tslint:disable-next-line:no-console
        console.error(`Invalid format argument: ${format}`);
        process.exit(1);
    }
    const outputPath = argv.outputPath || process.cwd();
    try {
        // parse the formatOptions argument
        let formatOptions = null;
        if (argv.formatOptions) {
            formatOptions = JSON.parse(fs.readFileSync(path.resolve(argv.formatOptions), 'utf8'));
        }
        const dslFilePath = getFileWithPath(configFile);
        const isDirectory = fs.existsSync(dslFilePath) && fs.lstatSync(dslFilePath).isDirectory();
        const accumulator = adapterAccumulator(format, formatOptions);
        if (isDirectory) {
            await chatitoFilesFromDir(dslFilePath, accumulator.write);
        } else {
            await accumulator.write(dslFilePath);
        }
        accumulator.save(outputPath);
    } catch (e) {
        // tslint:disable:no-console
        if (e && e.message && e.location) {
            console.log('==== CHATITO SYNTAX ERROR ====');
            console.log('    ', e.message);
            console.log(`     Line: ${e.location.start.line}, Column: ${e.location.start.column}`);
            console.log('==============================');
        } else {
            console.error(e && e.stack ? e.stack : e);
        }
        console.log('FULL ERROR REPORT:');
        console.error(e);
        // tslint:enable:no-console
        process.exit(1);
    }
})();
