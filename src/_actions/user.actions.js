import { actionTypes } from "./actionTypes";
import { userService, dataPageService } from "../_services";
import { alertActions } from "./";
import { history } from "../_helpers";

/**
 * Action creators. Used to dispatch actions with Redux.
 * Actions can be simple [assignmentActions.closeAssignment()] or
 * complex to handle AJAX requests [assignmentActions.getAssignment()].
 * For actions that include AJAX requests, we dispatch two actions:
 *  -request (in case we need to update store on request initiation)
 *  -success OR failure (to update store with relevant response data)
 */
export const userActions = {
  login,
  setToken,
  logout,
  getUserData,
  getRecents,
};

function login(username, password) {
  return (dispatch) => {
    dispatch(request({ username }));

    userService.login(username, password).then(
      (user) => {
        dispatch(success(user));
        history.push("/");
      },
      (error) => {
        dispatch(failure(error));
        dispatch(alertActions.error(error));
      }
    );
  };

  function request(user) {
    return { type: actionTypes.LOGIN_REQUEST, user };
  }
  function success(user) {
    return { type: actionTypes.LOGIN_SUCCESS, user };
  }
  function failure(error) {
    return { type: actionTypes.LOGIN_FAILURE, error };
  }
}

function setToken(token) {
  var homeUrl = process.env.PUBLIC_URL || "";
  if (homeUrl.length > 0 && homeUrl.charAt(homeUrl.length) !== "/")
    homeUrl += "/";

  return (dispatch) => {
    let authToken = userService.setToken(token);
    dispatch(success(authToken));
    history.push(homeUrl);
  };

  function success(authToken) {
    return { type: actionTypes.LOGIN_SUCCESS, authToken };
  }
}

function logout() {
  userService.logout();
  return { type: actionTypes.LOGOUT };
}

function getUserData() {
  // TODO: Use an action creator to create AJAX request to get datapage for user
  // This function's code will look very similar to function cases() from case.action.js
  // Will use dataPageService.getDataPage(id) to make the AJAX request
  //return {type : actionTypes.USER_DATA_SUCCESS};
  return (dispatch) => {
    dispatch(request());

    dataPageService.getDataPage("D_OperatorID").then(
      (operator) => {
        // If 'api' service package has authentication turned off, the request might
        //  give a 200 response but it doesn't mean the operator's data is fully available.
        //  So, check for pyUserName
        if (operator.pyUserName) {
          dispatch(success(operator));
        } else {
          let errMsg = `Operator user name not available. This usually means that the 'api' Service Package has Authentication turned off.`;
          dispatch(failure(errMsg));
          dispatch(alertActions.error(errMsg));
        }
      },
      (error) => {
        dispatch(failure(error));
        dispatch(alertActions.error(error));
      }
    );
  };

  function request() {
    return { type: actionTypes.USER_DATA_REQUEST };
  }
  function success(operator) {
    return { type: actionTypes.USER_DATA_SUCCESS, operator };
  }
  function failure(error) {
    return { type: actionTypes.USER_DATA_FAILURE, error };
  }
}

function getRecents() {
  return (dispatch) => {
    dispatch(request());

    return dataPageService
      .getDataPage("Declare_pxRecents", { Work: true, Rule: false })
      .then(
        (data) => {
          return dispatch(success(data));
        },
        (error) => {
          dispatch(failure(error));
          dispatch(alertActions.error(error));
        }
      );
  };

  function request() {
    return { type: actionTypes.RECENTS_REQUEST };
  }
  function success(data) {
    return { type: actionTypes.RECENTS_SUCCESS, data };
  }
  function failure(error) {
    return { type: actionTypes.RECENTS_FAILURE, error };
  }
}
