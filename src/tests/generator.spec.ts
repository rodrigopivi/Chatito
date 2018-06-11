import * as rasa from '../adapters/rasa';
import * as snips from '../adapters/snips';
import * as web from '../adapters/web';
import * as chatito from '../main';
import { IChatitoEntityAST, ISentenceTokens, IUtteranceWriter } from '../types';

describe('example with undefined slot', () => {
const undefinedSlotExample = `
%[example_with_undefined_slot]
    something @[undef]
`;
test('errors as expected', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(undefinedSlotExample, writer); } catch (e) { error = e; }
    expect(error.toString()).toEqual('Error: Slot not defined: undef');
});
});

describe('example with undefined alias', () => {
const undefinedAliasExample = `
%[example_with_undefined_alias]
    something ~[undef]
`;
test('errors as expected', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(undefinedAliasExample, writer); } catch (e) { error = e; }
    expect(error.toString()).toEqual('Error: Alias not defined: undef');
});
});

describe('example with max defined bigger than the maximum posibilities', () => {
const maxErrorExample = `
%[max_error](100)
    something
`;
test('errors as expected', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(maxErrorExample, writer); } catch (e) { error = e; }
    expect(error.toString()).toEqual('Error: Can\'t generate 100 examples. Max possible examples is 1');
});
});

describe('example with max defined smaller than the maximum posibilities', () => {
const correctMaxExample = `
%[correct_max](1)
    something
    something else
`;
test('correctly generates one example', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(correctMaxExample, writer); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(dataset.correct_max).not.toBeNull();
    expect(dataset.correct_max.length).toEqual(1);
});
});

describe('example with slot variations', () => {
const example1 = `
%[example_with_variations]
    ~[please?] ~[my parcel should be delivered?] in @[delivery_time#time_in_hours]
    ~[please?] ~[my parcel should be delivered] @[delivery_time#relative_time]
    ~[please?] deliver @[delivery_time#relative_time?]

@[delivery_time#time_in_hours]
    3 days
    5 hours

@[delivery_time#relative_time]
    as ~[fast] as possible
    very ~[fast]

~[my parcel should be delivered]
    my parcel should be delivered

~[please]
    please

~[fast]
    quickly
    fast
`;

const example1Sentences = [
    'please my parcel should be delivered very fast',
    'please in 5 hours',
    'deliver as fast as possible',
    'please deliver',
    'my parcel should be delivered in 3 days',
    'my parcel should be delivered as fast as possible',
    'deliver very quickly',
    'in 3 days',
    'my parcel should be delivered as quickly as possible',
    'please deliver as quickly as possible',
    'please my parcel should be delivered in 5 hours',
    'please my parcel should be delivered very quickly',
    'deliver very fast',
    'please deliver very quickly',
    'deliver as quickly as possible',
    'please my parcel should be delivered in 3 days',
    'please my parcel should be delivered as quickly as possible',
    'my parcel should be delivered very fast',
    'in 5 hours',
    'please deliver as fast as possible',
    'my parcel should be delivered very quickly',
    'deliver',
    'please my parcel should be delivered as fast as possible',
    'please deliver very fast',
    'please in 3 days',
    'my parcel should be delivered in 5 hours',
];
test('correctly generates all possible combinations', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(example1, writer); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(dataset.example_with_variations).not.toBeNull();
    expect(dataset.example_with_variations.length).toEqual(example1Sentences.length);
    for (const x of dataset.example_with_variations) {
        const utteranceString = x.reduce((p, n) => p + n.value, '');
        expect(example1Sentences.indexOf(utteranceString)).not.toEqual(-1);
    }
});
test('correctly generates using rasa adapter with no options', async () => {
    let error = null;
    let result: any;
    try { result = await rasa.adapter(example1, null); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result.rasa_nlu_data.common_examples.length).toEqual(example1Sentences.length);
    expect(result.rasa_nlu_data.regex_features.length).toEqual(0);
});
test('correctly generates using rasa adapter with options', async () => {
    let error = null;
    let result: any;
    const datasetOptions: rasa.IRasaDataset = {
        rasa_nlu_data: {
            common_examples: [],
            entity_synonyms: [],
            regex_features : [{
                name: 'zipcode',
                pattern: '[0-9]{5}',
            }],
        },
    };
    try { result = await rasa.adapter(example1, datasetOptions); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result.rasa_nlu_data.common_examples.length).toEqual(example1Sentences.length);
    expect(result.rasa_nlu_data.regex_features.length).toEqual(1);
});
test('correctly generates using snips adapter with no options', async () => {
    let error = null;
    let result: any;
    try { result = await snips.adapter(example1, null); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result.intents.example_with_variations.utterances.length).toEqual(example1Sentences.length);
    expect(result.language).toEqual('en');
});
test('correctly generates using snips adapter with options', async () => {
    let error = null;
    let result: any;
    const datasetOptions: snips.ISnipsDataset = { intents: {}, entities: {}, language: 'es' };
    try { result = await snips.adapter(example1, datasetOptions); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result.intents.example_with_variations.utterances.length).toEqual(example1Sentences.length);
    expect(result.language).toEqual('es');
});
test('correctly generates using web adapter', async () => {
    let error = null;
    let result: any;
    try { result = await web.adapter(example1, null); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result.example_with_variations.length).toEqual(example1Sentences.length);
});
});

