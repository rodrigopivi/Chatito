# Chatito Spec

## 1 -  Overview

Chatito is a domain specific language designed to simplify the process of creating, extending and maintaining
datasets for training natural language processing (NLP) models for text classification, named entity recognition, slot filling or equivalent tasks.

Chatito design principles:

- Simplicity: should be understandable by someone looking at it for the first time

- Speed: generate samples by pulling them from a cloud of probabilities on demand

- Practicality: this tool is meant to help people who use it, the design should be guided by the community needs

Following those principles this is an example of the language and its generated output:

```
%[greet]('training': '2')
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
```

This code could produce a maximum of 18 examples, the output format is independent from the DSL language,
although it is recommended to use a newline delimited format to just stream results to a file, a format like ndjson is recommended over plain json and using the `training` entity argument to limit the dataset size is recommended for large dataset where there should be no need to generate all variations.

That said, the earlier DSL code generates two training examples for the `greet` intent. Here is the `Newline Delimited JSON` (ndjson.org) examples generated from the previous code:

```
[{"type":"Text","value":"hi how is it going"}]
[{"type":"Text","value":"hey "},{"type":"Slot","value":"Bob","slot":"name"}]
```

Given this principles in mind, this document is the specification of such language.

## 2 - Language

A chatito file, is a document containing the grammar definitions. Because of the different encoding formats and range of
non printable characters, this are the requirements of document source text and some terminology:

- Format: UTF-8
- Valid characters: only the printable basic ASCII range
- White space: allows white space character, not horizontal tab
- Line end: new line, carriage return, carriage return + new line (supporting non windows and windows)
- Indentation: should use a 4 space character to define the scope of entities
- Entities: Special keywords with special behaviors used to declare the sentence combinations
- Sentences: 4 space indented text lines after an entity definition
- Definition order: It does not matter if an entity is defined after it is being referenced
- Comments: Lines of text starting with '//' (no spaces before)
- Entity arguments: Optional key-values that can be declared at intents and slot definitions

### 2.1 - Entities
Entities are the way to define keywords that wrap sentence variations and attach some properties to them.
There are three types of entities: `intent`, `slot` and `alias`.

#### 2.1.1 - Intent

The intent entity is defined by the `%[` symbols at the start of a line, following by the entity name and `]`.

Intent names should be at least 1 character long and can contain any characters except `]`, `line end` and `?`
. e.g.: (%[intentName], %[intent_name], %[intent name])

Repeating intent name definitions should not be allowed.

Each intent defined in a file is an entry point for the generation, the intent is the classification tag that is
added to the sentences defined inside. e.g.:

```
%[greet]
    hello
    hi
```

The previous example will generate all possible unique examples for greet (in this case 2 utterances). But there are cases where there is no need to generate all utterances, or when we want to attach some extra properties to the genreated utterance, that is where entity arguments can help.

Entity arguments are comma separated key-values declared with the entity definition inside parenthesis. Each entity argument is composed of a key, followed by the `:` symbol and the value. The argument key or value are just strings wrapped with single or double quotes, optional spaces between the parenthesis and comma are allowed, the format is similar to ndjson but only for string values.

By default, intent definitions can expect the `training` and `testing` argument keys, when defined, are used to declare the maximum number of unique examples to generate for the given intent, and splitting them in two datasets, the training dataset is to be used to train the NLU model, and the testing dataset should be used to evaluate the accuracy of the model with examples it never trained with. Creating a testing dataset is not required, but it is important to be aware of the accuracy of your model to detect overfitting and compare against previous accuracies. The generator will first populate the training dataset, then testing dataset until reaching the sum of both values, each value must be `>= 1`. e.g.:

```
%[greet]('training: '2', 'testing': '1')
    hello
    hi
    hola
    salute
```

In this example, the greet intent could generate a maximum of 4 examples, but the declaration only requests 3. The training dataset will contain 2 utterances for greet intent and the testing dataset 1. Other entity arguments are ignored by default and their functionality depend on the dataset generator/adapter, this means that each adapter may use the other entity arguments differently in its own context (e.g.: Rasa/Snips adapter may expect different entity arguments).

Nesting entities: Sentences defined inside an intent can refer to slots and alias entities.

#### 2.1.2 - Slot
The slot entity is defined by the `@[` symbols at the start of a line, following by the name of the slot and `]`.

Slot names should be at least 1 character long and can contain any characters except `]`, `line end`, `?` and `#` (as # is used for variations).
. e.g.: (@[slotName], %[slot_name], %[slot name])

Repeating slot name definitions should not be allowed.

From the output perspective, a slot is the tag that is added the relevant words in a generated sentence. e.g.:

```
%[greet]
    ~[hi] @[name?]

~[hi]
    hi
    hey

@[name]
    Janis
    Bob
```

Slot entities referenced within sentences, can have `?` symbol at the end of the reference name. (e.g.: @[name?]).
In that context, the `?` symbol means that the slot combination is optional, and could be omitted at generation.

Slots provide a particular property at their definitions called variations.

- Variations: There are cases where a slot combination only makes sense in a given context, variations allow to map one slot to different sentences in different contexts. e.g.:

```
%[ask_for_delivery]
    my parcel should be delivered in @[delivery_time#time_in_hours]
    my parcel should be delivered @[delivery_time#relative_time]

@[delivery_time#time_in_hours]
    3 days
    5 hours

@[delivery_time#relative_time]
    as fast as possible
    quickly
```

In this example, both combinations map to the `delivery_time` slot, but 
the generated sentences only generate their variations contexts where they make sense.

Slot definitions can have entity arguments too but there are no default argument keys. Entity arguments are ignored by default and their functionality depends on the dataset adapter, this means that each adapter may use the entity arguments differently in its own context (e.g.: Rasa/Snips adapter may expect different entity arguments like for pre-build date parsing, or text value aliases mappings).

Nesting entities: Sentences defined inside a slot can only reference alias entities.

#### 2.1.3 - Alias
The alias entity is defined by the `~[` symbols at the start of a line, following by the name of the alias and `]`.
Alias are just variations of a word and does not generate any tag. By default if an alias is referenced but not defined (like in the next example for `how are you`, it just uses the alias key name, this is usefull for making a word optional but not having to add the extra lines of code defining a new alias. e.g.:

```
%[greet]
    ~[hi] ~[how are you?]

~[hi]
    hi
    hey
```

Same as with slots, alias references can contain a `?` symbol at the end of the reference name. (e.g.: ~[hi?]).
In that context, the `?` symbol means that the alias combination is optional, and could be omitted at generation.

When an alias is referenced inside a slot definition, and it is the only token of the slot sentence, by default the generator will tag the generated alias value as a `synonym` of the alias key name.

Alias definitions are not allowed to declare entity arguments.

Nesting entities: Sentences defined inside aliases can reference other aliases but preventing recursive loops

## 3 - Data Generation

The entry points for the data generation are the intent definitions, for each intent definition:
- If the intent does not specify the 'training' or 'testing' arguments, generate all possible unique combinations and add them to the training dataset.
- Generate unique combinations for the training dataset until the 'training' argument number is reached, then until 'testing' argument number is reached for the testing dataset.

Recursive loop references should be prevented.
