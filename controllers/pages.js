
exports.page = function (req, res, next) {

    try {
        let params = req.params;

        let query = `SELECT * FROM pages WHERE page_key='${params.page_key}' AND status=1 AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Page is not available.');
            }
            else {

                let result = {
                    status: true,
                    message: '',
                    data: results[0],
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}
