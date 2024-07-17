const mongoose = require('mongoose');

try {
    var Url = process.env.MONGODB_URL;
    var connection = mongoose.connect(Url);
    console.log(`Your DB is connected Successfully..!`);

} catch (error) {
    console.log("Something Wrong" + error)
}


module.exports = connection;