import React, { Component } from "react";
import { Router, Route } from "react-router-dom";
import { connect } from "react-redux";
import {
  Container,
  Message,
  Sidebar,
  Menu,
  Icon,
  Header,
} from "semantic-ui-react";

import { history, isTrue } from "../_helpers";
import { PrivateRoute } from "../_components";
import { Workarea } from "../Workarea/Workarea";
import { LoginPage } from "../LoginPage";
import { StartPage } from "../StartPage";
import { PopupPage } from "../PopupPage";
import { IframePage } from "../IframePage";
import { AppHeader } from "../AppHeader";
import {
  alertActions,
  caseActions,
  assignmentActions,
  userActions,
} from "../_actions";

class PegaApp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      loginRedirect: false,
    };
  }

  componentDidMount() {
    if (this.props.user.loggedIn && this.props.caseTypes.length === 0) {
      this.props.dispatch(caseActions.getCaseTypes());
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.user.loggedIn && nextProps.user.loggedIn) {
      this.props.dispatch(caseActions.getCaseTypes());
    }
  }

  getMenuItemsForCases() {
    let validCases = [];

    // Don't try to add Menu.Item when there's nothing to add
    if (this.props.caseTypes && this.props.caseTypes.length > 0) {
      this.props.caseTypes.forEach((caseType) => {
        if (isTrue(caseType.CanCreate)) {
          if (caseType.startingProcesses) {
            caseType.startingProcesses.forEach((startingProcess) => {
              validCases.push(
                <Menu.Item
                  key={startingProcess.name}
                  name={startingProcess.name}
                  content={startingProcess.name}
                  onClick={(e) => this.createCase(caseType.ID, startingProcess)}
                />
              );
            });
          } else {
            validCases.push(
              <Menu.Item
                key={caseType.name}
                name={caseType.name}
                content={caseType.name}
                onClick={(e) => this.createCase(caseType.ID, null)}
              />
            );
          }
        }
      });
    }

    return validCases;
  }

  createCase(id, startingProcess) {
    let processID =
      startingProcess && startingProcess.ID ? startingProcess.ID : null;
    if (startingProcess && isTrue(startingProcess.requiresFieldsToCreate)) {
      this.props.dispatch(caseActions.getCaseCreationPage(id, processID));
    } else {
      this.props.dispatch(caseActions.createCase(id, processID));
    }

    this.setState({ visible: false });
  }

  closeSidebar() {
    if (this.state.visible) {
      this.setState({ visible: false });
    }
  }

  toggleSidebar = () => this.setState({ visible: !this.state.visible });

  handleAlertDismiss = (id) => {
    this.props.dispatch(alertActions.closeAlert(id));
  };

  render() {
    return (
      <Router history={history}>
        <div id="router-root">
          <AppHeader toggleSidebar={this.toggleSidebar} />
          <Sidebar.Pushable className="main">
            <Sidebar
              as={Menu}
              animation="push"
              visible={this.state.visible}
              icon="labeled"
              width="thin"
              vertical
              inverted
            >
              <Menu.Item name="create">
                <Header as="h3" inverted>
                  <Icon name="plus" />
                  Create
                </Header>
              </Menu.Item>
              {this.getMenuItemsForCases()}
            </Sidebar>
            <Sidebar.Pusher
              dimmed={this.state.visible}
              onClick={() => this.closeSidebar()}
            >
              <div className="workarea">
                <Container className="main">
                  <Route
                    path={`${process.env.PUBLIC_URL}/login`}
                    component={LoginPage}
                  />
                  <Route
                    path={`${process.env.PUBLIC_URL}/start`}
                    component={StartPage}
                  />
                  <Route
                    path={`${process.env.PUBLIC_URL}/popup`}
                    component={PopupPage}
                  />
                  <Route
                    path={`${process.env.PUBLIC_URL}/iframe`}
                    component={IframePage}
                  />
                </Container>
                <PrivateRoute exact path="/" component={Workarea} />
              </div>
              <Container className="alert-container">
                {this.props.alert.activeAlerts.map((alert, index) => (
                  <Message
                    floating
                    key={index}
                    negative={alert.negative}
                    positive={alert.positive}
                    onDismiss={() => this.handleAlertDismiss(alert.id)}
                  >
                    <Message.Header>
                      {alert.code
                        ? `${alert.code}: ${alert.message}`
                        : alert.message}
                    </Message.Header>
                  </Message>
                ))}
              </Container>
            </Sidebar.Pusher>
          </Sidebar.Pushable>
        </div>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  const { alert, cases, user } = state;
  return {
    alert,
    caseTypes: cases.caseTypes,
    user: user,
  };
}

const connectedPegaApp = connect(mapStateToProps)(PegaApp);
export { connectedPegaApp as PegaApp };
