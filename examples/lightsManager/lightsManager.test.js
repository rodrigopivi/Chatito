const fs = require('fs');
const path = require('path');
const generator = require('../../core/datasetGenerator');

const getExampleFile = filename => path.resolve(__dirname, filename);

test('test dataset generation', () => {
    const result = generator.datasetFromFile(getExampleFile("lightsManager.chatito"));
    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
});
