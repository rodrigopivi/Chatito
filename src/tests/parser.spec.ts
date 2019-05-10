import { IChatitoParser } from '../types';

// tslint:disable-next-line:no-var-requires
const chatitoParser = require('../../parser/chatito') as IChatitoParser;

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
        try {
            result = chatitoParser.parse(firstSpecExample);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Simple examples with max training and testing', () => {
    const specExampleWithMaximum = `
%[greet]('training': '3')
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
    test('CORRECT parser output specExampleWithMaximum', () => {
        let error = null;
        let result = null;
        try {
            result = chatitoParser.parse(specExampleWithMaximum);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
    const specExampleWithTrainingAndTesting = `
%[greet]('training': '3', 'testing': '3')
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
    test('CORRECT parser output for specExampleWithTrainingAndTesting', () => {
        let error = null;
        let result = null;
        try {
            result = chatitoParser.parse(specExampleWithTrainingAndTesting);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
    const specExampleWithTrainingAndTestingWithSpaces = `
%[greet](  'training' : '3'  ,  'testing': '3'  )
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
    test('CORRECT parser output for specExampleWithTrainingAndTestingWithSpaces', () => {
        let error = null;
        let result = null;
        try {
            result = chatitoParser.parse(specExampleWithTrainingAndTestingWithSpaces);
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Simple example with wrong syntax', () => {
    const specExampleWithWrongSyntax = `
%[greet]('training': '3')wrong
    hi
`;
    test('ERROR with wrong syntax after maximum', () => {
        let error = null;
        let result = null;
        try {
            result = chatitoParser.parse(specExampleWithWrongSyntax);
        } catch (e) {
            error = e;
        }
        expect(error).toMatchSnapshot();
    });
    const specExampleWithWrongTestingTrainingSyntax = `
%[greet]('training': 3, 'testing': 3)
    hi
`;
    test('ERROR with wrong syntax after training and testing defined', () => {
        let error = null;
        let result = null;
        try {
            result = chatitoParser.parse(specExampleWithWrongTestingTrainingSyntax);
        } catch (e) {
            error = e;
        }
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
        try {
            result = chatitoParser.parse(specExampleWithWrongIndentationSyntax);
        } catch (e) {
            error = e;
        }
        expect(error).toMatchSnapshot();
    });
});

describe('Simple example for windows end of line', () => {
    // tslint:disable-next-line:max-line-length
    const specExampleWindowsEOLSyntax = `%[greet]\r\n    hi hi\r\n    how are you @[full names] sup\r\n@[full names]\r\n    jim raynor`;
    test('CORRECT parser output', () => {
        let error = null;
        let result = null;
        try {
            result = chatitoParser.parse(specExampleWindowsEOLSyntax);
        } catch (e) {
            error = e;
        }
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
        try {
            result = chatitoParser.parse(slotVariationSpecSyntax);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
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
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Example with multi intent', () => {
    const slotExamplesWithWeirdKeywords = `
%[hi + bye]
    hi, i have to go, bye
`;
    test('CORRECT parser output', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Example with comments spec', () => {
    const exampleWithCorrectComments = `
// this is a comment
%[ask_for_delivery]
    my parcel should be delivered in @[delivery_time#time_in_hours]

// this is two
// line comment
@[delivery_time#time_in_hours]
    3 days
    5 hours
// more comments here
`;
    test('CORRECT parser output for exampleWithCorrectComments', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(exampleWithCorrectComments);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });

    const exampleWithCorrectHashComments = `
#this is a comment
%[ask_for_delivery]
    my parcel should be delivered in @[delivery_time#time_in_hours]
`;
    test('CORRECT parser output for exampleWithCorrectHashComments', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(exampleWithCorrectHashComments);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });

    const exampleWithWrongComments = `
    // this is a comment
%[ask_for_delivery]
    my parcel should be delivered in @[delivery_time#time_in_hours]

@[delivery_time#time_in_hours]
    3 days
    5 hours
`;
    test('CORRECT parser output for exampleWithWrongComments', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(exampleWithWrongComments);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toMatchSnapshot();
    });
});

describe('Example with probability opreator', () => {
    const slotExamplesWithWeirdKeywords = `
%[greet]('training': '10', 'testing': '10')
    *[50] ~[phrase1]
    *[30] ~[phrase2] ~[phrase3?]
    ~[another phrase] ~[something] ~[something else?]
`;
    test('CORRECT parser output', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Example with probability opreator but non int value parses as text', () => {
    const slotExamplesWithWeirdKeywords = `
%[greet]('training': '10', 'testing': '10')
    *[5c0] ~[phrase1]
`;
    test('CORRECT parser output', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Example with probability opreator but no aftre spacee parses as text', () => {
    const slotExamplesWithWeirdKeywords = `
%[greet]('training': '10', 'testing': '10')
    *[50]~[phrase1]
`;
    test('CORRECT parser output', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Example with international language characters', () => {
    const slotExamplesWithWeirdKeywords = `
%[中文]
    中文 @[中文] ~[中文]

@[中文]
    中文
`;
    test('CORRECT parser output', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});

describe('Example with import statement at start', () => {
    const slotExamplesWithWeirdKeywords = `

import ../some/file.chatito
import ../some/file.chatito

%[greet]
    hey yo!
`;
    test('CORRECT parser output', () => {
        let error: any = null;
        let result = null;
        try {
            result = chatitoParser.parse(slotExamplesWithWeirdKeywords);
        } catch (e) {
            error = { error: e };
            if (e.location) {
                error.location = {
                    line: e.location.start.line,
                    column: e.location.start.column
                };
            }
        }
        expect(error).toBeNull();
        expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });
});
