const fs = require("fs");

setInterval(() => {
  fs.appendFileSync("logs/app.log", `App running at ${new Date()}\n`);
}, 5000);