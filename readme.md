# Chatito

[![npm version](https://badge.fury.io/js/chatito.svg)](https://www.npmjs.com/package/chatito)
[![CircleCI branch](
https://img.shields.io/circleci/project/github/RedSparr0w/node-csgo-parser/master.svg
)](https://circleci.com/gh/rodrigopivi/workflows/Chatito)
[![npm](https://img.shields.io/npm/dm/chatito.svg)](https://www.npmjs.com/package/chatito)
[![License](https://img.shields.io/github/license/rodrigopivi/Chatito.svg)](https://www.npmjs.com/package/chatito)


[![Alt text](screenshot.jpg?raw=true "Screenshot of online IDE")](https://rodrigopivi.github.io/Chatito/)

[Try the online IDE!](https://rodrigopivi.github.io/Chatito/)


## Overview
Chatito helps you generate datasets for training and validating chatbot models using a simple DSL.

If you are building chatbots using commercial models, open source frameworks or writing your own natural language processing model, you need training and testing examples. Chatito is here to help you.

This project contains the:
- [Online chatito IDE](https://rodrigopivi.github.io/Chatito/)
- [Chatito DSL specification](https://github.com/rodrigopivi/Chatito/blob/master/spec.md)
- [DSL AST parser in pegjs format](https://github.com/rodrigopivi/Chatito/blob/master/parser/chatito.pegjs)
- [Generator implemented in typescript + npm package](https://github.com/rodrigopivi/Chatito/tree/master/src)

### Chatito language
For the full language specification and documentation, please refer to the [DSL spec document](https://github.com/rodrigopivi/Chatito/blob/master/spec.md).

### Adapters
The language is independent from the generated output format and because each model can receive different parameters and settings, this are the currently implemented data formats, if your provider is not listed, at the Tools and resources section there is more information on how to support more formats.

NOTE: Samples are not shuffled between intents for easier review and because some adapters stream samples directly to the file.

#### Default format
Use the default format if you plan to train a custom model or if you are writing a custom adapter. This is the most flexible format because you can annotate `Slots` and `Intents` with custom entity arguments, and they all will be present at the generated output, so for example, you could also include dialog/response generation logic with the DSL. E.g.:

```
%[some intent]('context': 'some annotation')
    @[some slot] ~[please?]

@[some slot]('required': 'true', 'type': 'some type')
    ~[some alias here]

```

Custom entities like 'context', 'required' and 'type' will be available at the output so you can handle this custom arguments as you want.

#### [Rasa NLU](https://rasa.com/docs/nlu/)
[Rasa NLU](https://rasa.com/docs/nlu/) is a great open source framework for training NLU models.
One particular behavior of the Rasa adapter is that when a slot definition sentence only contains one alias, and that alias defines the 'synonym' argument with 'true', the generated Rasa dataset will map the alias as a synonym. e.g.:

```
%[some intent]('training': '1')
    @[some slot]

@[some slot]
    ~[some slot synonyms]

~[some slot synonyms]('synonym': 'true')
    synonym 1
    synonym 2
```

In this example, the generated Rasa dataset will contain the `entity_synonyms` of `synonym 1` and `synonym 2` mapping to `some slot synonyms`.

#### [Flair](https://github.com/zalandoresearch/flair)
[Flair](https://github.com/zalandoresearch/flair) A very simple framework for state-of-the-art NLP. Developed by Zalando Research. It provides state of the art (GPT, BERT, ELMo, etc...) pre trained models and embeddings for many languages that work out of the box. This adapter supports the `text classification` dataset in FastText format and the `named entity recognition` dataset in two column [BIO](https://en.wikipedia.org/wiki/Inside%E2%80%93outside%E2%80%93beginning_(tagging)) annotated words, as documented at [flair corpus documentation](https://github.com/zalandoresearch/flair/blob/master/resources/docs/TUTORIAL_6_CORPUS.md). This two data formats are very common and with many other providers or models.

The NER dataset requires a word tokenization processing that is currently done using [wink-tokenizer](https://github.com/winkjs/wink-tokenizer) npm package. Extending the adapter to add PoS tagging can be explored in the future, but it's not implemented.

NOTE: Flair adapter is only available for the NodeJS NPM CLI package, not for the IDE.

#### [LUIS](https://www.luis.ai/)
[LUIS](https://www.luis.ai/) is part of Microsoft's Cognitive services. Chatito supports training a LUIS NLU model through its [batch add labeled utterances endpoint](https://westus.dev.cognitive.microsoft.com/docs/services/5890b47c39e2bb17b84a55ff/operations/5890b47c39e2bb052c5b9c09), and its [batch testing api](https://docs.microsoft.com/en-us/azure/cognitive-services/LUIS/luis-how-to-batch-test).

To train a LUIS model, you will need to post the utterance in batches to the relevant API for training or testing.

Reference issue: [#61](https://github.com/rodrigopivi/Chatito/issues/61)

#### [Snips NLU](https://snips-nlu.readthedocs.io/en/latest/)
[Snips NLU](https://snips-nlu.readthedocs.io/en/latest/) is another great open source framework for NLU. One particular behavior of the Snips adapter is that you can define entity types for the slots. e.g.:

```
%[date search]('training':'1')
   for @[date]

@[date]('entity': 'snips/datetime')
    ~[today]
    ~[tomorrow]
```

In the previous example, all `@[date]` values will be tagged with the `snips/datetime` entity tag.

### NPM package

Chatito supports Node.js `v8.11.2 LTS` or higher.

Install it with yarn or npm:
```
npm i chatito --save
```

Then create a definition file (e.g.: `trainClimateBot.chatito`) with your code.

Run the npm generator:

```
npx chatito trainClimateBot.chatito
```

The generated dataset should be available next to your definition file.

Here is the full npm generator options:
```
npx chatito <pathToFileOrDirectory> --format=<format> --formatOptions=<formatOptions> --outputPath=<outputPath> --trainingFileName=<trainingFileName> --testingFileName=<testingFileName>
```

 - `<pathToFileOrDirectory>` path to a `.chatito` file or a directory that contains chatito files. If it is a directory, will search recursively for all `*.chatito` files inside and use them to generate the dataset. e.g.: `lightsChange.chatito` or `./chatitoFilesFolder`
 - `<format>` Optional. `default`, `rasa`, `luis`, `flair` or `snips`.
 - `<formatOptions>` Optional. Path to a .json file that each adapter optionally can use
 - `<outputPath>` Optional. The directory where to save the generated datasets. Uses the current directory as default.
- `<trainingFileName>` Optional. The name of the generated training dataset file. Do not forget to add a .json extension at the end. Uses `<format>`_dataset_training.json as default file name.
- `<testingFileName>` Optional. The name of the generated testing dataset file. Do not forget to add a .json extension at the end. Uses `<format>`_dataset_testing.json as default file name.

### Notes to prevent overfitting

[Overfitting](https://en.wikipedia.org/wiki/Overfitting) is a problem that can be prevented if we use Chatito correctly. The idea behind this tool, is to have an intersection between data augmentation and a probabilistic description of possible sentences combinations. It is not intended to generate deterministic datasets, you should avoid generating all possible combinations.

### Tools and resources

- [Visual Studio Code syntax highlighting plugin](https://marketplace.visualstudio.com/items?itemName=nimfin.chatito) Thanks to [Yuri Golobokov](https://github.com/nimf) for his [work on this](https://github.com/nimf/chatito-vscode).

- [AI Blueprints: How to build and deploy AI business projects](https://books.google.com.pe/books?id=sR2CDwAAQBAJ) implements practical full chatbot examples using chatito at chapter 7.

- [3 steps to convert chatbot training data between different NLP Providers](https://medium.com/@benoit.alvarez/3-steps-to-convert-chatbot-training-data-between-different-nlp-providers-fa235f67617c) details a simple way to convert the data format to non implemented adapters. You can use a generated dataset with providers like DialogFlow, Wit.ai and Watson.

- [Aida-nlp](https://github.com/rodrigopivi/aida) is a tiny experimental NLP deep learning library for text classification and NER. Built with Tensorflow.js, Keras and Chatito. Implemented in JS and Python.

### Author and maintainer
Rodrigo Pimentel
