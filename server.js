// server.js
const app = require("./config/app");

if(process.env.NODE_ENV == 'production') {
    module.exports = app;
}else{
    app.listen(process.env.PORT, () => {
        console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
}