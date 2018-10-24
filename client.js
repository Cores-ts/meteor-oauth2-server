/**
 * Subscribe to collections
 */

// Meteor.subscribe(oAuth2Server.pubSubNames.authCodes)
// Meteor.subscribe(oAuth2Server.pubSubNames.refreshTokens)


oAuth2Server.subscribeTo = {
    authCode: function() {
        return Meteor.subscribe(oAuth2Server.pubSubNames.authCodes);
    },
    refreshTokens: function() {
        return Meteor.subscribe(oAuth2Server.pubSubNames.refreshTokens);
    }
};
/**
 * Calls to server methods
 */