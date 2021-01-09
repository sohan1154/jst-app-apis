
exports.listing = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let query = `SELECT * FROM notifications WHERE sender_id=${user_id} OR receiver_id=${user_id}`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        sender_id: rowInfo.sender_id,
                        receiver_id: rowInfo.receiver_id,
                        message: rowInfo.message,
                        created_at: helper.getFormatedDate(rowInfo.created_at),
                    });
                });

                let result = {
                    status: true,
                    message: 'List notifications.',
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

exports.get_notification_settings = function (req, res, next) {

    try {
        let user_id = currentUser.id;

        let query = `SELECT * FROM user_settings WHERE user_id = ${user_id}`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: '',
                    data: {
                        is_power_button_notification: results[0].is_power_button_notification,
                        is_map_notification: results[0].is_map_notification,
                        is_emergency_notification: results[0].is_emergency_notification,
                    }
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.update_notification_settings = function (req, res, next) {

    try {
        let params = req.body;
        let user_id = currentUser.id;

        let query = `UPDATE user_settings SET is_power_button_notification='${params.is_power_button_notification}', is_map_notification='${params.is_map_notification}', is_emergency_notification='${params.is_emergency_notification}', updated_at=NOW() WHERE user_id=${user_id}`;

        req.connection.query(query, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Settings updated successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });

    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.send_push_notification = function (req, res, next) {

    try {
        let params = req.body;
        let user_id = currentUser.id;

        let result = {
            status: true,
            message: 'Push notification sent successfully.',
        }
        helper.sendResponse(req, res, result);

    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}
