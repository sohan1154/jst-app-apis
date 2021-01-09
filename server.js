var restify = require('restify');
global.mysql = require('mysql');
var users = require('./controllers/users');
var members = require('./controllers/members');
var messages = require('./controllers/messages');
var notifications = require('./controllers/notifications');
var plans = require('./controllers/plans');
var pages = require('./controllers/pages');
var contacts = require('./controllers/contacts');
global.database = require('./config/database');
global.helper = require('./functions/helper');
global.permission = require('./functions/permission');
global.CustomValidators = require('./functions/validator');
global.async = require("async");
global.c = console;

/**
 * create server
 */
var server = restify.createServer();

server.port = 3002;
server.name = 'JST Server for Application APIs';

/**
 * handle cors middleware 
 */
const corsMiddleware = require('restify-cors-middleware')
 
const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['http://localhost:3000', 'http://localhost', 'localhost:3000', '*'],
  allowHeaders: ['Authorization'],
  exposeHeaders: ['Authorization']
})
 
server.pre(cors.preflight)
server.use(cors.actual)

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.dateParser());
server.use(restify.plugins.queryParser());
server.use(restify.plugins.jsonp());
server.use(restify.plugins.gzipResponse());
server.use(restify.plugins.bodyParser());

// check body/params 
server.use(helper.vewRequest);

// add database connection in req object
server.use(database.createDatabaseConnection);

// auth
server.post('/register-email', users.register_email);
server.post('/verify-email', users.verify_email);
server.post('/update-mobile', users.attach_mobile);
server.post('/verify-mobile', users.verify_mobile);
server.get('/logout', users.logout);

// users
server.post('/update-profile', permission.isAuthenticate, users.update_profile);
server.get('/application-users', permission.isAuthenticate, users.application_users);
server.get('/update-location', permission.isAuthenticate, users.update_location);

// members
server.get('/my-members', permission.isAuthenticate, members.my_members);
server.get('/i-have-member', permission.isAuthenticate, members.i_have_member);
server.post('/add-members', permission.isAuthenticate, members.add_members);
server.get('/left-group/:membership_id', permission.isAuthenticate, members.left_group);

// plans
server.post('/purchase-plan', permission.isAuthenticate, plans.purchase_plan);
server.get('/plans-listing', permission.isAuthenticate, plans.listing);
server.get('/purchased-plans', permission.isAuthenticate, plans.purchased_plans);

// messages 
server.post('/send-message', permission.isAuthenticate, messages.send_message);
server.get('/messages-listing', permission.isAuthenticate, messages.listing);
server.get('/mesmessage-thread/:message_id', permission.isAuthenticate, messages.message_thread);

// notifications
server.get('/notifications', permission.isAuthenticate, notifications.listing);
server.get('/get-notification-settings', permission.isAuthenticate, notifications.get_notification_settings);
server.post('/update-notification-settings', permission.isAuthenticate, notifications.update_notification_settings);
server.post('/send-push-notification', permission.isAuthenticate, notifications.send_push_notification);

// contact us
server.post('/contact-us', permission.isAuthenticate, contacts.contact_us);

// static pages
server.get(`/static-pages/:page_key`, pages.page);

/**
 * mound a server on specific port 
 */
server.listen(server.port, function () {
  console.log('%s listening at %s', server.name, server.url);
});
