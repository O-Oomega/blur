const express = require("express");
const c = require('child_process');


const app = express();
app.use(express.static(__dirname));

const port = 3000;

app.get("/", (res, req) => {
    req.sendFile("/index.html");
});

app.listen(port, () => {
    c.exec(`start http://localhost:${port}`);
    console.log(`listening port${port}`);
});