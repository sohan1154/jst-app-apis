
exports.send_message = function (req, res, next) {

    try {
        let params = req.body;
        let user_id = currentUser.id;

        let data = {
            parent_id: params.parent_id,
            sender_id: user_id,
            receiver_id: params.receiver_id,
            message: params.message,
        }
        req.connection.query(`INSERT INTO user_messages SET ? , created_at=NOW(), updated_at=NOW()`, data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Your message send successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.listing = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let query = `SELECT * FROM user_messages WHERE sender_id=${user_id} OR receiver_id=${user_id} AND deleted_at IS NOT NULL GROUP BY parent_id ORDER BY id DESC`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        parent_id: rowInfo.parent_id,
                        sender_id: rowInfo.sender_id,
                        receiver_id: rowInfo.receiver_id,
                        message: rowInfo.message,
                        created_at: helper.getFormatedDate(rowInfo.created_at),
                    });
                });

                let result = {
                    status: true,
                    message: 'Message listing.',
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

exports.message_thread = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let query = `SELECT * FROM user_messages WHERE parent_id=${params.message_id} AND sender_id=${user_id} OR receiver_id=${user_id} AND deleted_at IS NOT NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        parent_id: rowInfo.parent_id,
                        sender_id: rowInfo.sender_id,
                        receiver_id: rowInfo.receiver_id,
                        message: rowInfo.message,
                        created_at: helper.getFormatedDate(rowInfo.created_at),
                    });
                });

                let result = {
                    status: true,
                    message: 'Message thread list.',
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
