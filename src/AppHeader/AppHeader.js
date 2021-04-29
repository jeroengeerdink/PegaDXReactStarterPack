import React, { Component } from "react";
import { connect } from "react-redux";
import {
  Menu,
  Icon,
  Dropdown,
  Modal,
  Checkbox,
  Button,
} from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";
import { userActions } from "../_actions";

class AppHeader extends Component {
  constructor(props) {
    super(props);

    this.rootPage = process.env.PUBLIC_URL + "/";
    this.checkboxLocalOptionsDP = React.createRef();
    this.checkboxLocalOptionsCP = React.createRef();
    this.checkboxPostAssignSave = React.createRef();
    this.state = {
      showSettings: false,
      bUseLocalOptionsForDataPage:
        localStorage.getItem("useLocalOptionsForDataPage") === "1",
      bUseLocalOptionsForClipboardPage:
        localStorage.getItem("useLocalOptionsForClipboardPage") === "1",
      bUsePostAssignmentsSave:
        localStorage.getItem("usePostAssignmentsSave") === "1",
    };
  }

  render() {
    return (
      <div>
        {this.settingsModal()}
        <Menu inverted color="blue" stackable={false} fixed="top">
          {this.props.loggedIn && (
            <Menu.Item onClick={this.props.toggleSidebar}>
              <Icon name="content" />
            </Menu.Item>
          )}
          <Menu.Item name="app" as={Link} to="/">
            <Icon name="home" size="large" />
            PegaApp
          </Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item>
              <Icon
                name="setting"
                size="large"
                title="Open Settings"
                onClick={(e) => this.setState({ showSettings: true })}
              />
            </Menu.Item>
            <Menu.Item>v1.3.1</Menu.Item>
            {this.props.loggedIn && this.props.userData && (
              <Dropdown item text={this.props.userData.name}>
                <Dropdown.Menu>
                  <Dropdown.Item
                    text="Logout"
                    onClick={(e) => this.handleLogout()}
                  />
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Menu.Menu>
        </Menu>
      </div>
    );
  }

  handleLogout() {
    this.props.dispatch(userActions.logout());
    let path = `${this.rootPage}`;
    this.props.history.push(path);
  }

  settingsModal() {
    return (
      <Modal open={this.state.showSettings}>
        <Modal.Header>Application Settings</Modal.Header>
        <Modal.Content>
          <Checkbox
            ref={this.checkboxLocalOptionsDP}
            label="Autocomplete/Dropdown use local options for Data Page"
            defaultChecked={this.state.bUseLocalOptionsForDataPage}
          />
          <br />
          <Checkbox
            ref={this.checkboxLocalOptionsCP}
            label="Autocompelte/Dropdown use local options for Clipboard Page"
            defaultChecked={this.state.bUseLocalOptionsForClipboardPage}
          />
          <br />
          <Checkbox
            ref={this.checkboxPostAssignSave}
            label="Save assignment (preferred) (vs. Save case)"
            defaultChecked={this.state.bUsePostAssignmentsSave}
          />
          <br />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => this.setState({ showSettings: false })}>
            Cancel
          </Button>
          <Button onClick={() => this.saveSettings()} positive>
            OK
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  saveSettings() {
    localStorage.setItem(
      "useLocalOptionsForDataPage",
      this.checkboxLocalOptionsDP.current.state.checked ? "1" : ""
    );
    localStorage.setItem(
      "useLocalOptionsForClipboardPage",
      this.checkboxLocalOptionsCP.current.state.checked ? "1" : ""
    );
    localStorage.setItem(
      "usePostAssignmentsSave",
      this.checkboxPostAssignSave.current.state.checked ? "1" : ""
    );
    this.setState({
      showSettings: false,
      bUseLocalOptionsForDataPage: this.checkboxLocalOptionsDP.current.state
        .checked,
      bUseLocalOptionsForClipboardPage: this.checkboxLocalOptionsCP.current
        .state.checked,
      bUsePostAssignmentsSave: this.checkboxPostAssignSave.current.state
        .checked,
    });
  }
}

function mapStateToProps(state) {
  return state.user;
}

const connectedHeader = withRouter(connect(mapStateToProps)(AppHeader));
export { connectedHeader as AppHeader };
