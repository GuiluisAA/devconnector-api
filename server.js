const app = require('./config/express')();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`\nServer running on port ${port}`));