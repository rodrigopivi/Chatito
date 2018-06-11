# Chatito Spec

## 1 -  Overview

Chatito is a domain specific language designed to simplify the process of creating, extending and maintaining
datasets for training natural language processing (NLP) models for text classification, named entity recognition, slot filling or equivalent tasks.

Chatito design principles:

- Simplicity: should be understandable by someone looking at it for the first time

- Speed: be able to generate any number of samples by pulling them from a  probability cloud on demand

- Practicality: this tool is meant to help people who use it, the design should be guided by the community needs

Following those principles this is an example of the language and its generated output:

```
%[greet]
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

This code could produce a maximun of 18 examples, the output format is independent from the DSL language,
although it is recommended to use a newline delimited format to just stream results to a file, a format like ndjson is recommended over plain json.
That said, here is an example of two `Newline Delimited JSON` (ndjson.org) examples generated from the previous code:

```
[{"type":"Text","value":"hi how is it going"}]
[{"type":"Text","value":"hey "},{"type":"Slot","value":"Bob","slot":"name"}]
```

Given this principles in mind, this document is the specification of such language.

## 2 - Language

A chatito file, is a document containing the grammar definitions. Because of the different encoding formats and range of
non printable characters, this are the requirements of document source text:

- Format: UTF-8
- Valid characters: only the printable basic ASCII range
- White space: allows white space character, not horizontal tab
- Line end: new line, carriage return, carriage return + new line (supporting non windows and windows)
- Indentation: should use a 4 space character to define the scope of entities
- Entities: Special keywords with special behaviors used to declare the sentence combinations
- Sentences: 4 space indented text lines after an entity definition
- Definition order: It does not matter if an entity is defined after it is being referenced

### 2.1 - Entities
Entities are the way to define keywords that wrap sentence variations and attach some properties to them.
There are three types of entities: intent, slot and alias.

#### 2.1.1 - Intent

The intent entity is defined by the `%[` symbols at the start of a line, following by the entity name and `]`.

Entity names should be at least 1 character long and can contain any characters except `]`, `line end` and `?`
. e.g.: (%[intentName], %[intent_name], %[intent name])

Repeating intent name definitions should not be allowed.

Each intent defined in a file is an entry point for the generation, the intent is the classification tag that is
added to each of the sentences defined inside. e.g.:

```
%[greet]
    hello
    hi
```

In cases where an intent can produce more samples than needed, intents allow declaring the max number of
intents that should be generated at their definition inside parenthesis. e.g.:

```
%[greet](1)
    hello
    hi
```

This will only generate one sentence for `greet` intent, the number must be an integer greater than zero.

Nesting entities: Sentences defined inside an intent can reference slots and alias entities.

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

Nesting entities: Sentences defined inside an slot can only reference alias entities.

#### 2.1.3 - Alias
The alias entity is defined by the `~[` symbols at the start of a line, following by the name of the alias and `]`.
An alias is just a variation of a word and does not generate any tag. e.g.:

```
%[greet]
    ~[hi] ~[hi?]

~[hi]
    hi
    hey
```

Same as with slots, an alias reference can contain a `?` symbol at the end of the reference name. (e.g.: ~[hi?]).
In that context, the `?` symbol means that the alias combination is optional, and could be omitted at generation.

Nesting entities: Sentences defined inside an alias can reference other aliases but preventing recursive loops

## 3 - Data Generation

The entry points for the data generation are the intent definitions, for each intent definition:

- Generate all possible combinations if the intent does not specify the maximum number of sentences to generate.

- Else randomly generate one sentence at a time from the cloud of combination probabilities avoiding repetitions until maximum.

Recursive loop references should be prevented.
