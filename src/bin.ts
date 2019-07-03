#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as flair from './adapters/flair';
import * as luis from './adapters/luis';
import * as rasa from './adapters/rasa';
import * as snips from './adapters/snips';
import * as web from './adapters/web';
import { config, VALID_DISTRIBUTIONS } from './main';
import * as utils from './utils';

// tslint:disable-next-line:no-var-requires
const argv = require('minimist')(process.argv.slice(2));

const logger = console;
const adapters = { default: web, rasa, snips, luis, flair };
const workingDirectory = process.cwd();
const getFileWithPath = (filename: string) => path.resolve(workingDirectory, filename);

const chatitoFilesFromDir = async (startPath: string, cb: (filename: string) => Promise<void>) => {
    if (!fs.existsSync(startPath)) {
        logger.error(`Invalid directory: ${startPath}`);
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

const importer = (fromPath: string, importFile: string) => {
    const filePath = path.resolve(path.dirname(fromPath), importFile);
    if (path.extname(filePath) !== '.chatito') {
        throw new Error('Only files with .chatito extension can be imported');
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Can't import ${filePath}`);
    }
    const dsl = fs.readFileSync(filePath, 'utf8');
    return { filePath, dsl };
};

const streamedAdapterAccumulator = (format: 'flair', outputPath: string) => {
    const adapterHandler = adapters[format];
    if (!adapterHandler) {
        throw new Error(`Invalid adapter: ${format}`);
    }
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    const trainingFileName = argv.trainingFileName || `${format}_dataset_training.txt`;
    const testingFileName = argv.testingFileName || `${format}_dataset_testing.txt`;
    const trainingClassificationFilePath = path.resolve(outputPath, `classification_${trainingFileName}`);
    const testingClassificationFilePath = path.resolve(outputPath, `classification_${testingFileName}`);
    const trainingNerFilePath = path.resolve(outputPath, `ner_${trainingFileName}`);
    const testingNerFilePath = path.resolve(outputPath, `ner_${testingFileName}`);
    // write streams
    const trainClassification = fs.createWriteStream(trainingClassificationFilePath, { flags: 'a' });
    const testClassification = fs.createWriteStream(testingClassificationFilePath, { flags: 'a' });
    const trainNER = fs.createWriteStream(trainingNerFilePath, { flags: 'a' });
    const testNER = fs.createWriteStream(testingNerFilePath, { flags: 'a' });
    trainClassification.on('close', () => logger.log('Train classification dataset done!'));
    testClassification.on('close', () => logger.log('Test classification dataset done!'));
    trainNER.on('close', () => logger.log('Test NER dataset done!'));
    testNER.on('close', () => logger.log('Test NER dataset done!'));
    return {
        write: async (fullFilenamePath: string) => {
            logger.log(`Processing file: ${fullFilenamePath}`);
            const dsl = fs.readFileSync(fullFilenamePath, 'utf8');
            const streams = { trainClassification, testClassification, trainNER, testNER };
            await adapterHandler.streamAdapter(dsl, streams, importer, fullFilenamePath);
        },
        save: () => {
            trainClassification.close();
            testClassification.close();
            trainNER.close();
            testNER.close();
            logger.log(`Saved training dataset: ${trainingClassificationFilePath}`);
            logger.log(`Saved testing dataset: ${testingClassificationFilePath}`);
            logger.log(`Saved training dataset: ${trainingNerFilePath}`);
            logger.log(`Saved testing dataset: ${testingNerFilePath}`);
        }
    };
};

type IValidFormat = 'default' | 'rasa' | 'snips' | 'luis' | 'flair';
const adapterAccumulator = (format: IValidFormat, outputPath: string, formatOptions?: any) => {
    const trainingDataset: snips.ISnipsDataset | rasa.IRasaDataset | luis.ILuisDataset | {} = {};
    const testingDataset: any = {};
    if (format === 'flair') {
        return streamedAdapterAccumulator('flair', outputPath);
    }
    const trainingJsonFileName = argv.trainingFileName || `${format}_dataset_training.json`;
    const trainingJsonFilePath = path.resolve(outputPath, trainingJsonFileName);
    const testingFileName = argv.testingFileName || `${format}_dataset_testing.json`;
    const testingJsonFilePath = path.resolve(outputPath, testingFileName);
    const adapterHandler = adapters[format];
    if (!adapterHandler) {
        throw new Error(`Invalid adapter: ${format}`);
    }
    return {
        write: async (fullFilenamePath: string) => {
            logger.log(`Processing file: ${fullFilenamePath}`);
            const dsl = fs.readFileSync(fullFilenamePath, 'utf8');
            const { training, testing } = await adapterHandler.adapter(dsl, formatOptions, importer, fullFilenamePath);
            utils.mergeDeep(trainingDataset, training);
            utils.mergeDeep(testingDataset, testing);
        },
        save: () => {
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath);
            }
            fs.writeFileSync(trainingJsonFilePath, JSON.stringify(trainingDataset));
            logger.log(`Saved training dataset: ${trainingJsonFilePath}`);

            if (Object.keys(testingDataset).length) {
                fs.writeFileSync(testingJsonFilePath, JSON.stringify(testingDataset));
                logger.log(`Saved testing dataset: ${testingJsonFilePath}`);
            }
        }
    };
};

(async () => {
    if (!argv._ || !argv._.length) {
        logger.error('Invalid chatito file.');
        process.exit(1);
    }
    const dslFile = argv._[0];
    const format = (argv.format || 'default').toLowerCase();
    if (['default', 'rasa', 'snips', 'luis', 'flair'].indexOf(format) === -1) {
        logger.error(`Invalid format argument: ${format}`);
        process.exit(1);
    }
    const outputPath = argv.outputPath || process.cwd();
    if (argv.defaultDistribution && VALID_DISTRIBUTIONS.indexOf(argv.defaultDistribution) !== -1) {
        config.defaultDistribution = argv.defaultDistribution;
    }
    logger.log(`NOTE: Using ${config.defaultDistribution} as default frequency distribution.`);
    try {
        // parse the formatOptions argument
        let formatOptions = null;
        if (argv.formatOptions) {
            formatOptions = JSON.parse(fs.readFileSync(path.resolve(argv.formatOptions), 'utf8'));
        }
        const dslFilePath = getFileWithPath(dslFile);
        const isDirectory = fs.existsSync(dslFilePath) && fs.lstatSync(dslFilePath).isDirectory();
        const accumulator = adapterAccumulator(format, outputPath, formatOptions);
        if (isDirectory) {
            await chatitoFilesFromDir(dslFilePath, accumulator.write);
        } else {
            await accumulator.write(dslFilePath);
        }
        accumulator.save();
    } catch (e) {
        if (e && e.message && e.location) {
            logger.log('==== CHATITO SYNTAX ERROR ====');
            logger.log('    ', e.message);
            logger.log(`     Line: ${e.location.start.line}, Column: ${e.location.start.column}`);
            logger.log('==============================');
        } else {
            logger.error(e && e.stack ? e.stack : e);
        }
        logger.log('FULL ERROR REPORT:');
        logger.error(e);
        process.exit(1);
    }
})();
