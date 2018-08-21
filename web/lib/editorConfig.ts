import * as rasaAdapter from '../../src/adapters/rasa';
import * as snipsAdapter from '../../src/adapters/snips';
import * as webAdapter from '../../src/adapters/web';

const findRestaurantsByCity = `// Find restaurants by city
%[findRestaurantsByCity]('training': '100', 'testing': '100')
    ~[greet?] ~[please?] ~[find?] ~[restaurants] ~[located at] @[city] ~[city?]

@[city]
    ~[new york]
    ~[san francisco]
    ~[atlanta]

~[greet]
    hey
    hi
    hello
    greetings

~[located at]
    at
    in the area of
    located at

~[restaurants]
    restaurants
    places to eat
    where to eat
`;

const affirmative = `// Ways to say yes
%[affirmative]('training': '100', 'testing': '100')
    ~[yes]
    ~[yes] ~[yes?] ~[please?]
    you got that ~[yes]
    you're goddamn ~[yes]
    ~[yes] ~[wantThat]
    yes that is ~[yes]
    ~[yes] ~[yes?] ~[yes?] ~[yes?]
    ~[wantThat]

~[yes]
    yes
    right
    affirmative
    yes to that
    correct
    yep
    yes sir
    si
    correcto
    ok
    right
    allright

~[wantThat]
    i want that
    i desire that
    i agree
    i want that
    that is fine
    that is correct
    that is what i want
    you understood me
    that is right
    that is what i mean
    want that
    im ok with that
    ok its good
    im good with that
    ok its fine
    is good
    it is fine
    im ok with this
    im good with this
`;

const bye = `// Ways to say goodbye
%[bye]('training': '100', 'testing': '100')
    ~[leaving?] ~[bye] ~[bye?] ~[bye?] ~[leaving?]
    ~[leaving] ~[bye?]

~[bye]
    bye
    goodbye
    ttyl
    gtg
    adios
    farewell
    adieu
    chao
    chau

~[leaving]
    leaving
    talk to you soon
    have to go
    got to go
    talk to you later
    heading out
    im leaving now
    going out
`;

const greet = `// Ways to say hello
%[greet]('training': '100', 'testing': '100')
    ~[hi] ~[hi?] ~[hi?]
    ~[greetings] ~[greetings?]
    ~[hi] ~[greetings] ~[hi?]
    ~[greetings] ~[hi] ~[hi?]

~[hi]
    hi
    hello
    hey
    howdy
    hola

~[greetings]
    greetings
    how are you
    whats up
    how are you doing
    how is it going
    good morning
    good afternoon
    good day
    good night
    are you there
    morning
    how are things going
    are you around
    whatsup
    sup
    are you around?
`;

const negative = `// Ways to say no
%[negative]('training': '100', 'testing': '100')
    ~[no] ~[no?] ~[please?]
    ~[no] ~[notWhatIWant]
    ~[no?] ~[notWhatIWant] ~[no?]
    ~[no] ~[no?] ~[no?]

~[no]
    no
    nope
    negative
    not correct
    incorrect
    no sir
    wrong

~[notWhatIWant]
    dont want that
    dont desire that
    dont agree on that
    didnt meant that
    dont mean that
    not what i want
    not correct
    wrong
    bad
    incorrect
    im not ok with that
    not good
    its bad
    that is bad
    that is wrong
    im not good with that
    ok its not fine
    definitely no
    not good for me
    its not ok
    its not correct
`;

export const tabs = [
    { title: 'findRestaurantsByCity.chatito', value: findRestaurantsByCity },
    { title: 'greet.chatito', value: greet },
    { title: 'bye.chatito', value: bye },
    { title: 'affirmative.chatito', value: affirmative },
    { title: 'negative.chatito', value: negative }
];

export const chatitoPrism = {
    comments: [{ pattern: /^\/\/.*/, greedy: true }, { pattern: /((\n|\r\n)+)\/\/.*/, greedy: true }],
    intentDefinition: [
        {
            pattern: /^%\[[^\]]+\]((\(.+\))?)/,
            inside: { intentArguments: /((\(.+\))?)$/ }
        },
        {
            pattern: /((\n|\r\n)+)%\[[^\]]+\]((\(.+\))?)/,
            inside: { intentArguments: /((\(.+\))?)$/ }
        }
    ],
    slotDefinition: [
        {
            pattern: /^\@\[[^\]]+\]((\(.+\))?)/,
            inside: { slotArguments: /((\(.+\))?)$/ }
        },
        {
            pattern: /((\n|\r\n)+)\@\[[^\]]+\]((\(.+\))?)/,
            inside: { slotArguments: /((\(.+\))?)$/ }
        }
    ],
    slot: { pattern: /\@\[[^\]]+(\?)?\]/, greedy: true },
    alias: { pattern: /~\[[^\]]+(\?)?\]/, greedy: true },
    default: { pattern: /[^\r\n]/i, greedy: true }
};

export const webDefaultOptions: webAdapter.IDefaultDataset = {};
export const rasaDefaultOptions: rasaAdapter.IRasaDataset = {
    rasa_nlu_data: {
        regex_features: [],
        entity_synonyms: [],
        common_examples: []
    }
};
export const snipsDefaultOptions: snipsAdapter.ISnipsDataset = { language: 'en', entities: {}, intents: {} };
