# Chatito

Generate training datasets for chatbots in a breeze!

Chatito is a natural language generation (NLG) tool and a domain specific language (DSL) for creating chatbot training datasets.

Slot filling chatbots are a type of chatbots that link short text sentences to actions and extract the action arguments from the sentence.

The general idea is that given a sentence, we link an action to it and
link some of the sentece words to arguments that are useful for the action. e.g.:

```
Sentence -> Hey Bot turn the lights off

Parsed Intent -> {
    id: "Hey Bot turn the lights off",
    action: "lightChange",
    arg: { switch: "off" }
}
```

Test it online at [https://rodrigopivi.github.io/Chatito/](https://rodrigopivi.github.io/Chatito/)

### Getting started

- `npm i chatito --save`
- create a definition file. e.g.: `trainClimateBot.chatito` with your DSL definitions.
- `npx chatito trainClimateBot.chatito`
- The training set should be available at `trainClimateBot.json`

The json file contains all the possible combination sentences. Each traning example is an object that contains sentence, action and arguments. E.g.:

Given this DSL definition:
```
%[lightChange]
    Hey Bot turn the lights @[switch]

@[switch]
    off
    on
```

It will generate this dataset:
```
[
    {
        id: "Hey Bot turn the lights on",
        action: "lightChange",
        arg: { switch: "on" }
    },
    {
        id: "Hey Bot turn the lights off",
        action: "lightChange",
        arg: { switch: "off" }
    }
]
```

## Chatito DSL

A Chatito domain specific language file should contain the '.chatito' extension, and is just a text file the operators definitions.

Important Note: The DSL uses 4 space identation to define the code block scope nesting.

### Operators

Operators are the way to declare keywords with special behaviors. An operator is a token that starts with an operator symbol (`%` or `@` or `~`), followed by an opening squared bracket `[`, a cammel cased word with no spaces and a closing
squared bracket `]`. e.g.: `%[someAction]`, `@[someArgument]`, `~[someAlias]`

When using operators inside a sentence, operators can be made optional by adding
a `?` symbol after the closing squared bracket. E.g.: `~[hi]?`

Here is the full list of operators:

#### Action (`%[` `]`)

The action operator is how we link a sentence with an actual bot command.
Each action is an entry point for the generator. Actions cannot be nested, but can contain other operators (arguments and aliases).
We can think about it, as if each action maps to a function call. E.g.:

```
%[turnOnLights]
    turn on the lights
    lights on
    its too dark
    please lights on
```

Then, everytime we receive a sentence that links to turnOnLights action. We can call a function, if the function we want to call needs arguments, we can use the argument operator to define them.

#### Argument (`@[` `]`):

Encapsulates a set of keywords as possible values for an input variable.
Argument definitions can only include alias operators or words.

```
%[timeAtCity]
    what time is at @[city]

@[city]
    miami
    ~[newYork]
    ~[losAngeles]

~[newYork]
    new york
    ny
    ny city
    new york city

~[losAngeles]
    los angeles
    la
    los angeles city
    la city
```
        

#### Alias (`~[` `]`):

A word or list of words that are equivalent. e.g.:

```
%[greet]
    ~[hi]

~[hi]
    hi
    hello
    hi there
    hey
```


# Full Example:

```
%[findByCityAndCategory]
    ~[greet]? ~[botName]? ~[please]? ~[find]? ~[restaurants]? ~[nearby] @[city]

~[greet]
    hey
    hi
    hello
    greetings

~[botName]
    Fred
    Fredy
    Frederick

~[please]
    please
    pls

~[find]
    find
    search
    lookup

~[nearby]
    close to
    in the area of
    within
    located at
    nearby

~[restaurants]
    restaurants
    places to eat
    where to eat

~[newYork]
    new york
    ny
    new york city
    ny city
~[sanFrancisco]
    san francisco
    san francisco city

~[atlanta]
    atlanta
    atlanta city

@[city]
    ~[newYork]
    ~[sanFrancisco]
    ~[atlanta]

```

# Credits

- [nalgene](https://github.com/spro/nalgene) - Similar tool.
- [PEG.js](https://pegjs.org) - Simple and powerfull parser generator.

# Chatbot models

- [JointSLU](https://github.com/yvchen/JointSLU)
- [ATIS.Keras](https://github.com/chsasank/ATIS.keras)
- [RNN-for-Joint-NLU](https://github.com/DSKSD/RNN-for-Joint-NLU)
- [pytorch-seq2seq-intent-parsing](https://github.com/spro/pytorch-seq2seq-intent-parsing)
- [Adapt intent parsing](https://github.com/MycroftAI/adapt)
