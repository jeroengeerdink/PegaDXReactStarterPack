import React, { Component } from "react";
import { connect } from "react-redux";
import { Container, Header, Segment } from "semantic-ui-react";

import { Worklist } from "../Worklist/Worklist";
import { DashboardWidget } from "../DashboardWidget/DashboardWidget";

class Dashboard extends Component {
  render() {
    return (
      <Container fluid>
        <Worklist />
      </Container>
    );
  }
}

function mapStateToProps(state) {
  return {};
}

const connectedDashboard = connect(mapStateToProps)(Dashboard);
export { connectedDashboard as Dashboard };
