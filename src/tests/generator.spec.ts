import * as flair from '../adapters/flair';
import * as luis from '../adapters/luis';
import * as rasa from '../adapters/rasa';
import * as snips from '../adapters/snips';
import * as web from '../adapters/web';
import * as chatito from '../main';
import { IChatitoCache, ISentenceTokens, IUtteranceWriter } from '../types';

type ThenArg<T> = T extends Promise<infer U> ? U : T;

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
%[max]('training': '100')
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
        expect(error).toBeNull();
        expect(dataset.max.length).toEqual(1);
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
    test('just returns', async () => {
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
        expect(error).toBe(null);
        expect(dataset).toEqual({});
    });
});

describe('validation errors', () => {
    test('missing ast error', async () => {
        const ch: any = chatito.datasetFromAST;
        const nullAST = await ch(null, () => null);
        const emptyArrAST = await ch([], () => null);
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
    test('correctly generates using luis adapter', async () => {
        let error = null;
        let result: ThenArg<ReturnType<typeof luis.adapter>> | null = null;
        try {
            result = await luis.adapter(example1, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(result).not.toBeNull();
        expect(result!.training).not.toBeNull();
        expect(result!.testing).not.toBeNull();
        expect(result!.training!.data!.length).toEqual(example1Sentences.length);
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
    ~[alias]
    ~[alias]

~[alias]
    alias
`;
    const example3SentencesFirst = ['alias', 'alias alias', 'alias alias alias'];
    const example3Sentences = ['alias'];
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
    ~[not valid alias]
~[aliases]('synonym': 'true')
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
        expect(dataset.training.rasa_nlu_data.entity_synonyms.length).toBe(1);
        expect(dataset.training.rasa_nlu_data.entity_synonyms.find((t: any) => t.value === 'aliases').synonyms.length).toBe(3);
        expect(dataset.training.rasa_nlu_data.entity_synonyms.find((t: any) => t.value === 'not valid alias')).toBeUndefined();
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
~[aliases]('synonym': 'true')
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
        expect(dataset.test.filter(u => u.some(t => !!(t.args && t.args.entity === 'snips/datetime'))).length).toEqual(1);
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
        expect(error.toString()).toEqual("Error: Invalid nesting of slot: 'slot2' inside 'aliases'. An slot can't reference other slot.");
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

describe('example with text similar to probability operator works as regular sentence text', () => {
    const example = `
%[greet]
    *[treat as text] ~[phrase1]
    *[20] ~[phrase2] ~[phrase2?]
`;
    test('correctly works', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await web.adapter(example, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
    });
});

describe('example with wrong probability number', () => {
    const badExample = `
%[greet]
    *[110%] ~[phrase1]
    *[20%] ~[phrase2] ~[phrase2?]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await web.adapter(badExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
        expect(error.toString()).toEqual('Error: Probability "110%" must be greater than 0 up to 100. At IntentDefinition-greet');
    });
});

describe('example with wrong probability definition', () => {
    const badExample = `
%[greet]
    *[0] ~[phrase1]
    *[0] ~[phrase2] ~[phrase2?]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await web.adapter(badExample, null);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual('Error: Probability weight "0" must be greater than 0. At IntentDefinition-greet');
    });
});

describe('example with more than 100% probability', () => {
    const badExample = `
%[greet]
    *[60%] ~[phrase1]
    *[70%] ~[phrase2] ~[phrase2?]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: any;
        try {
            dataset = await web.adapter(badExample, null);
        } catch (e) {
            error = e;
        }
        expect(error.toString()).toEqual(
            "Error: The sum of sentence probabilities (130) for an entity can't be higher than 100%. At IntentDefinition-greet"
        );
    });
});

describe('example wih sentences defining percentual probabilities', () => {
    // NOTE: heree phrase1, can only generate 5 utterances
    const probsExample = `
%[greet]('training': '10', 'testing': '10')
    *[60%] ~[phrase1]
    *[20%] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

~[phrase1]
    p1-1
    p1-2
    p1-3
    p1-4
    p1-5

~[phrase2]
    p2-1
    p2-2
    p2-3
    p2-4
    p2-5

~[phrase3]
    p3-1
    p3-2
    p3-3
    p3-4
    p3-5

~[phrase4]
    p4-1
    p4-2
    p4-3
    p4-4
    p4-5
`;
    test('correctly works', async () => {
        let error = null;
        let r: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            r = await web.adapter(probsExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(r).not.toBeNull();
        const result = r!;
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        const all = [...result.training.greet, ...result.testing.greet];
        let sentence1Count = 0;
        let sentence2Count = 0;
        let sentence3Count = 0;
        let sentence4Count = 0;
        all.forEach(u => {
            const t = u[0];
            if (t.value.startsWith('p1-')) {
                sentence1Count++;
            } else if (t.value.startsWith('p2-')) {
                sentence2Count++;
            } else if (t.value.startsWith('p3-')) {
                sentence3Count++;
            } else if (t.value.startsWith('p4-')) {
                sentence4Count++;
            }
        });
        expect(sentence1Count).toBeGreaterThanOrEqual(4);
        expect(sentence2Count).toBeGreaterThan(2);
        expect(sentence3Count).toBeLessThan(6);
        expect(sentence4Count).toBeGreaterThanOrEqual(1);
    });
});

describe('example wih sentences defining weighted probabilities', () => {
    // NOTE: heree phrase1, can only generate 5 utterances
    const probsExample = `
%[greet]('training': '50', 'testing': '50')
    *[60] ~[phrase1] sentence final weight 300 (5*60) or 13.88888888888889%
    *[20] ~[phrase2] ~[phrase2?] sentence final weight 600  (5*6*20) or 27.77777777777778%
    ~[phrase3] ~[phrase3?] ~[phrase3?] sentence final weight 180 (5*6*6) pr 8.333333333333334%
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?] sentence final weight 1080 (5*6*6*6) or 50%

~[phrase1]
    p1-1
    p1-2
    p1-3
    p1-4
    p1-5

~[phrase2]
    p2-1
    p2-2
    p2-3
    p2-4
    p2-5

~[phrase3]
    p3-1
    p3-2
    p3-3
    p3-4
    p3-5

~[phrase4]
    p4-1
    p4-2
    p4-3
    p4-4
    p4-5
`;
    test('correctly works', async () => {
        let error = null;
        let r: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            r = await web.adapter(probsExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(r).not.toBeNull();
        const result = r!;
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        const all = [...result.training.greet, ...result.testing.greet];
        let sentence1Count = 0;
        let sentence2Count = 0;
        let sentence3Count = 0;
        let sentence4Count = 0;
        all.forEach(u => {
            const t = u[0];
            if (t.value.startsWith('p1-')) {
                sentence1Count++;
            } else if (t.value.startsWith('p2-')) {
                sentence2Count++;
            } else if (t.value.startsWith('p3-')) {
                sentence3Count++;
            } else if (t.value.startsWith('p4-')) {
                sentence4Count++;
            }
        });
        expect(sentence1Count).toBeGreaterThanOrEqual(4);
        expect(sentence2Count).toBeGreaterThanOrEqual(15);
        expect(sentence3Count).toBeGreaterThanOrEqual(2);
        expect(sentence4Count).toBeGreaterThanOrEqual(30);
    });
});

describe('example wih sentences defining probabilities nested', () => {
    // NOTE: heree phrase1, can only generate 5 utterances
    const probsExample = `
%[greet]('training': '10', 'testing': '10')
    ~[p1]

~[p1]
    *[60%] ~[phrase1]
    *[20%] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

~[phrase1]
    p1-1
    p1-2
    p1-3
    p1-4
    p1-5

~[phrase2]
    p2-1
    p2-2
    p2-3
    p2-4
    p2-5

~[phrase3]
    p3-1
    p3-2
    p3-3
    p3-4
    p3-5

~[phrase4]
    p4-1
    p4-2
    p4-3
    p4-4
    p4-5
`;
    test('correctly works', async () => {
        let error = null;
        let r: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            r = await web.adapter(probsExample, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(r).not.toBeNull();
        const result = r!;
        expect(result.training).not.toBeNull();
        expect(result.testing).not.toBeNull();
        const all = [...result.training.greet, ...result.testing.greet];
        let sentence1Count = 0;
        let sentence2Count = 0;
        let sentence3Count = 0;
        let sentence4Count = 0;
        all.forEach(u => {
            const t = u[0];
            if (t.value.startsWith('p1-')) {
                sentence1Count++;
            } else if (t.value.startsWith('p2-')) {
                sentence2Count++;
            } else if (t.value.startsWith('p3-')) {
                sentence3Count++;
            } else if (t.value.startsWith('p4-')) {
                sentence4Count++;
            }
        });
        expect(sentence1Count).toEqual(5);
        expect(sentence2Count).toBeGreaterThan(2);
        expect(sentence3Count).toBeLessThan(5);
        expect(sentence4Count).toBeGreaterThan(1);
    });
});

describe('regular and even distribution with different probabilities', () => {
    const probsExample = `
%[default]
    ~[phrase1]
    ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[defaultWithPercProb]
    *[36%] ~[phrase1]
    *[25%] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[defaultWithWeightProb]
    *[36] ~[phrase1]
    *[25] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[even]('distribution': 'even')
    ~[phrase1]
    ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[evenWithPercProb]('distribution': 'even')
    *[36%] ~[phrase1]
    *[25%] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[evenWithWeightProb]('distribution': 'even')
    *[36] ~[phrase1]
    *[25] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[regular]('distribution': 'regular')
    ~[phrase1]
    ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[regularWithPercProb]('distribution': 'regular')
    *[36%] ~[phrase1]
    *[25%] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

%[regularWithWeightProb]('distribution': 'regular')
    *[36] ~[phrase1]
    *[25] ~[phrase2] ~[phrase2?]
    ~[phrase3] ~[phrase3?] ~[phrase3?]
    ~[phrase4] ~[phrase4?] ~[phrase4?] ~[phrase4?]

~[phrase1]
    p1-1
    p1-2
    p1-3
    p1-4
    p1-5

~[phrase2]
    p2-1
    p2-2
    p2-3
    p2-4
    p2-5

~[phrase3]
    p3-1
    p3-2
    p3-3
    p3-4
    p3-5

~[phrase4]
    p4-1
    p4-2
    p4-3
    p4-4
    p4-5
`;
    const regularProbs = [5, 30, 180, 1080];
    const regularPercProbs = [36, 25, 5.571428571428572, 33.42857142857142];
    const regularWeightProbs = [5 * 36, 30 * 25, 180, 1080];
    const evenProbs = [1, 1, 1, 1];
    const evenPercProbs = [36, 25, 19.5, 19.5];
    const evenWeightProbs = [36, 25, 1, 1];

    describe('correctly calculates probabilties when default distribution is regular', () => {
        const ast = chatito.astFromString(probsExample);
        const defs = chatito.definitionsFromAST(ast);
        expect(defs).not.toBeUndefined();

        test('default distribution, no probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.default, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-default');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-default')!.probabilities).toStrictEqual(regularProbs);
        });

        test('default distribution, percentage probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.defaultWithPercProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-defaultWithPercProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-defaultWithPercProb')!.probabilities).toStrictEqual(regularPercProbs);
        });

        test('default distribution, weighted probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.defaultWithWeightProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-defaultWithWeightProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-defaultWithWeightProb')!.probabilities).toStrictEqual(regularWeightProbs);
        });

        test('even distribution, no probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.even, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-even');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-even')!.probabilities).toStrictEqual(evenProbs);
        });

        test('even distribution, percentage probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.evenWithPercProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-evenWithPercProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-evenWithPercProb')!.probabilities).toStrictEqual(evenPercProbs);
        });

        test('even distribution, weighted probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.evenWithWeightProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-evenWithWeightProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-evenWithWeightProb')!.probabilities).toStrictEqual(evenWeightProbs);
        });

        test('regular distribution, no probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.regular, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-regular');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-regular')!.probabilities).toStrictEqual(regularProbs);
        });

        test('regular distribution, percentage probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.regularWithPercProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-regularWithPercProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-regularWithPercProb')!.probabilities).toStrictEqual(regularPercProbs);
        });

        test('regular distribution, weighted probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.regularWithWeightProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-regularWithWeightProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-regularWithWeightProb')!.probabilities).toStrictEqual(regularWeightProbs);
        });
    });

    describe('correctly calculates probabilties when default distribution is even', () => {
        const ast = chatito.astFromString(probsExample);
        const defs = chatito.definitionsFromAST(ast);
        expect(defs).not.toBeUndefined();
        beforeAll(() => {
            chatito.config.defaultDistribution = 'even';
        });
        afterAll(() => {
            chatito.config.defaultDistribution = 'regular';
        });

        test('default distribution, no probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.default, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-default');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-default')!.probabilities).toStrictEqual(evenProbs);
        });

        test('default distribution, percentage probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.defaultWithPercProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-defaultWithPercProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-defaultWithPercProb')!.probabilities).toStrictEqual(evenPercProbs);
        });

        test('default distribution, weighted probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.defaultWithWeightProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-defaultWithWeightProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-defaultWithWeightProb')!.probabilities).toStrictEqual(evenWeightProbs);
        });

        test('even distribution, no probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.even, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-even');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-even')!.probabilities).toStrictEqual(evenProbs);
        });

        test('even distribution, percentage probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.evenWithPercProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-evenWithPercProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-evenWithPercProb')!.probabilities).toStrictEqual(evenPercProbs);
        });

        test('even distribution, weighted probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.evenWithWeightProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-evenWithWeightProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-evenWithWeightProb')!.probabilities).toStrictEqual(evenWeightProbs);
        });

        test('regular distribution, no probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.regular, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-regular');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-regular')!.probabilities).toStrictEqual(regularProbs);
        });

        test('regular distribution, percentage probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.regularWithPercProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-regularWithPercProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-regularWithPercProb')!.probabilities).toStrictEqual(regularPercProbs);
        });

        test('regular distribution, weighted probabilities', () => {
            const cache: IChatitoCache = new Map();
            chatito.getVariationsFromEntity(defs!.Intent.regularWithWeightProb, defs!, false, cache);
            const intentCache = cache.get('IntentDefinition-regularWithWeightProb');
            expect(intentCache).not.toBeUndefined();
            expect(cache.get('IntentDefinition-regularWithWeightProb')!.probabilities).toStrictEqual(regularWeightProbs);
        });
    });
});

