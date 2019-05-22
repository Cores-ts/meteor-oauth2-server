Package.describe({
    name: 'meteor-oauth2-server',
    version: '0.0.1',
    summary: 'Add OAuth 2 server support to your application.',
    git: 'https://github.com/Cores-ts/meteor-oauth2-server'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0');

    api.use('webapp', 'server');
    api.use('check', 'server');
    api.use('meteorhacks:async@1.0.0', 'server');
    api.use('simple:json-routes@2.1.0', 'server');

    api.addFiles('common.js', ['client', 'server']);
    api.addFiles('meteor-model.js', 'server');
    api.addFiles('server.js', 'server');
    api.addFiles('client.js', 'client');

    api.export('oAuth2Server', ['client', 'server']);
});

Npm.depends({
    "express": "4.13.4",
    "body-parser": "1.14.2",
    "oauth2-server": "2.4.1"
});

Package.onTest(function(api) {

});
