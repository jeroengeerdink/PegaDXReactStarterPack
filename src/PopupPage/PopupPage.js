import React, { Component } from "react";
import { connect } from "react-redux";

class PopupPage extends Component {
  constructor(props) {
    super(props);
    window.onload = function () {
      // Call JSO popupCompleted callback
      window.opener.popupCompleted();
      setTimeout(function () {
        window.close();
      }, 200);
    };
  }

  render() {
    return <div />;
  }
}

function mapStateToProps(state) {
  const { loggingIn } = state.user;
  return {
    loggingIn,
  };
}

const connectedPopupPage = connect(mapStateToProps)(PopupPage);
export { connectedPopupPage as PopupPage };
