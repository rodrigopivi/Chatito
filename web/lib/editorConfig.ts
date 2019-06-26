import * as rasaAdapter from '../../src/adapters/rasa';
import * as snipsAdapter from '../../src/adapters/snips';
import * as webAdapter from '../../src/adapters/web';

const findRestaurantsByCity = `import ./common.chatito

# Ways to request a restaurant within a location (using probability operator)
# NOTE: 60% of the examples should come from the first sentence, and 40% from the second

%[findRestaurantsByCity]('training': '100', 'testing': '100')
    *[60%] ~[hi?] ~[please?] ~[find?] ~[restaurants] ~[located at] @[city] ~[city?] ~[thanks?]
    *[40%] ~[restaurants] ~[located at] @[city]

@[city]
    ~[new york]
    ~[san francisco]
    ~[atlanta]

~[find]
    find
    i'm looking for
    help me find

~[located at]
    located at
    in the area of
    near

~[restaurants]
    restaurants
    places to eat
    where to eat
`;

const affirmative = `// Ways to say yes

import ./common.chatito

%[affirmative]('training': '50', 'testing': '50')
    *[20%] ~[yes]
    ~[yes] ~[please?]
    ~[yes] ~[yes?] ~[thanks?]
    ~[yes?] ~[that is good] ~[yes?]

~[yes]
    yes
    right
    affirmative
    agreed
    correct
    yep
    yes sir
    sounds good
    im ok with that

~[that is good]
    that is good
    i want that
    that is fine
    that is correct
    that is what i want
    you understood me
    that is right
    its fine
    good
`;

const bye = `// Ways to say goodbye

import ./common.chatito

%[bye]('training': '50', 'testing': '50')
    *[20%] ~[bye]
    ~[thanks?] ~[bye]
    ~[bye] ~[thanks?]
    ~[leaving]
    ~[leaving] ~[bye]

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

import ./common.chatito

%[greet]('training': '50', 'testing': '50')
    *[20%] ~[hi]
    ~[greetings]
    ~[hi] ~[greetings?]
    ~[hi] ~[whats up]
    ~[greetings] ~[whats up]
    ~[hi] ~[greetings] ~[whats up]

~[greetings]
    greetings
    good morning
    good afternoon
    good day
    good night
    morning

~[whats up]
    how are you
    whats up
    how are you doing
    how is it going
    are you there
    how are things going
    are you around
    whatsup
    sup
    are you around?
`;

const negative = `// Ways to say no

import ./common.chatito

%[negative]('training': '50', 'testing': '50')
    *[20%] ~[no]
    ~[no] ~[please?] ~[its not ok?]
    ~[please?] ~[no] ~[its not ok?]
    *[20%] ~[its not ok]

~[no]
    no
    nope
    not really
    that's not right
    incorrect
    don't do that

~[its not ok]
    i don't want that
    didnt meant that
    dont mean that
    that's not what i want
    that's not correct
    that's wrong
    it's not good
    that is wrong
    its not ok
    its not correct
`;

const common = `// Common entities to be imported and reused
~[hi]
    hi
    hello
    hey

~[please]
    please
    plz
    pls

~[thanks]
    thanks
    thank you

`;

export const tabs = [
    { title: 'findRestaurantsByCity.chatito', value: findRestaurantsByCity },
    { title: 'greet.chatito', value: greet },
    { title: 'bye.chatito', value: bye },
    { title: 'affirmative.chatito', value: affirmative },
    { title: 'negative.chatito', value: negative },
    { title: 'common.chatito', value: common }
];

export const chatitoPrism = {
    comments: [{ pattern: /^(\/\/|\#).*/, greedy: true }, { pattern: /((\n|\r\n)+)(\/\/|\#).*/, greedy: true }],
    imports: [{ pattern: /(\n|\r\n)import\s/, greedy: true }, { pattern: /^import\s/, greedy: true }],
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
    probability: { pattern: /(\n|\r\n)\s\s\s\s\*\[[^\]]+\]/, greedy: true },
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
