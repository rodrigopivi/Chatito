import * as rasa from '../adapters/rasa';
import * as snips from '../adapters/snips';
import * as web from '../adapters/web';
import * as chatito from '../main';
import { ISentenceTokens, IUtteranceWriter } from '../types';

describe('example with undefined slot', () => {
    const undefinedSlotExample = `
%[example_with_undefined_slot]
    something @[undef#variation]
`;
    test('errors as expected', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(undefinedSlotExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual('Error: Slot not defined: undef#variation');
    });
});

describe('example with undefined aliases and comment', () => {
    const undefinedAliasExample = `
// the undef and undef2 are undefined aliases
%[greet]
    ~[hi] ~[how are you?]

~[hi]
    hi
    hey
`;
    test('works fine', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(undefinedAliasExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(dataset.greet.length).toEqual(4);
    });
});

describe('example with max training defined higher than the maximum posibilities', () => {
    const maxErrorExample = `
%[max_error]('training': '100')
    something
`;
    test('errors as expected', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(maxErrorExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual("Error: Can't generate 100 examples. Max possible examples is 1");
    });
});

describe('example with max training defined as 0', () => {
    const maxErrorExample = `
%[max_error]('training': '0', 'testing': '1')
    something
`;
    test('errors as expected', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(maxErrorExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual("Error: The 'training' argument for max_error must be higher than 0.");
    });
});

describe('example with max testing defined as 0', () => {
    const maxErrorExample = `
%[max_error]('training': '1', 'testing': '0')
    something
`;
    test('errors as expected', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(maxErrorExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual("Error: The 'testing' argument for max_error must be higher than 0.");
    });
});

describe('duplicate definition', () => {
    const maxErrorExample = `
%[max_error]('training': '1', 'testing': '0')
    @[something]
@[something]
    a
@[something]
    b
`;
    test('errors as expected', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(maxErrorExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual("Error: Duplicate definition for SlotDefinition 'something'");
    });
});

describe('missing intent definition', () => {
    const maxErrorExample = `
@[aa]
    a  
@[bb]
    b
`;
    test('errors as expected', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(maxErrorExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual('Error: No actions found');
    });
});

describe('validation errors', () => {
    test('missing ast error', async () => {
        const nullAST = await chatito.datasetFromAST(null, () => null);
        const emptyArrAST = await chatito.datasetFromAST([], () => null);
        expect(nullAST).toEqual(undefined);
        expect(emptyArrAST).toEqual(undefined);
    });
});