describe('example with import of empty file', () => {
    const ex = `
import ./something.chatito
%[greet]
    ~[phrase1]
    ~[phrase2] ~[phrase2?]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            dataset = await web.adapter(ex, null);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
        expect(dataset).toBeNull();
        expect(error.message).toContain('Failed importing');
    });
});
export type IFileImporter = (
    fromPath: string,
    importFile: string
) => {
    filePath: string;
    dsl: string;
};

describe('example with import with custom importer', () => {
    const main = `
import ./something.chatito
%[greet]
    ~[phrase1]
    ~[phrase2]
`;
    const sec = `
~[phrase1]
    p1-1
    p1-2

~[phrase2]
    p2-1
    p2-2
`;
    const customImporter = () => ({
        filePath: '',
        dsl: sec
    });
    test('correctly works', async () => {
        let error = null;
        let dataset: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            dataset = await web.adapter(main, null, customImporter, '');
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(dataset).not.toBeNull();
        expect(dataset!.training).not.toBeNull();
        expect(dataset!.training.greet).not.toBeNull();
        expect(dataset!.training.greet.length).toEqual(4);
    });
});

describe('example that generates empty strings', () => {
    const main = `
%[test]('training': '6')
    ~[hi?] ~[hi?] ~[hi?]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            dataset = await web.adapter(main, null);
        } catch (e) {
            error = e;
        }
        expect(dataset).toBeNull();
        expect(error).not.toBeNull();
        expect(error.message).toEqual(`Some sentence generated an empty string. Can't map empty to an intent.`);
    });
});

