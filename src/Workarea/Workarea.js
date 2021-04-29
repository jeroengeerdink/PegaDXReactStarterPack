import React, { Component } from "react";
import { connect } from "react-redux";
import { Tab, Container, Menu, Icon } from "semantic-ui-react";

import { Dashboard } from "../Dashboard/Dashboard";
import { WorkObject } from "../WorkObject/WorkObject";
import { assignmentActions, userActions, errorActions } from "../_actions";

/**
 * Component that contains CaseWorker style tabs.
 * First tab is always Dashboard.
 * Tabs can be opened / closed depending on open WorkObjects.
 */
class Workarea extends Component {
  componentDidMount() {
    this.props.dispatch(userActions.getUserData());
  }

  getPanes() {
    let panes = [
      {
        menuItem: "Dashboard",
        render: () => (
          <Tab.Pane>
            <Dashboard />
          </Tab.Pane>
        ),
      },
    ];

    this.props.openAssignments.forEach((caseID) => {
      if (
        (this.props.assignmentDetails[caseID] &&
          this.props.caseDetails[caseID]) ||
        this.props.pages[caseID]
      ) {
        panes.push({
          menuItem: this.getTabItem(caseID),
          render: () => (
            <Tab.Pane key={caseID}>
              <WorkObject
                assignment={this.props.assignmentDetails[caseID]}
                caseID={caseID}
                case={this.props.caseDetails[caseID]}
                page={this.props.pages[caseID]}
              />
            </Tab.Pane>
          ),
        });
      } else {
        panes.push({
          menuItem: this.getTabItem(caseID, false),
          render: () => <Tab.Pane key={caseID} loading />,
        });
      }
    });

    return panes;
  }

  getTabItem(id, showClose = true) {
    let objectId = id.split(" ")[1];
    if (objectId === undefined) {
      objectId = id.split("-").pop();
    }

    return (
      <Menu.Item key={id}>
        {objectId}
        {showClose && (
          <Icon
            name="window close"
            style={{ paddingLeft: "15px" }}
            onClick={(e) => this.closePane(id)}
          />
        )}
      </Menu.Item>
    );
  }

  closePane(id) {
    this.props.dispatch(
      assignmentActions.changeAssignment(this.props.activeIndex)
    );

    this.props.dispatch(errorActions.clearErrors(id));
    this.props.dispatch(assignmentActions.closeAssignment(id));
  }

  handleTabChange(e, data) {
    if (e.target.tagName !== "I") {
      this.props.dispatch(assignmentActions.changeAssignment(data.activeIndex));
    }
  }

  render() {
    return (
      <div className="dashboard-container">
        <Container fluid>
          <Tab
            renderActiveOnly={true}
            panes={this.getPanes()}
            activeIndex={this.props.activeIndex}
            onTabChange={(e, data) => this.handleTabChange(e, data)}
          />
        </Container>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    openAssignments,
    assignmentDetails,
    activeIndex,
    worklistSettings,
    openCasesData,
    openAssignmentsTabIdx,
  } = state.assignments;
  const { caseDetails, pages } = state.cases;

  return {
    openAssignments: openAssignments,
    assignmentDetails: assignmentDetails,
    caseDetails: caseDetails,
    pages: pages,
    activeIndex: activeIndex,
    worklistSettings,
    openCasesData,
    openAssignmentsTabIdx,
  };
}

const connectedWorkarea = connect(mapStateToProps)(Workarea);
export { connectedWorkarea as Workarea };