describe('example with max training defined smaller than the maximum posibilities', () => {
    const correctMaxExample = `
%[correct_max]('training': '1')
    something
    something else
`;
    test('correctly generates one example', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(correctMaxExample, writer);
        } catch (e) {
            error = e;
        }
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
    deliver from @[delivery_time#time_in_hours] to @[delivery_time#time_in_hours]

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
        'deliver from 3 days to 3 days',
        'deliver from 5 hours to 5 hours',
        'deliver from 3 days to 5 hours',
        'deliver from 5 hours to 3 days'
    ];
    test('correctly generates all possible combinations', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(example1, writer);
        } catch (e) {
            error = e;
        }
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
        try {
            result = await rasa.adapter(example1, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.rasa_nlu_data.common_examples.length).toEqual(example1Sentences.length);
        expect(result.training.rasa_nlu_data.regex_features.length).toEqual(0);
    });
    test('correctly generates using rasa adapter with options', async () => {
        let error = null;
        let result: any;
        const datasetOptions: rasa.IRasaDataset = {
            rasa_nlu_data: {
                common_examples: [],
                entity_synonyms: [],
                regex_features: [
                    {
                        name: 'zipcode',
                        pattern: '[0-9]{5}'
                    }
                ]
            }
        };
        try {
            result = await rasa.adapter(example1, datasetOptions);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.rasa_nlu_data.common_examples.length).toEqual(example1Sentences.length);
        expect(result.training.rasa_nlu_data.regex_features.length).toEqual(1);
    });
    test('correctly generates using snips adapter with no options', async () => {
        let error = null;
        let result: any;
        try {
            result = await snips.adapter(example1, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.intents.example_with_variations.utterances.length).toEqual(example1Sentences.length);
        expect(result.training.language).toEqual('en');
    });
    test('correctly generates using snips adapter with options', async () => {
        let error = null;
        let result: any;
        const datasetOptions: snips.ISnipsDataset = {
            intents: {},
            entities: {},
            language: 'es'
        };
        try {
            result = await snips.adapter(example1, datasetOptions);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.intents.example_with_variations.utterances.length).toEqual(example1Sentences.length);
        expect(result.training.language).toEqual('es');
    });
    test('correctly generates using web adapter', async () => {
        let error = null;
        let result: any;
        try {
            result = await web.adapter(example1, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.example_with_variations.length).toEqual(example1Sentences.length);
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
        '@ [nonalias?] some@email.com @alias~@slot@'
    ];
    test('correctly generates all possible combinations', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(example2, writer);
        } catch (e) {
            error = e;
        }
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
    ~[alias] ~[alias?] ~[alias?]

%[anotherWeirdTest]
    ~[alias?]
    ~[alias?]

~[alias]
    alias
`;
    const example3SentencesFirst = ['alias', 'alias alias', 'alias alias alias'];
    const example3Sentences = ['alias', ''];
    test('correctly generates the max number of non repeated sentences', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(example3, writer);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(dataset.weirdTest).not.toBeNull();
        expect(dataset.weirdTest.length).toEqual(example3SentencesFirst.length);
        for (const x of dataset.weirdTest) {
            const utteranceString = x.reduce((p, n) => p + n.value, '');
            expect(example3SentencesFirst.indexOf(utteranceString)).not.toEqual(-1);
        }
        expect(dataset.anotherWeirdTest).not.toBeNull();
        expect(dataset.anotherWeirdTest.length).toEqual(example3Sentences.length);
        for (const x of dataset.anotherWeirdTest) {
            const utteranceString = x.reduce((p, n) => p + n.value, '');
            expect(example3Sentences.indexOf(utteranceString)).not.toEqual(-1);
        }
    });
});

describe('rasa example with synonyms', () => {
    const synonymsExample = `
%[test]
    @[slot]
@[slot]
    ~[aliases]
    ~[aliases] not synonym
    ~[valid alias]
~[aliases]
    alias
    alias2
    another alias
`;
    test('correctly maps synonyms', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await rasa.adapter(synonymsExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(dataset).not.toBeNull();
        expect(dataset.training).not.toBeUndefined();
        expect(dataset.testing).not.toBeUndefined();
        expect(dataset.training.rasa_nlu_data.entity_synonyms.length).toBe(2);
        expect(dataset.training.rasa_nlu_data.entity_synonyms.find(t => t.value === 'aliases').synonyms.length).toBe(3);
        expect(dataset.training.rasa_nlu_data.entity_synonyms.find(t => t.value === 'valid alias').synonyms.length).toBe(0);
        expect(dataset.training.rasa_nlu_data.common_examples.length).toBe(7);
    });
});

describe('example with synonyms and arguments', () => {
    const synonymsExample = `
%[test]
    @[date]
    @[slot]
@[date]('entity': 'snips/datetime')
    30th of november 9am
@[slot]
    ~[aliases]
    ~[aliases] not synonym
~[aliases]
    alias
    alias2
    another alias
`;
    test('correctly maps synonyms', async () => {
        let error = null;
        const dataset: { [key: string]: ISentenceTokens[][] } = {};
        const writer: IUtteranceWriter = (u, k, n) => {
            if (!dataset[k]) {
                dataset[k] = [];
            }
            dataset[k].push(u);
        };
        try {
            await chatito.datasetFromString(synonymsExample, writer);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(dataset.test).not.toBeUndefined();
        expect(dataset.test.length).toEqual(7);
        expect(dataset.test.filter(u => u.some(t => t.synonym === 'aliases')).length).toEqual(3);
        expect(dataset.test.filter(u => u.some(t => t.args && t.args.entity === 'snips/datetime')).length).toEqual(1);
    });
    test('correctly generates synonyms with rasa adapter', async () => {
        let error = null;
        let result: any;
        try {
            result = await rasa.adapter(synonymsExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.rasa_nlu_data.common_examples.length).toEqual(7);
    });
    test('correctly generates synonyms with snips adapter', async () => {
        let error = null;
        let result: any;
        try {
            result = await snips.adapter(synonymsExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.intents.test.utterances.length).toEqual(7);
        const etts = Object.keys(result.training.entities);
        expect(etts.length).toEqual(2);
        expect(etts.indexOf('snips/datetime')).toBeGreaterThan(-1);
        expect(etts.indexOf('slot')).toBeGreaterThan(-1);
        expect(result.training.entities.slot.data[0].synonyms.length).toEqual(3);
    });
});

describe('example with alias referencing itself', () => {
    const badReferenceExample = `
%[test]
    @[slot]
@[slot]
    ~[aliases]
~[aliases]
    ~[aliases]
`;
    test('correctly throws an error', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await web.adapter(badReferenceExample, null);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual("Error: Invalid nesting of entity: 'aliases' inside entity 'aliases'. Infinite loop prevented.");
    });
});

describe('example with slots nest inside slots', () => {
    const badReferenceExample = `
%[test]
    @[slot]
@[slot]
    ~[aliases]
@[slot2]
    s2
~[aliases]
    @[slot2]
`;
    test('correctly throws an error', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await web.adapter(badReferenceExample, null);
        } catch (e) {
            error = e;
        }
        expect(error.toString())
            .toEqual("Error: Invalid nesting of slot: 'slot2' inside 'aliases'. An slot can't reference other slot.");
    });
});

describe('example with slots nest inside alias', () => {
    const badReferenceExample = `
%[test]
    ~[hi?] ~[sent]
~[sent]
    @[slot]
@[slot]
    some
    slot
`;
    test('correctly works', async () => {
        let error = null;
        let result: any;
        try {
            result = await web.adapter(badReferenceExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        expect(result.training.test.length).toEqual(4);
    });
});