const fs = require('fs');
const path = require('path');
const generator = require('./datasetGenerator');

const getExampleFile = filename => path.resolve(__dirname, filename);

test('test empty parser error', () => {
    let error = null;
    let result = null;
    try {
        result = generator.datasetFromString("");
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test('test action without sentences error', () => {
    let error = null;
    let result = null;
    const badInput = '%[asdf]\n';
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test('test no actions error', () => {
    let error = null;
    let result = null;
    const badInput = '~[asdf]\n    test\n';
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test('test action without correct identation error', () => {
    let error = null;
    let result = null;
    const badInput = '%[asdf]\n    test\n     badIdentation';
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test('test action referencing undefined argument', () => {
    let error = null;
    let result = null;
    const badInput = '%[asdf]\n    test @[arg]\n';
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test('test action referencing undefined alias', () => {
    let error = null;
    let result = null;
    const badInput = '%[asdf]\n    test ~[alias]\n';
    try {
        result = generator.datasetFromString(badInput);
    } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
    expect(result).toBeNull();
});

test('test action referencing action works as text', () => {
    let error = null;
    let result = null;
    const input = '%[asdf]\n    test %[arg]\n';
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test('test action defiend after alias', () => {
    let error = null;
    let result = null;
    const input = '~[asdf]\n    test\n\n%[arg]\n    asdf';
    try {
        result = generator.datasetFromString(input);
    } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(result).toMatchSnapshot();
});

test('test action with two arguments', () => {
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
