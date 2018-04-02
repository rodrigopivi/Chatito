# [Chatito](https://rodrigopivi.github.io/Chatito/)

### [Online Chatito IDE](https://rodrigopivi.github.io/Chatito/)

Generate datasets for natural language understanding (NLU) chatbots in a breeze using a simple DSL.

Chatito is a blazing fast natural language generation (NLG) tool and a domain specific language (DSL) that helps you code dataset generators. It takes some ideas from probabilistic programming languages (PPS) to help you express your conversational domain knowledge through code, as described in [Automatic Inference, Learning and Design using Probabilistic Programming](https://github.com/twgr/thesis/blob/master/main.pdf).

Discriminative NLU models require training examples and the more valid examples, the better the model. The data defines the model. It is easier to write and maintain generative models with your specific business knowledge and generate the examples you need, instead of doing it manually. You can maintain chatito dsl files instead of big json dataset files.

Test it online at [https://rodrigopivi.github.io/Chatito/](https://rodrigopivi.github.io/Chatito/)

This library supports [Rasa NLU](https://github.com/RasaHQ/rasa_nlu) and [Snips NLU](https://github.com/snipsco/snips-nlu) json dataset formats.

Rasa NLU  and Snips NLU are frameworks for training intent and entity extraction models in a breeze. Chatito generates training datasets compatible with both and provides support for smart aliasing features of both frameworks and custon entity naming for Snips NLU, and allows receiving a custom dataset config as template.

### Overview

Slot filling chatbots are a type of chatbots that link short text sentences to actions and extract the action arguments from the sentence.

Recommended videos to watch:

[Slot-Filling in Conversations with Deep Learning](https://www.youtube.com/watch?v=Z1C1owUV0sI)

[Conversational AI: Building clever chatbots](https://www.youtube.com/watch?v=HV0bJMkzpO4)

Given a sentence, link an (action/intent) to it and map some of the sentece words to arguments/slots that are meaningful for the action. e.g.:

```
Sentence -> Hey Bot turn the lights off
Intent -> "lightChange"
Slots: { switch: "off"  }
```

You can test any of the readme examples at the [online editor](https://rodrigopivi.github.io/Chatito/) and test what it generates for each dataset format.

### Getting started

- `npm i chatito --save`
- create a definition file. e.g.: `trainClimateBot.chatito` with your DSL definitions.
- `npx chatito trainClimateBot.chatito --format=rasa` or `npx chatito trainClimateBot.chatito --format=snips`
- The full dataset set should be available at `trainClimateBot.json`

NOTE: The json file contains all the possible combination sentences. Each traning example is an object that contains sentence, action and arguments. You may want to shuffle and split the dataset for training/testing/validation, it's not a good practice to train the nlu models with the entire dataset corpus.

You can also use it programmatically:
```
const chatito = require("chatito");
const dataset = chatito.datasetFromString(dslDefinitionString);
```

### Command line tool

Chatito is an npm package, so you need [NodeJS 8.10.0 LTS](https://nodejs.org/es/) or higher with npm.

The package can be installed globaly (`npm i chatito -g`) or locally for each project (`npm i chatito --save`), once installed you can call it with `npx`.

```
npx chatito <pathToFile> --format=<format> --formatOptions=<formatOptions> --max=<max> --min=<min>
```

 - `<pathToFile>` path to the grammar file. e.g.: `lightsChange.chatito`
 - `<format>` can be `rasa` or `snips`
 - `<formatOptions>` Optional. Path to a `.json` file containing the initial format dataset template (you can pass custom options for each nlu dataset format here).
 - `<max>` Optional. A number that sets how many random exmamples go for training, if the dataset contains more, those examples go for testing dataset. If the dataset contains less examples , then there wont be testing data.
 - `<min>` Optional. The minimun number of training examples. If the dataset has less examples than this, then it will duplicate random examples until min.

Command line example:
```
npx chatito examples/spanishEventsConcierge/spanishEventsConcierge.chatito --format=snips  --formatOptions=examples/spanishEventsConcierge/snips.json --max=20 --min=10
```
## Chatito DSL

A Chatito domain specific language file should contain the '.chatito' extension, and is just a text file with the grammar definitions.

Important Note: The DSL enfroces the use of 4 space identation for nested sentences.

### Operators

Operators are the way to declare keywords with special behaviors. An operator is a token that starts with an operator symbol (`%` or `@` or `~`), followed by an opening squared bracket `[`, the operator name (`aphanumeric`, `space`, `:` and `_`) and a closing squared bracket `]`. e.g.: `%[someAction]`, `%[another:action]`, `@[argument argument]`, `~[11:11 AM]`

Note: Arguments allow a special alternative naming for entities. (only used for snips nlu dataset custom entities, read more at the argument definion).

When using operators inside a sentence, operators can be made optional by adding
a `?` symbol before the closing squared bracket. E.g.: `~[hi?]`

Here is the full list of operators:

#### Action (`%[` `]`)

The action operator is how to link a sentence with an actual bot command.
Each action is an entry point for the generator. Actions cannot be nested, but can contain other operators (arguments and aliases).
Think about it, as if each action maps to a function call. E.g.:

```
%[turnOnLights]
    turn on the lights
    lights on
    its too dark
    please lights on
```

#### Argument (`@[` `]`):

Encapsulates a set of keywords as possible values for an input variable.
Argument definitions can only include alias operators or words.

Important note: When an argument only defines an alias, like in this example @city > ~[newYork],
the argument value variations will map to the alias id.  (e.g.: all new york variations inside city, will return newYork as value).

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

NOTE (only for Snips datasets):

In order to support [Snips NLU built in entities](https://snips-nlu.readthedocs.io/en/latest/data_model.html#builtin-entities-and-resolution) and [custom language entities](https://github.com/snipsco/snips-nlu-ontology), like `snips/datetime` and `location`, you can use the`#` symbol at the argument name definition followed by the entity custom name. e.g.:

```
%[sampleGetWeather]
    will it be sunny in @[city] at @[weatherDate] ?
    what kind of weather should I expect @[weatherDate] in @[city] please
    tell me if it is going to rain @[weatherDate] in @[city]
    What is the weather in @[city] ?

@[weatherDate#snips/datetime]
    at the end of the day
    tomorrow morning
    this afternoon
    today

@[city#location]
    ~[los angeles]
    rio de janeiro
    tokyo
    london
    tel aviv
    paris

~[los angeles]
    los angeles
    la
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
    ~[greet?] ~[botName?] ~[please?] ~[find?] ~[restaurants?] ~[nearby] @[city]

~[greet]
    hey
    hi
    hello
    greetings

~[botName]
    Pia

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

@[city#location]
    ~[newYork]
    ~[sanFrancisco]
    ~[atlanta]

```

# Credits

- [nalgene](https://github.com/spro/nalgene) - Similar tool.
- [PEG.js](https://pegjs.org) - Simple and powerfull parser generator.
- [Rasa NLU](https://github.com/RasaHQ/rasa_nlu) - Framework for training NLU models.
- [Snips NLU](https://github.com/snipsco/snips-nlu) - Framework for training NLU models.

# Starter project

Checkout [Pia](https://rodrigopivi.github.io/pia_es/), a super simple (no dialog generation) starter kit based on chatito and rasa_nlu.

# Author

Rodrigo Pimentel
