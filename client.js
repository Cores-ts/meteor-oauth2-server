/**
 * Subscribe to collections
 */

Meteor.subscribe(oAuth2Server.pubSubNames.authCodes)
Meteor.subscribe(oAuth2Server.pubSubNames.refreshTokens)

/**
 * Calls to server methods
 */
