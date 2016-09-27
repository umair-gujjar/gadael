'use strict';

const api = {
    user: require('../../api/User.api'),
    department: require('../../api/Department.api'),
    request: require('../../api/Request.api')
};



exports = module.exports = function pages(server) {

    function createUser() {
        return new Promise((resolve, reject) => {
            server.post('/rest/admin/users', {
                firstname: 'John',
                lastname: 'Doe',
                email: 'john.doe@example.com',
                department: null,
                setpassword: true,
                newpassword: 'secret',
                newpassword2: 'secret',
                isActive: true,
                roles: {
                    account: {
                        arrival: new Date(),
                        seniority: new Date(),
                        sage: {
                            registrationNumber: '00254971'
                        }
                    }
                }
            }, function(res, body) {
                if (200 !== res.statusCode) {
                    return reject(new Error(body.$outcome));
                }

                let createdUser = body;
                delete createdUser.$outcome;

                resolve(createdUser);
            });
        });
    }


    function closeServer() {
        return new Promise((resolve) => {
            server.get('/rest/logout', {}, function(res) {
                server.close(() => {
                    resolve(true);
                });
            });
        });
    }


    function logout() {
        return new Promise((resolve, reject) => {
            server.get('/rest/logout', {}, function(res, body) {
                if (res.statusCode === 200) {
                    return resolve(true);
                }
                reject(new Error(body.$outcome.alert[0].message));
            });
        });
    }


    function loginAsManager() {
        return new Promise((resolve, reject) => {

            server.post('/rest/login', {
                username: 'manager@example.com', // Jane Doe
                password: 'secret'
            }, function(res, body) {
                if (res.statusCode === 200) {
                    return resolve(true);
                }

                reject(new Error(body.$outcome.alert[0].message));
            });
        });
    }



    function loginAsAccount() {
        return new Promise((resolve, reject) => {

            server.post('/rest/login', {
                username: 'user1@example.com', // Pamila Cannella
                password: 'secret'
            }, function(res, body) {
                if (res.statusCode === 200) {
                    return resolve(true);
                }

                reject(new Error(body.$outcome.alert[0].message));
            });
        });
    }

    let user1;

    return server.createAdminSession()
    .then(function(theCreatedAdmin) {

        return server.webshot('/admin/types', 'typelist')
        .then(server.webshot('/admin/types/5740adf51cf1a569643cc508', 'type-edit'))
        .then(server.webshot('/admin/rights', 'rightlist'))
        .then(server.webshot('/admin/rights/577225e3f3c65dd800257bdc', 'right-view-annual-leave'))
        .then(server.webshot('/admin/right-edit/577225e3f3c65dd800257bdc', 'right-edit-annual-leave'))
        .then(server.webshot('/admin/rightrule-edit?right=577225e3f3c65dd800257bdc', 'rightrule-edit-annual-leave'))
        .then(server.webshot('/admin/rightrenewal-edit?right=577225e3f3c65dd800257bdc', 'rightrenewal-edit-annual-leave'))
        .then(server.webshot('/admin/collections', 'collectionlist'))
        .then(server.webshot('/admin/collections/5740adf51cf1a569643cc520', 'collection-edit'))
        .then(server.webshot('/admin/collections/5740adf51cf1a569643cc522', 'collection-parttime-edit'))
        .then(server.webshot('/admin/calendars', 'calendarlist'))
        .then(server.webshot('/admin/calendars/5740adf51cf1a569643cc101', 'calendar-edit-5d-40h'))
        .then(server.webshot('/admin/rights-sort', 'right-sort'))
        .then(server.webshot('/admin/exports', 'exports'))
        .then(server.webshot('/admin/export-edit-xlsx', 'export-edit-xlsx'))
        .then(server.webshot('/admin/export-edit-sage', 'export-edit-sage'))
        .then(createUser);
    })
    .then(createdUser => {
        return api.department.createScreenshootDepartment(server.app, null, 3)
        .then(randomDepartment => {

            user1 = randomDepartment.members[0].user;

            return server.webshot('/admin/users', 'userlist-with-one-admin')
            .then(server.webshot('/admin/users/'+server.admin._id, 'user-admin-view'))
            .then(server.webshot('/admin/user-edit/'+server.admin._id, 'user-admin-edit'))
            .then(server.webshot('/admin/users/'+createdUser._id, 'user-account-view'))
            .then(server.webshot('/admin/user-edit/'+createdUser._id, 'user-account-edit'))
            .then(server.webshot('/admin/users/'+randomDepartment.manager.user._id, 'user-manager-view'))
            .then(server.webshot('/admin/user-edit/'+randomDepartment.manager.user._id, 'user-manager-edit'))
            .then(server.webshot('/admin/departments', 'departments'))
            .then(server.webshot('/admin/departments/'+randomDepartment.department._id, 'department-view'))
            .then(server.webshot('/admin/department-edit/'+randomDepartment.department._id, 'department-edit'));
        });
    })
    .then(() => {
        return logout()
        .then(loginAsAccount)
        .then(() => {
            let dtstart = new Date(2016, 6, 2, 8,0,0,0);
            let dtend = new Date(2016, 6, 2, 18,0,0,0);
            return api.request.createRandomAbsence(server.app, user1, dtstart, dtend, 1)
            .then(server.webshot('/home', 'account-home'))
            .then(server.webshot('/account/beneficiaries', 'account-rights'));
        });
    })
    .then(() => {
        return logout()
        .then(loginAsManager)
        .then(() => {
            return server.webshot('/home', 'manager-home')
            .then(server.webshot('/manager/waitingrequests', 'manager-waiting-requests'));
        });
    })


    .then(function() {
        return true;
    })
    .then(closeServer);
};
