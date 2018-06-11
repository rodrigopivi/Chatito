# Chatito

Chatito helps you generate dataset examples for training and validating chatbot models in a breeze using a simple DSL.

If you are building chatbots using commercial models, open source frameworks or writing your own natural language processing model, you need training examples. Chatito is here to help you.

This project contains the:
- [Online chatito IDE](https://rodrigopivi.github.io/Chatito/)
 - [Chatito DSL specification](https://github.com/rodrigopivi/Chatito/blob/master/spec.md)
- [DSL AST parser in pegjs format](https://github.com/rodrigopivi/Chatito/blob/master/parser/chatito.pegjs)
 - [Generator implemented in typescript + npm package](https://github.com/rodrigopivi/Chatito/tree/master/src)

### Chatito DSL specification
For the language specification and documentation, please refer to the [DSL spec document](https://github.com/rodrigopivi/Chatito/blob/master/spec.md).

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
npx chatito <pathToFile> --format=<format> --formatOptions=<formatOptions> --max=<max> --min=<min>
```

 - `<pathToFile>` path to the grammar file. e.g.: lightsChange.chatito
 - `<format>` Optional. `default`, `rasa` or `snips`
 - `<formatOptions>` Optional. Path to a .json file that each adapter optionally can use

### Donate
Designing and maintaining chatito takes time and effort, if it was usefull for you, please consider making a donation and share the abundance! :)

### Author and maintainer
Rodrigo Pimentel