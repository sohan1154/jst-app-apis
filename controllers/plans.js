
exports.listing = function (req, res, next) {

    try {
        let params = req.params;

        let query = `SELECT * FROM plans WHERE status=1 AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        name: rowInfo.name,
                        amount: rowInfo.amount,
                        validity: rowInfo.validity,
                        allowed_members: rowInfo.allowed_members,
                        description: rowInfo.description,
                    });
                });

                let result = {
                    status: true,
                    message: 'List plans.',
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

exports.purchased_plans = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let query = `SELECT UserPlan.*, Plan.name FROM user_plans UserPlan LEFT JOIN plans Plan ON UserPlan.plan_id=Plan.id WHERE UserPlan.user_id=${user_id} AND UserPlan.status=1 AND UserPlan.deleted_at IS NULL ORDER BY UserPlan.id DESC`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        name: rowInfo.name,
                        transaction_id: rowInfo.transaction_id,
                        amount: rowInfo.amount,
                        member_limit: rowInfo.member_limit,
                        plan_validity: rowInfo.plan_validity,
                        valid_till: rowInfo.valid_till,
                        description: rowInfo.description,
                    });
                });

                let result = {
                    status: true,
                    message: 'Purchased plans history.',
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

exports.purchase_plan = function (req, res, next) {

    let params = req.body;
    let user_id = currentUser.id;

    let internalData = {};

    async.series([
        function (do_callback) {

            // get plan detail
            let query = `SELECT * FROM plans WHERE id=${params.plan_id} AND deleted_at IS NULL`;
            req.connection.query(query, function (err, results) {
                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('You have selected a wrong or expired plan, Please contact to administrator for more informaion.');
                }
                else if (!results[0].status) {
                    do_callback('Your selected plan is in-active, Please contact to administrator for more informaion.');
                }
                else {
                    internalData.planInfo = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // calculat plan validity end date 
            let previousData = helper.getCurrentFormatedDate();
            internalData.valid_till = helper.addDate(previousData, internalData.planInfo.validity, 'days', 'YYYY-MM-DD');
            do_callback();

            // // get user current plan detail
            // let query = `SELECT * FROM user_plans WHERE user_id=${user_id} AND status=1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1`;
            // req.connection.query(query, function (err, results) {
            //     if (err) {
            //         do_callback(err);
            //     } else {
            //         let previousData = (!results.length) ? helper.getCurrentFormatedDate() : results[0].valid_till;
            //         internalData.valid_till = helper.addDate(previousData, internalData.planInfo.validity, 'days', 'YYYY-MM-DD');
            //         do_callback();
            //     }
            // });
        },
        function (do_callback) {

            // update user plan info
            let data = {
                user_id: user_id,
                plan_id: internalData.planInfo.id,
                transaction_id: params.transaction_id,
                amount: internalData.planInfo.amount,
                member_limit: internalData.planInfo.allowed_members,
                plan_validity: internalData.planInfo.validity,
                valid_till: internalData.valid_till,
            }
            req.connection.query(`INSERT INTO user_plans SET ? , created_at=NOW(), updated_at=NOW()`, data, function (err, results) {
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
                message: 'You have purchased a new plan.',
            }
            helper.sendResponse(req, res, result);
        }
    });
}