describe('example with custom spaces and symbols with aliases and slots', () => {
const example2 = `
%[weirdTests]
    [nonalias?] some@email.com ~ [some@email]
    @ [nonalias?] some@email.com ~ [some@email]
    @ [nonalias?] some@email.com @~[alias?]~@[slot?]

@[slot]
    @slot@~[alias?]

~[alias]
    alias
`;
const example2Sentences = [
    '@ [nonalias?] some@email.com @alias~',
    '@ [nonalias?] some@email.com ~ [some@email]',
    '[nonalias?] some@email.com ~ [some@email]',
    '@ [nonalias?] some@email.com @~@slot@',
    '@ [nonalias?] some@email.com @~@slot@alias',
    '@ [nonalias?] some@email.com @alias~@slot@alias',
    '@ [nonalias?] some@email.com @~',
    '@ [nonalias?] some@email.com @alias~@slot@',
];
test('correctly generates all possible combinations', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(example2, writer); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(dataset.weirdTests).not.toBeNull();
    expect(dataset.weirdTests.length).toEqual(example2Sentences.length);
    for (const x of dataset.weirdTests) {
        const utteranceString = x.reduce((p, n) => p + n.value, '');
        expect(example2Sentences.indexOf(utteranceString)).not.toEqual(-1);
    }
});
});

describe('example with duplicate sentences', () => {
const example3 = `
%[weirdTest]
    ~[alias?]
    ~[alias?]

%[anotherWeirdTest]
    ~[alias?]
    ~[alias?]

~[alias]
    alias
`;
const example3Sentences = ['alias', ''];
test('correctly generates the max number of non repeated sentences', async () => {
    let error = null;
    const dataset: { [key: string]: ISentenceTokens[][] } = {};
    const writer: IUtteranceWriter = (u, k, n) => {
        if (!dataset[k]) { dataset[k] = []; }
        dataset[k].push(u);
    };
    try { await chatito.datasetFromString(example3, writer); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(dataset.weirdTest).not.toBeNull();
    expect(dataset.weirdTest.length).toEqual(example3Sentences.length);
    for (const x of dataset.weirdTest) {
        const utteranceString = x.reduce((p, n) => p + n.value, '');
        expect(example3Sentences.indexOf(utteranceString)).not.toEqual(-1);
    }
    expect(dataset.anotherWeirdTest).not.toBeNull();
    expect(dataset.anotherWeirdTest.length).toEqual(example3Sentences.length);
    for (const x of dataset.anotherWeirdTest) {
        const utteranceString = x.reduce((p, n) => p + n.value, '');
        expect(example3Sentences.indexOf(utteranceString)).not.toEqual(-1);
    }
});
});
