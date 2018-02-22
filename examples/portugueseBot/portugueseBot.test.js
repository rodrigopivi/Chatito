const fs = require('fs');
const path = require('path');
const generator = require('../../core/datasetGenerator');

const getExampleFile = filename => path.resolve(__dirname, filename);

test('test dataset generation', () => {
    const fileContent = fs.readFileSync(getExampleFile("portugueseBot.chatito"), "utf8");
    const result = generator.datasetFromString(fileContent);
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
