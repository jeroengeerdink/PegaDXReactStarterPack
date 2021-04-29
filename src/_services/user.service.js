import axios from "axios";
import { loginBoxType, endpoints } from "./endpoints";
import { authHeader, getError } from "../_helpers";
import { UserManager, Log } from "oidc-client";

/**
 * Functions used to issue AJAX requests and manage responses.
 * All of the included methods use the Axios library for Promise-based requests.
 */
export const userService = {
  login,
  setToken,
  logout,
  operator,
};

export const oAuthConfig = endpoints.use_OAuth ? endpoints.OAUTHCFG : null;
const userManagerConfig = oAuthConfig
  ? {
      client_id: oAuthConfig.client_id,
      redirect_uri:
        oAuthConfig.loginExperience == loginBoxType.Main
          ? `${window.location.protocol}//${window.location.hostname}${
              window.location.port ? `:${window.location.port}` : ""
            }/start`
          : "",
      response_type: oAuthConfig.use_pkce ? "code" : "token",
      scope: "openid profile",
      authority: oAuthConfig.authority,
      silent_redirect_uri: `${window.location.protocol}//${
        window.location.hostname
      }${
        window.location.port ? `:${window.location.port}` : ""
      }/silent_renew.html`,
      automaticSilentRenew: true,
      filterProtocolClaims: true,
      loadUserInfo: false,
      metadata: {
        authorization_endpoint: oAuthConfig.authorization,
        token_endpoint: oAuthConfig.token,
      },
    }
  : null;

// Enable next two lines to get detailed console logging for oidc-client library
//Log.logger = console;
//Log.level = Log.DEBUG;
export const userManager = userManagerConfig
  ? new UserManager(userManagerConfig)
  : null;

function login(username, password) {
  const encodedUser = "Basic " + btoa(username + ":" + password);

  return axios
    .get(endpoints.BASEURL + endpoints.AUTH, {
      headers: { Authorization: encodedUser },
    })
    .then(function (response) {
      localStorage.setItem("user", encodedUser);
      return encodedUser;
    })
    .catch(function (error) {
      return Promise.reject(getError(error));
    });
}

function setToken(user) {
  const authToken = user.token_type + " " + user.access_token;
  localStorage.setItem("user", authToken);
  return authToken;
}

function logout() {
  if (userManagerConfig) {
    // Remove any local storage for the user
    userManager.getUser().then((user) => {
      if (user) {
        userManager.removeUser(user);
        if (user.access_token) {
          // Remove the token if Pega supports that for public clients (see commented out code lower in method)
          // Could either just let the access token expire or could revoke
          // If revoking, the authorization header for the revoke endpoint should be client_id:client_secret
          // Now need to invoke endpoints to kill tokens (if we ever get a refresh token...would need to kill it as well)
          // Tried passing in regular bearer token--didnt' work
          // Pega Infinity 8.5 is not presently supporting revoking "Public" tokens via the POST /revoke endpoint...so
          //  don't configure a remove endpoing
          /*          
            return axios
              .post(oAuthConfig.revoke,
              {
                token: accessTkn
              },
              {
                headers: {
                  'Authorization': 'Basic ' + btoa(oAuthConfig.client_id + ':')
                }
              })
              .then( (response) => {
                return Promise.resolve();
              })
              .catch( (error) => {
                getError(error);
                // Don't reject the promise (rather treat errors even as success)
                return Promise.resolve();
              });
*/
        }
      }
    });
  }
  localStorage.removeItem("user");
}

function operator() {
  return axios
    .get(endpoints.BASEURL + endpoints.DATA + "/D_OperatorID", {
      headers: authHeader(),
    })
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      return Promise.reject(getError(error));
    });
}
