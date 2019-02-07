# Chatito

[![npm version](https://badge.fury.io/js/chatito.svg)](https://www.npmjs.com/package/chatito)
[![CircleCI branch](
https://img.shields.io/circleci/project/github/RedSparr0w/node-csgo-parser/master.svg
)](https://circleci.com/gh/rodrigopivi/workflows/Chatito)
[![npm](https://img.shields.io/npm/dm/chatito.svg)](https://www.npmjs.com/package/chatito)
[![License](https://img.shields.io/github/license/rodrigopivi/Chatito.svg)](https://www.npmjs.com/package/chatito)


[![Alt text](screenshot.jpg?raw=true "Screenshot of online IDE")](https://rodrigopivi.github.io/Chatito/)

[Try the online IDE!](https://rodrigopivi.github.io/Chatito/)

## Donate

[![Alt text](https://c5.patreon.com/external/logo/become_a_patron_button.png "Become a Patron!")](https://www.patreon.com/bePatron?u=13643440)

Designing and maintaining chatito takes time and effort, if it was usefull for you, please consider making a donation and share the abundance! :)

## Overview
Chatito helps you generate datasets for training and validating chatbot models using a minimalistic DSL.

If you are building chatbots using commercial models, open source frameworks or writing your own natural language processing model, you need training examples. Chatito is here to help you.

This project contains the:
- [Online chatito IDE](https://rodrigopivi.github.io/Chatito/)
 - [Chatito DSL specification](https://github.com/rodrigopivi/Chatito/blob/master/spec.md)
- [DSL AST parser in pegjs format](https://github.com/rodrigopivi/Chatito/blob/master/parser/chatito.pegjs)
 - [Generator implemented in typescript + npm package](https://github.com/rodrigopivi/Chatito/tree/master/src)

### Chatito language
For the full language specification and documentation, please refer to the [DSL spec document](https://github.com/rodrigopivi/Chatito/blob/master/spec.md).

### Adapters
The language is independent from the generated output format and because each model can receive different parameters and settings, there are 3 data format adapters provided. This section describes the adapters, their specific behaviors and use cases:

#### Default format
Use the default format if you plan to train a custom model or if you are writting a custom adapter. This is the most flexible format because you can annotate `Slots` and `Intents` with custom entity arguments, and they all will be present at the generated output, so for example, you could also include dialog/response generation logic with the dsl. E.g.:

```
%[some intent]('context': 'some annotation')
    @[some slot] ~[please?]

@[some slot]('required': 'true', 'type': 'some type')
    ~[some alias here]

```

Custom entities like 'context', 'required' and 'type' will be available at the output so you can handle this custom arguments as you want.

#### [Rasa NLU](https://rasa.com/docs/nlu/)
[Rasa NLU](https://rasa.com/docs/nlu/) is a great open source framework for training NLU models.
One particular behavior of the Rasa adapter is that when a slot definition sentence only contains one alias, the generated rasa dataset will map the alias as a synonym. e.g.:

```
%[some intent]('training': '1')
    @[some slot]

@[some slot]
    ~[some slot synonyms]

~[some slot synonyms]
    synonym 1
    synonym 2
```

In this example, the generated rasa dataset will contain the `entity_synonyms` of `synonym 1` and `synonym 2` mapping to `some slot synonyms`.

#### [Snips NLU](https://snips-nlu.readthedocs.io/en/latest/)
[Snips NLU](https://snips-nlu.readthedocs.io/en/latest/) is another great open source framework for NLU. One particular behavior of the Snips adapter is that you can define entity types for the slots. e.g.:

```
%[date search]('training':'1')
   for @[date]

@[date]('entity': 'snips/datetime')
    ~[today]
    ~[tomorrow]
```

In the previous example, all `@[date]` values will be taged with the `snips/datetime` entity tag.

### NPM package

Chatito is supports nodejs `v8.11.2 LTS` or higher.

Install it globally:
```
npm i chatito -g
```
Or locally:
```
npm i chatito --save
````

Then create a definition file (e.g.: `trainClimateBot.chatito`) with your code.

Run the npm generator:

```
npx chatito trainClimateBot.chatito
```

The generated dataset should be available next to your definition file.

Here is the full npm generator options:
```
npx chatito <pathToFileOrDirectory> --format=<format> --formatOptions=<formatOptions> --outputPath=<outputPath>
```

 - `<pathToFileOrDirectory>` path to a `.chatito` file or a directory that contains chatito files. If it is a directory, will search recursively for all `*.chatito` files inside and use them to generate the dataset. e.g.: `lightsChange.chatito` or `./chatitoFilesFolder`
 - `<format>` Optional. `default`, `rasa` or `snips`
 - `<formatOptions>` Optional. Path to a .json file that each adapter optionally can use
 - `<outputPath>` Optional. The directory where to save the generated datasets. Uses the current directory as default.
- `<trainingFileName>` Optional. The name of the generated training dataset file. Do not forget to add a .json extension at the end. Uses `<format>`_dataset_training.json as default file name.
- `<testingFileName>` Optional. The name of the generated testing dataset file. Do not forget to add a .json extension at the end. Uses `<format>`_dataset_testing.json as default file name.

### Author and maintainer
Rodrigo Pimentel
