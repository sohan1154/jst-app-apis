
exports.my_members = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let member_fields = `Member.name, Member.email, Member.mobile, Member.gender, Member.image, Member.lat, Member.lng`;
        let query = `SELECT UserMember.*, ${member_fields} FROM user_members UserMember LEFT JOIN users Member ON UserMember.member_id=Member.id WHERE UserMember.user_id=${user_id} AND UserMember.deleted_at IS NULL`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        membership_id: rowInfo.id,
                        name: rowInfo.name,
                        email: rowInfo.email,
                        mobile: rowInfo.mobile,
                        gender: rowInfo.gender,
                        lat: rowInfo.lat,
                        lng: rowInfo.lng,
                        is_remove_or_left_request: rowInfo.is_remove_or_left_request,
                        request_by: rowInfo.request_by,
                    });
                });

                let result = {
                    status: true,
                    message: 'List members.',
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

exports.i_have_member = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let member_fields = `User.name, User.email, User.mobile, User.gender, User.image, User.lat, User.lng`;
        let query = `SELECT UserMember.*, ${member_fields} FROM user_members UserMember LEFT JOIN users User ON UserMember.user_id=User.id WHERE UserMember.member_id=${user_id} AND UserMember.deleted_at IS NULL`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        membership_id: rowInfo.id,
                        name: rowInfo.name,
                        email: rowInfo.email,
                        mobile: rowInfo.mobile,
                        gender: rowInfo.gender,
                        lat: rowInfo.lat,
                        lng: rowInfo.lng,
                        is_remove_or_left_request: rowInfo.is_remove_or_left_request,
                        request_by: rowInfo.request_by,
                    });
                });

                let result = {
                    status: true,
                    message: 'List of i members.',
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

exports.add_members = function (req, res, next) {

    let params = req.body;
    let user_id = currentUser.id;
    
    let internalData = {oldMembers: []};

    async.series([
        function (do_callback) {

            // get current plan details
            let query = `SELECT member_limit FROM user_plans WHERE user_id = ${user_id} AND status=1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1`;
            req.connection.query(query, function (err, results, fields) {
                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('You did\'t have any active plan, Please buy a plan to continue.');
                }
                else {

                    internalData.planMemberLimit = results[0].member_id;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get old members
            let query = `SELECT member_id FROM user_members WHERE user_id = ${user_id}`;
            req.connection.query(query, function (err, results, fields) {
                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback();
                }
                else {

                    results.forEach(element => {
                        internalData.oldMembers.push(element.member_id);
                    });
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // check plan limits  
            internalData.newMembers = params.member_ids.filter(x => !internalData.oldMembers.includes(x));

            if(internalData.oldMembers.length >= internalData.planMemberLimit) {
                do_callback('You have already reached your plan limit.');
            }
            else if(params.member_ids.length > internalData.planMemberLimit) {
                do_callback(`You can add only ${internalData.planMemberLimit} members in your current active plan.`);
            }
            else if( (internalData.newMembers.length + internalData.oldMembers.length) > internalData.planMemberLimit) {
                
                let left_limit = (internalData.planMemberLimit - internalData.oldMembers.length);
                do_callback(`You can\'t add more then your plan limit ${internalData.planMemberLimit} members, only ${left_limit} left.`);
            }
            else {
                do_callback();
            }
        },
        function (do_callback) {

            let values = ``;
            internalData.newMembers.forEach(element => {
                values += `(${user_id}, ${element}, NOW(), NOW()), `;
            });

            values = values.replace(/,\s*$/, "");

            let query = `INSERT INTO user_members (user_id, member_id, created_at, updated_at) VALUES ${values}`;

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
                message: 'Members added successfully.',
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.left_group = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = currentUser.id;

        let query = `SELECT * FROM user_members WHERE (user_id=${user_id} || member_id=${user_id}) AND id = ${params.membership_id} AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Membership not found, may be already left.');
            }
            else if (results[0].is_remove_or_left_request) {
                helper.sendErrorResponse(req, res, 'Your request is already in review.');
            }
            else {

                let request_by = (user_id == results[0].user_id) ? 'self' : 'member';
                let query = `UPDATE user_members SET is_remove_or_left_request=1, request_by='${request_by}', updated_at=NOW() WHERE id=${params.membership_id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        helper.sendErrorResponse(req, res, err);
                    } else {

                        let result = {
                            status: true,
                            message: 'Your request submitted to review.',
                        }
                        helper.sendResponse(req, res, result);
                    }
                });
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}