describe('example that only has one sentence with float probs', () => {
    const main = `
%[findRestaurantsByCity]('training': '3')
    *[99.99%] ~[restaurants]

~[restaurants]
    restaurants
    places to eat
    where to eat

`;
    test('correctly works', async () => {
        let error = null;
        let dataset: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            dataset = await web.adapter(main, null);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(dataset).not.toBeNull();
        expect(dataset!.training).not.toBeNull();
        expect(dataset!.training.findRestaurantsByCity).not.toBeNull();
        expect(dataset!.training.findRestaurantsByCity.length).toEqual(3);
    });
});

describe('example with invalid slot definition', () => {
    const ex = `
%[greet]
    ~[phrase2] @[phrase2?]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            dataset = await web.adapter(ex, null);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
        expect(dataset).toBeNull();
        expect(error.message).toContain('Slot not defined: phrase2');
    });
});

describe('example with two types of probability operator', () => {
    const ex = `
%[greet]
    *[30%] ~[phrase2]
    *[4] ~[phrase2] ~[phrase2]
`;
    test('correctly fails', async () => {
        let error = null;
        let dataset: ThenArg<ReturnType<typeof web.adapter>> | null = null;
        try {
            dataset = await web.adapter(ex, null);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
        expect(dataset).toBeNull();
        expect(error.message).toContain('All probability definitions for "IntentDefinition-greet" must be of the same type.');
    });
});
