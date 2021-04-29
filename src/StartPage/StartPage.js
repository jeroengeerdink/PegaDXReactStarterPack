import React, { Component } from "react";
import { connect } from "react-redux";
import {
  Container,
  Grid,
  Header,
  Icon,
  Button,
  Dropdown,
  Modal,
} from "semantic-ui-react";
// eslint-disable-next-line
// TODO: Hook up new popup and iframe variants
//import { JSO, Popup, IFrameActive } from "jso";
import { userActions } from "../_actions";
import { oAuthConfig, userManager, loginBoxType } from "../_services";

const loginBoxOptions = [
  {
    key: "Main",
    text: "Present login experience using full main window",
    value: loginBoxType.Main,
  },
  {
    key: "Popup",
    text: "Present login experience using a separate popup window",
    value: loginBoxType.Popup,
  },
  {
    key: "Modal",
    text: "Present login experience using an inline modal dialog",
    value: loginBoxType.Modal,
  },
];

let gsLoginBoxType = localStorage.getItem("loginBoxExp");
if (typeof gsLoginBoxType === "undefined" || gsLoginBoxType == null) {
  gsLoginBoxType =
    "" +
    (oAuthConfig && oAuthConfig.loginExperience
      ? oAuthConfig.loginExperience
      : loginBoxType.Main);
}
let gLoginBoxType = parseInt("0" + gsLoginBoxType, 10);

class StartPage extends Component {
  constructor(props) {
    super(props);

    // When page reloads after redirect we pass the code to the oidc-client library
    //  and it gets us back the token within the user structure returned
    if (-1 !== window.location.href.indexOf("?code")) {
      userManager
        .signinRedirectCallback(window.location.href)
        .then((user) => {
          this.props.dispatch(userActions.setToken(user));
        })
        .catch((e) => {
          errorCallback(e);
        });
    }

    this.state = {
      loginBoxExp: gLoginBoxType,
      showModal: false,
      endedRedirectCallback: false,
    };

    this.button = null;

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  handleSubmit(e) {
    this.setState({ submitted: true });
  }

  oAuthSignin(e) {
    this.setState({ endedRedirectCallback: false });
    userManager.signinRedirect();
  }

  oAuthPopup(e) {
    let lastSlash = window.location.href.lastIndexOf("/");
    let opts = {
      redirect_uri: window.location.href.substring(0, lastSlash + 1) + "popup",
    };
    /*
    oAuthJSO.setLoader(Popup)
    oAuthJSO.getToken(opts)
    .then((token) => {
        // token structure contains something like:
        // {"access_token":"99a72f9e4f827833735e28f2a386e384","token_type":"bearer","expires_in":3600}
        console.log("OAuth Token acquired:", token);
        this.props.dispatch(userActions.setToken(token));
    })
    .catch((err) => {
        console.error("Error acquiring token", err);
    })
    let self = this;
    this.idTknCheckInterval = window.setInterval(function(){
      let token = oAuthJSO.checkToken();
      if(token) {
        window.clearInterval(self.idTknCheckInterval);
        self.props.dispatch(userActions.setToken(token));
      }    
    }, 100);
  */
  }

  oAuthModal = (e) => {
    this.setState({ showModal: true });

    // Call JSO library
    let lastSlash = window.location.href.lastIndexOf("/");
    let opts = {
      redirect_uri: window.location.href.substring(0, lastSlash + 1) + "iframe",
    };
    /*
    oAuthJSO.setLoader(IFrameActive)
    oAuthJSO.getToken(opts)
    .then((token) => {
        // token structure contains something like:
        // {"access_token":"99a72f9e4f827833735e28f2a386e384","token_type":"bearer","expires_in":3600}
        console.log("OAuth Token acquired:", token);
        this.props.dispatch(userActions.setToken(token));
    })
    .catch((err) => {
        console.error("Error acquiring token", err);
    })
    let self = this;
    this.idTknCheckInterval = window.setInterval(function(){
      let token = oAuthJSO.checkToken();
      if(token) {
        console.log("TknCheckInterval found token.");
        window.clearInterval(self.idTknCheckInterval);
        self.setState({showModal:false});
        self.props.dispatch(userActions.setToken(token));
      };    
    }, 100);
  */
  };

  onDDChangeHandler = (e, data) => {
    gLoginBoxType = data.value;
    localStorage.setItem("loginBoxExp", "" + data.value);
    this.setState({ loginBoxExp: gLoginBoxType });
  };

  onBtnStartLogin = (e) => {
    switch (gLoginBoxType) {
      case loginBoxType.Popup:
        this.oAuthPopup(e);
        break;
      case loginBoxType.Main:
        this.oAuthSignin(e);
        break;
      case loginBoxType.Modal:
        this.oAuthModal(e);
        break;
      default:
        break;
    }
  };

  onBtnCloseModal = (e) => {
    this.setState({ showModal: false });
  };

  render() {
    // alert(this.state.loginBoxExp);
    const isModalChoice = this.state.loginBoxExp == loginBoxType.Modal;
    const ddOffset = this.state.loginBoxExp - 1;
    let defLoginBoxDDValue = loginBoxOptions[ddOffset].value;

    return (
      <Container>
        <Modal
          open={this.state.showModal}
          style={{ marginTop: "100px", marginLeft: "150px" }}
        >
          <Modal.Header>
            <Button onClick={this.onBtnCloseModal}>
              <Header.Content>Close</Header.Content>
            </Button>
          </Modal.Header>
          <Modal.Content scrolling={true}>
            <Modal.Description>
              <div style={{ height: "900px" }}>
                <iframe
                  id="jsoActiveIframe"
                  title="jsologin"
                  height="100%"
                  width="100%"
                ></iframe>
              </div>
            </Modal.Description>
          </Modal.Content>
        </Modal>
        <Grid verticalAlign="middle" textAlign="center">
          <Grid.Column>
            <Header color="blue" as="h2" icon>
              <Icon name="home" />
              {/* Commenting out the different options to login as that is not the focus of the Starter Packs.  Also the modal one will
                require a Pega login screen customization to properly work
             <Dropdown inline
              options={loginBoxOptions}
              defaultValue={defLoginBoxDDValue}
              onChange={this.onDDChangeHandler}/><br />
            */}
              <Button onClick={this.onBtnStartLogin}>
                <Header.Content>Login with Pega</Header.Content>
              </Button>
            </Header>
          </Grid.Column>
        </Grid>
      </Container>
    );
  }
}

function mapStateToProps(state) {
  const { loggingIn } = state.user;
  return {
    loggingIn,
  };
}

const connectedStartPage = connect(mapStateToProps)(StartPage);
export { connectedStartPage as StartPage };
