const express = require('express');
const bodyParser = require('body-parser');
const api = require('./api');
const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

app.listen(port, function () {
    console.log("Server is listening at port: " + port);
});

app.get('/', function (req, res) {
    res.send("hello world");
});

app.use('/api', api);
