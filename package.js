Package.describe({
    name: 'zamphyr:meteor-oauth2-server',
    version: '0.0.1',
    summary: 'Add OAuth 2 server support to your application.',
    git: 'https://github.com/zamphyr/meteor-oauth2-server'
});

Package.onUse(function(api) {
    api.versionsFrom('1.3');

    api.use('webapp', 'server');
    api.use('check', 'server');

    api.addFiles('common.js', ['client', 'server']);
    api.addFiles('model.js', 'server');
    api.addFiles('server.js', 'server');
    api.addFiles('client.js', 'client');

    api.export('oAuth2Server', ['client', 'server']);
});

Npm.depends({
    "body-parser": "1.18.3",
    "oauth2-server": "3.0.1"
});

Package.onTest(function(api) {

});
