
exports.contact_us = async function (req, res, next) {

    try {
        let params = req.body;
        let user_id = currentUser.id;

        let data = {
            user_id: user_id,
            subject: params.subject,
            message: params.message,
        }
        req.connection.query(`INSERT INTO contact_us SET ? , created_at=NOW(), updated_at=NOW()`, data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Your request submitted successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}
