import { IChatitoParser } from '../types';

const chatitoParser = (require('../../parser/chatito') as IChatitoParser);

describe('Simple example', () => {
const firstSpecExample = `
%[greet]
    ~[hi] @[name?] ~[whatsUp?] one two three im @[name?]

~[hi]
    hi
    hey

@[name]
    Janis
    Bob

~[whatsUp]
    whats up
    how is it going
`;
test('correct PEGJS output', () => {
    let error = null;
    let result = null;
    try { result = chatitoParser.parse(firstSpecExample); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
});

describe('Simple example with max', () => {
const specExampleWithMaximum = `
%[greet](3)
    ~[hi] @[name?] ~[whatsUp?]
~[hi]
    hi
    hey
@[name]
    Janis
    Bob
~[whatsUp]
    whats up
    how is it going
`;
test('CORRECT parser output', () => {
    let error = null;
    let result = null;
    try { result = chatitoParser.parse(specExampleWithMaximum); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
});

describe('Simple example with wrong syntax', () => {
const specExampleWithWrongMaximunSyntax = `
%[greet](3)wrong
    hi
`;
test('ERROR with wrong syntax after maximum', () => {
    let error = null;
    let result = null;
    try { result = chatitoParser.parse(specExampleWithWrongMaximunSyntax); } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
});
});

describe('Simple example with wrong identation', () => {
const specExampleWithWrongIndentationSyntax = `
%[greet]
  wrong
`;
test('ERROR with wrong indentation syntax', () => {
    let error = null;
    let result = null;
    try { result = chatitoParser.parse(specExampleWithWrongIndentationSyntax); } catch (e) { error = e; }
    expect(error).toMatchSnapshot();
});
});

describe('Simple example for windows end of line', () => {
// tslint:disable-next-line:max-line-length
const specExampleWindowsEOLSyntax = `%[greet]\r\n    hi hi\r\n    how are you @[full names] sup\r\n@[full names]\r\n    jim raynor`;
test('CORRECT parser output', () => {
    let error = null;
    let result = null;
    try { result = chatitoParser.parse(specExampleWindowsEOLSyntax); } catch (e) { error = e; }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
});

describe('Example variation spec', () => {
const slotVariationSpecSyntax = `
%[ask_for_delivery]
    my parcel should be delivered in @[delivery_time#time_in_hours]
    my parcel should be delivered @[delivery_time#relative_time]

@[delivery_time#time_in_hours]
    3 days
    5 hours

@[delivery_time#relative_time]
    as fast as possible
    quickly
`;
test('CORRECT parser output', () => {
    let error: any = null;
    let result = null;
    try { result = chatitoParser.parse(slotVariationSpecSyntax); } catch (e) {
        error = { error: e };
        if (e.location) {
            error.location = { line: e.location.start.line, column: e.location.start.column };
        }
    }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
});

describe('Example for weird variations', () => {
const slotExamplesWithWeirdKeywords = `
%[intent]
    [ adfd] adf ~ @ asdfasdf asdf ~[alias_name ok] @[slot name#variation name?]
    ~ @~[alias_name ok]@[slot name#variation name?]
    @@~[alias_name ok]~~@[slot name#variation name?]

@[slot name#variation name]
    3 ~[daysOrHours]
    5 ~[daysOrHours]

~[alias_name ok]
    as fast as possible
    quickly

~[daysOrHours]
    days
    hours
`;
test('CORRECT parser output', () => {
    let error: any = null;
    let result = null;
    try { result = chatitoParser.parse(slotExamplesWithWeirdKeywords); } catch (e) {
        error = { error: e };
        if (e.location) {
            error.location = { line: e.location.start.line, column: e.location.start.column };
        }
    }
    expect(error).toBeNull();
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
});
