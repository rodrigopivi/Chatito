const express = require('express');

const app = express();

app.use(express.static('./public'));

app.use('/editor/chatito', express.static('./public'));

app.listen(8324);
