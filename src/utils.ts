import { IChatitoEntityAST, IEntities, ISingleSentence } from './types';

//  Durstenfeld shuffle, a computer-optimized version of Fisher-Yates:
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffle = <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

export const validateAndPushToStack = (entity: IChatitoEntityAST, entitiesStack: IChatitoEntityAST[]) => {
    let numberOfSlotsInStack = 0;
    const found = entitiesStack.find(et => {
        if (et.type === 'SlotDefinition') {
            numberOfSlotsInStack++;
        }
        return et.key === entity.key && et.type === entity.type;
    });
    if (found) {
        const last = entitiesStack.pop() || found;
        throw new Error(`Invalid nesting of entity: '${entity.key}' inside entity '${last.key}'. Infinite loop prevented.`);
    }
    if (numberOfSlotsInStack !== 0 && entity.type === 'SlotDefinition') {
        const last = entitiesStack.pop() || entity;
        throw new Error(`Invalid nesting of slot: '${entity.key}' inside '${last.key}'. An slot can't reference other slot.`);
    }
    entitiesStack.push(entity);
    return entitiesStack;
};

export const maxSentencesForSentence = (entities: IEntities, stack?: IChatitoEntityAST[]) => (sentence: ISingleSentence) => {
    const sr = sentence.sentence.reduce((accumulator, t) => {
        let acc = accumulator;
        if (t.type === 'Slot' || t.type === 'Alias') {
            const def = entities[t.type];
            const innerEntityKey = t.variation ? `${t.value}#${t.variation}` : t.value;
            if (!def[innerEntityKey]) {
                if (t.type === 'Alias') {
                    def[innerEntityKey] = {
                        inner: [
                            {
                                sentence: [{ value: innerEntityKey, type: 'Text' }],
                                probability: null
                            }
                        ],
                        key: t.value,
                        type: 'AliasDefinition'
                    };
                } else {
                    throw new Error(`${t.type} not defined: ${innerEntityKey}`);
                }
            }
            const s = stack ? stack.slice(0) : [];
            let innerEntityVariations = maxSentencesForEntity(def[innerEntityKey], entities, s);
            if (t.opt) {
                innerEntityVariations++;
            }
            acc = acc * innerEntityVariations;
        }
        return acc;
    }, 1);
    return sr;
};

export const maxSentencesForEntity = (ed: IChatitoEntityAST, entities: IEntities, stack: IChatitoEntityAST[] = []): number => {
    validateAndPushToStack(ed, stack);
    return ed.inner.map(maxSentencesForSentence(entities, stack)).reduce((acc, val) => acc + val);
};

// Deep merge objects
// https://gist.github.com/Salakar/1d7137de9cb8b704e48a
const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
const isArray = (item: any) => {
    if (typeof Array.isArray === 'undefined') {
        return Object.prototype.toString.call(item) === '[object Array]';
    } else {
        return Array.isArray(item);
    }
};
export const mergeDeep = <T>(target: any, source: any): T => {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isArray(source[key])) {
                if (target[key] === undefined) {
                    target[key] = [];
                }
                target[key] = target[key].concat(source[key]);
            } else if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
};
