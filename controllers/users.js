
exports.login = function (req, res, next) {

    try {
        var params = req.body;

        let query = `SELECT * FROM users WHERE email='${params.email}' AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results) {
            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Invalid email.');
            }
            else if (!results[0].status) {
                helper.sendErrorResponse(req, res, 'Your account in-active, please contact to administrator.');
            }
            else {

                let rowInfo = results[0];

                helper.matchPassword(params.password, rowInfo.password, (err, status) => {
                    if (err) {
                        helper.sendErrorResponse(req, res, err);
                    }
                    else if (!status) {
                        helper.sendErrorResponse(req, res, 'Invalid password.');
                    }
                    else {
                        let data = {
                            id: rowInfo.id,
                            role: rowInfo.role,
                            name: rowInfo.name,
                            email: rowInfo.email,
                            mobile: rowInfo.mobile,
                        }

                        manageToken(req, params, rowInfo, (err, token) => {

                            if (err) {
                                helper.sendErrorResponse(req, res, err);
                            } else {
                                let result = {
                                    status: true,
                                    message: 'Logged in successfully.',
                                    token: token,
                                    data: data,
                                }
                                helper.sendResponse(req, res, result);
                            }
                        });
                    }
                })
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.register_email = function (req, res, next) {

    let params = req.body;
    
    let internalData = {isNewAccount: false};

    async.series([
        function (do_callback) {

            // check email format
            if (CustomValidators.isEmpty(params.email)) {
                do_callback('Email can\'t be empty.');
            }
            else if (!CustomValidators.isEmail(params.email)) {
                do_callback('Please enter a valid email.');
            }
            else {
                do_callback();
            }
        },
        function (do_callback) {

            // check emalil 
            let query = `SELECT * FROM users WHERE email='${params.email}'`;
            req.connection.query(query, function (err, results) {
                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    internalData.userInfo = null;
                    do_callback();
                }
                else if (!results[0].status) {
                    do_callback('Your account is in-active please contact to administrator for more information.');
                }
                else if (results[0].deleted_at) {
                    do_callback('Your account is deleted please contact to administrator for restore.');
                }
                else {
                    internalData.userInfo = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // register if not found
            if(internalData.userInfo) {

                do_callback();
            } else {

                let query = `INSERT INTO users SET email='${params.email}', created_at=NOW(), updated_at=NOW()`;

                req.connection.query(query, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {
                        internalData.isNewAccount = true;
                        internalData.userInfo = {id: results.insertId, is_email_verified: 0};
                        do_callback();
                    }
                });
            }
        },
        function (do_callback) {

            // generate user settings if not found
            if(internalData.isNewAccount) {

                let query = `INSERT INTO user_settings SET user_id=${internalData.userInfo.id}, created_at=NOW(), updated_at=NOW()`;
                req.connection.query(query, function (err, results) {
                    if (err) {
                        do_callback(err);
                    } else {
                        do_callback();
                    }
                });
            } else {
                
                do_callback();
            }
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Email added successfully.',
                is_email_verified: internalData.userInfo.is_email_verified,
                otp: 1234,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.verify_email = function (req, res, next) {

    let params = req.body;
    
    let internalData = {};

    async.series([
        function (do_callback) {

            // verify otp
            if(params.otp=='1234') {

                do_callback();
            } else {
    
                do_callback('You have entred an invalid OTP.');
            }
        },
        function (do_callback) {

            // update email verification status into database  
            let query = `UPDATE users SET is_email_verified=1 WHERE email='${params.email}'`;
            req.connection.query(query, function (err, results) {
                if (err) {
                    do_callback(err);
                } else {
                    do_callback();
                }
            });
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Email verified successfully.',
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.attach_mobile = function (req, res, next) {

    let params = req.body;
    
    let internalData = {};

    async.series([
        function (do_callback) {
            
            // check mobile format
            if (typeof params.mobile === 'undefined') {
                do_callback('Please provide a mobile number.');
            }
            else if (CustomValidators.isEmpty(params.mobile)) {
                do_callback('Mobile can\'t be empty.');
            }
            // else if (!CustomValidators.isPhoneNumber(params.mobile)) {
            //     do_callback('Please enter a valid mobile number.');
            // }
            else {
                do_callback();
            }
        },
        function (do_callback) {

            // check mobile with email  
            let query = `SELECT * FROM users WHERE email='${params.email}'`;
            req.connection.query(query, function (err, results) {
                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    internalData.userInfo = null;
                    do_callback();
                }
                else if (!results[0].status) {
                    do_callback('Your account is in-active please contact to administrator for more information.');
                }
                else if (results[0].deleted_at) {
                    do_callback('Your account is deleted please contact to administrator for restore.');
                }
                else {
                    internalData.userInfo = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // update if not found 
            if(internalData.userInfo.mobile == params.mobile) {

                do_callback();
            } else {

                let query = `UPDATE users SET mobile='${params.mobile}', updated_at=NOW() WHERE email='${params.email}'`;

                req.connection.query(query, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {
                        internalData.userInfo = results;
                        do_callback();
                    }
                });
            }
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Login OTP sent successfully.',
                otp: '1234',
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.verify_mobile = function (req, res, next) {

    let params = req.body;
    
    let internalData = {};

    async.series([
        function (do_callback) {

            // check mobile with email  
            let query = `SELECT * FROM users WHERE email='${params.email}' AND mobile='${params.mobile}'`;
            req.connection.query(query, function (err, results) {
                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('You have passed invalid informarion.');
                }
                else if (!results[0].is_email_verified) {
                    do_callback('Your email is not verified.');
                }
                else if (!results[0].status) {
                    do_callback('Your account is in-active please contact to administrator for more information.');
                }
                else if (results[0].deleted_at) {
                    do_callback('Your account is deleted please contact to administrator for restore.');
                }
                else {
                    let rowInfo = results[0];
                    let userInfo = {
                        id: rowInfo.id,
                        name: rowInfo.name,
                        email: rowInfo.email,
                        mobile: rowInfo.mobile,
                        dob: helper.getFormatedDate(rowInfo.dob, 'YYYY-MM-DD'),
                    }
                    internalData.userInfo = userInfo;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // verify otp
            if(params.otp=='1234') {

                do_callback();
            } else {
    
                do_callback('You have entred an invalid OTP.');
            }
        },
        function (do_callback) {

            // generate token
            manageToken(req, params, internalData.userInfo, (err, token) => {

                if (err) {
                    do_callback(err);
                } else {
                    internalData.token = token;
                    do_callback();
                }
            });
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'You are logged-in successfully.',
                token: internalData.token,
                data: internalData.userInfo,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

function manageToken(req, params, userInfo, callback) {

    let token = helper.generateToken(userInfo.id + userInfo.email);

    let query = `SELECT * FROM user_tokens WHERE user_id=${userInfo.id}`;
    req.connection.query(query, function (err, results) {
        console.log('results:', results)
        if (err) {
            callback(err);
        }
        else if (!results.length) {

            let query = `INSERT INTO user_tokens SET user_id=${userInfo.id}, token='${token}', created_at=NOW(), updated_at=NOW()`;
            c.log('query:', query)
            req.connection.query(query, function (err, results) {
                console.log('results:', results)
                if (err) {
                    callback(err);
                } else {
                    callback(null, token);
                }
            });
        }
        else {
            let query = `UPDATE user_tokens SET token='${token}', updated_at=NOW() WHERE user_id=${userInfo.id}`;
            c.log('query:', query)
            req.connection.query(query, function (err, results) {
                console.log('results:', results)
                if (err) {
                    callback(err);
                } else {
                    callback(null, token);
                }
            });
        }
    });
}

exports.logout = function (req, res, next) {

    try {
        let authorization = req.header('authorization');
        let token = authorization.replace('Bearer ', '');
        let query = `DELETE FROM user_tokens WHERE token='${token}'`;
        req.connection.query(query, function (err, results) {
            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {
                let result = {
                    status: true,
                    message: 'Logout successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.update_profile = function (req, res, next) {

    try {
        let params = req.body;
        let user_id = currentUser.id;

        let data = {
            name: params.name,
            gender: params.gender,
            dob: params.dob,
        }
        req.connection.query(`UPDATE users SET ? , updated_at=NOW() WHERE id=${user_id}`, data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Profile updated successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });

    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.application_users = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let query = `SELECT * FROM users WHERE id!=${user_id} AND role='User' AND status=1 AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        name: rowInfo.name,
                        email: rowInfo.email,
                        mobile: rowInfo.mobile,
                        gender: rowInfo.gender,
                        dob: helper.getFormatedDate(rowInfo.dob, 'YYYY-MM-DD')
                    });
                });

                let result = {
                    status: true,
                    message: 'List accounts.',
                    data: rows
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.update_location = function (req, res, next) {

    try {
        let params = req.query;
        let user_id = currentUser.id;

        let data = {
            lat: params.lat,
            lng: params.lng,
        }
        req.connection.query(`UPDATE users SET ? , updated_at=NOW() WHERE id=${user_id}`, data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Location updated successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });

    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}