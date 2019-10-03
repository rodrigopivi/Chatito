// list of charaters that act as word splitters (includes space)
const WORD_SEPARATORS_REGEXP = /([\ \.\,\%\*\-\=\+\;\|\`\~\!])/g;

export const splitSentenceToWords = (sentence: string): string[] => {
    return sentence
        .split(WORD_SEPARATORS_REGEXP)
        .map(w => w.trim())
        .filter(w => !!w);
};
