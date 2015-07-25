//require('dotenv').load();
var defaults = {
    "IMAGE_DIRECTORY": __dirname + '/image',
    "MONGOLAB_URI": "mongodb://localhost/dukeexchange",
    "SESSION_SECRET": "",
    "GOOGLE_CLIENT_ID": "",
    "GOOGLE_CLIENT_SECRET": "",
    "ROOT_URL": "",
    "SENDGRID_USER": "",
    "SENDGRID_KEY": "",
    "PORT": 5000
};
//ensure that process.env has all values in defaults, but prefer the process.env value
for (var key in defaults) {
    process.env[key] = process.env[key] || defaults[key];
}
//now processes can use either process.env or config
module.exports = process.env;
