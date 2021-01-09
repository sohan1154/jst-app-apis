const { until } = require('async');
var moment = require('moment'); // require

exports.vewRequest = (req, res, next) => {
    console.log('###################### REQUEST ############################')
    req.params = (typeof req.params !== 'undefined') ? req.params : {};
    console.warn('PARAMS=>', req.params);
    req.body = (typeof req.body !== 'undefined') ? req.body : {};
    console.warn('BODY=>', req.body);

    return next();
}

exports.sendResponse = (req, res, data) => {

    // close database connection
    req.connection.end();

    console.log('###################### SUCCESS RESPONSE ############################')
    console.log(data);

    res.status(200);
    res.json(data);
}

exports.sendErrorResponse = (req, res, err) => {

    console.error(err);

    let message = '';

    if (typeof err.code !== 'undefined') {

        console.log('Code:', err.code);
        console.log('Key:', err.key);
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                // message = 'Username is already taken, Please choose another and try again.';
                message = err.sqlMessage;
                break;
            default:
                message = err.message;
        }
    }
    else if (typeof err.message !== 'undefined') {
        message = err.message;
    }
    else {
        message = err;
    }

    let data = {
        status: false,
        message: message
    };

    // close database connection
    req.connection.end();

    console.log('###################### ERROR RESPONSE ############################')
    console.log(data);

    res.status(203);
    res.json(data);
}

exports.generatePassword = (plaintextPassword, callback) => {
    let bcrypt = require('bcrypt');
    let saltRounds = 10;

    bcrypt.hash(plaintextPassword, saltRounds, function (err, hash) {
        if (err) {
            callback(err);
        } else {
            callback(null, hash);
        }
    });
}

exports.matchPassword = (plaintextPassword, hashPassword, callback) => {
    let bcrypt = require('bcrypt');

    bcrypt.compare(plaintextPassword, hashPassword, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

exports.generateToken = (text) => {
    let crypto = require('crypto');
    let algorithm = 'aes-256-cbc';
    let key = crypto.randomBytes(32);
    let iv = crypto.randomBytes(16);

    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

exports.getCurrentFormatedDate = (format = "YYYY-MM-DD HH:mm:ss") => {
    return moment().format(format);
}

exports.getFormatedDate = (date, format = "YYYY-MM-DD HH:mm:ss") => {
    return moment(date).format(format);
}

exports.addDate = (date, amount, unit, format = "YYYY-MM-DD HH:mm:ss") => {
    return moment(date).add(amount, unit).format(format);
}

exports.subtractDate = (date, amount, unit, format = "YYYY-MM-DD HH:mm:ss") => {
    return moment(date).subtract(amount, unit).format(format);
}

exports.getStatus = (curretStatus) => {
    let all = ['In-active', 'Active'];

    return all[curretStatus];
}

exports.getCategory = (curretStatus) => {
    let all = ['Normal', 'Featured'];

    if(curretStatus)
        return all[curretStatus];
    else 
        return 'NULL';
}
