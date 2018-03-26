const generator = require("./datasetGenerator");
const chatito = require("./chatito");
const rasaGenerator = require("./rasaGenerator");
const snipsGenerator = require("./snipsGenerator");

test("test pegjs parser output", () => {
    let error = null;
    let result = null;
    const str = `
%[lightChange]
    lights @[switch]

@[switch]
    ~[on]
    ~[off]

~[on]
    on
    active
    activated
    iluminated

~[off]
    off
    inactive
    dark
`;
    try {
        result = chatito.parse(str);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});

test("test argument that defines only one alias inside each line", () => {
    let error = null;
    let result = null;
    const str = `
%[lightChange]
    lights @[switch]

@[switch]
    ~[on]
    ~[off]

~[on]
    on
    active

~[off]
    off
    inactive
`;
    try {
        result = generator.datasetFromString(str);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});

test("test switch off example for argument with one value", () => {
    let error = null;
    let result = null;
    const str = `
%[lightChange]
    Hey Bot @[switch] the lights

@[switch]
    ~[off]

~[off]
    turn off
    deactivate
`;
    try {
        result = generator.datasetFromString(str);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});

test("test optional value", () => {
    let error = null;
    let result = null;
    const str = `
%[lightChange]
    Hey Bot @[switch?] the lights

@[switch]
    ~[off]

~[off]
    turn off
    deactivate
`;
    try {
        result = generator.datasetFromString(str);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});

test("test empty parser error", () => {
    let error = null;
    let result = null;
    try {
        result = generator.datasetFromString("");
    } catch (e) { error = JSON.stringify(e, null, 2); }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test("test action without sentences error", () => {
    let error = null;
    let result = null;
    const badInput = "%[asdf]\n";
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = JSON.stringify(e, null, 2); }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test("test no actions error", () => {
    let error = null;
    let result = null;
    const badInput = "~[asdf]\n    test\n";
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test("test action without correct identation error", () => {
    let error = null;
    let result = null;
    const badInput = "%[asdf]\n    test\n     badIdentation";
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = JSON.stringify(e, null, 2); }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test("test action referencing undefined argument", () => {
    let error = null;
    let result = null;
    const badInput = "%[asdf]\n    test @[arg]\n";
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test("test action referencing undefined alias", () => {
    let error = null;
    let result = null;
    const badInput = "%[asdf]\n    test ~[alias]\n";
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test("test action referencing action works as text", () => {
    let error = null;
    let result = null;
    const input = "%[asdf]\n    test %[arg]\n";
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test action defiend after alias", () => {
    let error = null;
    let result = null;
    const input = "~[asdf]\n    test\n\n%[arg]\n    asdf";
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("argument defining optional value wont map the entity as empty string", () => {
    let error = null;
    let result = null;
    const input = `
%[findByCityAndCategory]
    ~[greet?]? @[city]
~[greet]
    hey
@[city]
    ~[atlanta?]
~[atlanta]
    atlanta
`;
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test readme example with rasa nlu", () => {
    let error = null;
    let result = null;
    const input = `
%[lightChange]
    Hey Bot turn the @[lights] @[switch]
@[switch]
    off
    on
@[lights]
    lights
    luces
`;
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test rasa nlu post processor", () => {
    let error = null;
    let result = null;
    const input = `
%[lightChange]
    Hey Bot turn the @[lights] @[switch]
@[switch]
    off
    on
@[lights]
    lights
    luces
`;
    try {
        const dataset = generator.datasetFromString(input);
        result = rasaGenerator.postProcessor(dataset, 3);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result.stats).toEqual({ total: 4, training: 3, testing: 1 });
    expect(result.dataset.rasa_nlu_data.common_examples.length).toEqual(3);
    expect(result.testingExamples.length).toEqual(1);
});

test("test readme example with snips nlu", () => {
    let error = null;
    let result = null;
    const input = `
%[lightChange]
    Hey Bot turn the @[lights] @[switch]
@[switch]
    off
    on
@[lights]
    lights
    luces
`;
    try {
        result = generator.datasetFromString(input, "snips");
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test snips nlu post processor", () => {
    let error = null;
    let result = null;
    const input = `
%[lightChange]
    Hey Bot turn the @[lights] @[switch]
@[switch]
    off
    on
@[lights]
    lights
    luces
`;
    try {
        const dataset = generator.datasetFromString(input, "snips");
        result = snipsGenerator.postProcessor(dataset, 3);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result.stats).toEqual({ total: 4, training: 3, testing: 1 });
    expect(result.dataset.intents.lightChange.utterances.length).toEqual(3);
    expect(result.testingExamples.length).toEqual(1);
    expect(result.testingExamples[0].intent).toEqual("lightChange");
    expect(result.testingExamples[0].examples.length).toEqual(1);
});

test("test operator names with underscore space and numbers", () => {
    let error = null;
    let result = null;
    const input = `
%[light_change]
    at @[custom time]

@[custom time]
    ~[11:11 am]

~[11:11 am]
    11:11 am
    eleven eleven in the morning
`;
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test snips nlu adapter", () => {
    let error = null;
    let result = null;
    const input = `
%[light_change]
    is it true that the time at @[places] is @[custom_time]?

@[places#location]
    ~[new york]

@[custom_time#snips/datetime]
    ~[11:11 am]

~[11:11 am]
    11:11 am
    eleven eleven in the morning

~[new york]
    new york
    ny
    nyc
`;
    try {
        result = generator.datasetFromString(input, "snips");
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test snips nlu readme example", () => {
    let error = null;
    let result = null;
    const input = `
%[sampleGetWeather]
    will it be sunny in @[city] at @[weatherDate] ?
    What is the weather in @[city] ?

@[weatherDate#snips/datetime]
    this afternoon

@[city#location]
    ~[los angeles]
    rio de janeiro

~[los angeles]
    los angeles
    la
`;
    try {
        result = generator.datasetFromString(input, "snips");
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test("test snips nlu passing options", () => {
    let error = null;
    let result = null;
    const input = `
%[buscaEnCiudad]
    buscar en la ciudad de @[city]

@[city#location]
    ~[ny]

~[ny]
    new york
    ny
`;
    const snipOptions = { language: "es", entities: { location: { automatically_extensible: true} } };
    try {
        result = generator.datasetFromString(input, "snips", snipOptions);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});