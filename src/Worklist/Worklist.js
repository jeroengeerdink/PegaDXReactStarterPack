import React, { Component } from "react";
import { connect } from "react-redux";
import {
  Header,
  Segment,
  Table,
  Pagination,
  Dropdown,
  Container,
  Button,
  Icon,
  Grid,
} from "semantic-ui-react";

import _ from "lodash";
import { format as datefn_format, parseISO as datefn_parseISO } from "date-fns";

import { caseActions, workQueueActions } from "../_actions";
import { assignmentActions } from "../_actions";

/**
 * React component to show WorkLists and WorkQueues
 */
class Worklist extends Component {
  constructor(props) {
    super(props);

    this.state = {
      column: props.worklistSettings.column,
      direction: props.worklistSettings.direction,
      searchText: "",
      pageSize: 10,
      pages: {
        Worklist: 1,
      },
      current: props.worklistSettings.assignmentType,
      loading: false,
    };
  }

  componentDidMount() {
    this.refreshWorklist(this.state.current);
  }

  componentWillUnmount() {
    this.props.dispatch(
      assignmentActions.saveWorklistSettings(
        this.state.column,
        this.state.direction,
        this.state.current
      )
    );
  }

  refreshWorklist(basketId) {
    if (basketId !== "Worklist") {
      this.setState({ loading: true });
      this.props
        .dispatch(workQueueActions.getWorkQueue(basketId))
        .then(() => this.setState({ loading: false }));
    } else {
      this.props.dispatch(workQueueActions.getWorkList());
    }
  }

  getNextAssignment() {
    this.setState({ loading: true });
    this.props
      .dispatch(assignmentActions.getNextAssignment())
      .then((action) => {
        if (action) {
          this.setState({ loading: false });
        }
      });
  }

  openAssignment(id, caseID) {
    this.props.dispatch(assignmentActions.addOpenAssignment(caseID));
    this.props.dispatch(assignmentActions.getAssignment(id));
    this.props.dispatch(caseActions.getCase(caseID));
  }

  sortAssignments(targetList, column, direction) {
    if (column === "pxRefObjectInsName") {
      targetList = targetList.sort((x, y) => {
        const prefixX = x.pxRefObjectInsName.split("-");
        const prefixY = y.pxRefObjectInsName.split("-");

        if (prefixX[0] !== prefixY[0]) {
          if (prefixX[0] < prefixY[0]) return -1;
          if (prefixX[0] > prefixY[0]) return 1;
          return 0;
        }
        return prefixX[1] - prefixY[1];
      });
    } else {
      targetList = _.sortBy(targetList, [column]);
    }
    if (direction === "descending") {
      targetList = targetList.reverse();
    }
    return targetList;
  }

  filterAssignments(targetList, searchText) {
    if (searchText) {
      targetList = targetList.filter((item) =>
        item.pxRefObjectInsName.includes(searchText)
      );
    }
    return targetList;
  }

  getTableData() {
    let targetList =
      this.state.current === "Worklist"
        ? this.props.workList
        : this.props.workQueues[this.state.current];

    if (targetList && targetList.length > 0) {
      const { column, direction, searchText } = this.state;
      targetList = this.filterAssignments(targetList, searchText);
      targetList = this.sortAssignments(targetList, column, direction);
    }
    return targetList ? targetList : [];
  }

  getTableRows(data, startIndex, endIndex) {
    let targetList = data;
    if (targetList && targetList.length > 0) {
      return targetList.slice(startIndex, endIndex).map((entry) => {
        let createDateTime = datefn_format(
          datefn_parseISO(entry.pxCreateDateTime.replace("GMT", "Z")),
          "PPPP p"
        );
        return (
          <Table.Row
            onClick={(e) =>
              this.openAssignment(entry.pzInsKey, entry.pxRefObjectKey)
            }
            key={entry.pxRefObjectKey}
          >
            <Table.Cell>{entry.pxRefObjectInsName}</Table.Cell>
            <Table.Cell>{entry.pyAssignmentStatus}</Table.Cell>
            <Table.Cell>{entry.pyLabel}</Table.Cell>
            <Table.Cell>{entry.pxUrgencyAssign}</Table.Cell>
            <Table.Cell>{createDateTime}</Table.Cell>
          </Table.Row>
        );
      });
    }

    // No entries found for current workbasket, this is to demonstrate no rows
    return (
      <Table.Row>
        <Table.Cell>---</Table.Cell>
        <Table.Cell />
        <Table.Cell />
      </Table.Row>
    );
  }

  getTotalPagesForCurrent(data, pageSize) {
    let count = data.length / pageSize;
    return Math.ceil(count);
  }

  handleSort(clickedColumn) {
    const { column, direction } = this.state;

    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        direction: "ascending",
      });
    } else {
      this.setState({
        direction: direction === "ascending" ? "descending" : "ascending",
      });
    }
  }

  getWorkItemTableFromAssignments() {
    const { pages, current, column, direction } = this.state;
    let data = this.getTableData();

    const activePage = pages[current] ? pages[current] : 1;
    let pageSize = this.state.pageSize;
    const endIndex = activePage * pageSize;
    const startIndex = endIndex - pageSize;
    let rows = this.getTableRows(data, startIndex, endIndex);

    const totalPages = this.getTotalPagesForCurrent(data, pageSize);
    const pageOptions = [
      { key: 5, text: "5", value: 5 },
      { key: 10, text: "10", value: 10 },
      { key: 20, text: "20", value: 20 },
      { key: 30, text: "30", value: 30 },
      { key: 50, text: "50", value: 50 },
    ];

    return (
      <div>
        <Table celled sortable striped selectable compact color="blue">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                width="3"
                sorted={column === "pxRefObjectInsName" ? direction : null}
                onClick={() => this.handleSort("pxRefObjectInsName")}
              >
                Case
              </Table.HeaderCell>
              <Table.HeaderCell
                width="3"
                sorted={column === "pyAssignmentStatus" ? direction : null}
                onClick={() => this.handleSort("pyAssignmentStatus")}
              >
                Status
              </Table.HeaderCell>
              <Table.HeaderCell
                width="3"
                sorted={column === "pyLabel" ? direction : null}
                onClick={() => this.handleSort("pyLabel")}
              >
                Category
              </Table.HeaderCell>
              <Table.HeaderCell
                width="3"
                sorted={column === "pxUrgencyAssign" ? direction : null}
                onClick={() => this.handleSort("pxUrgencyAssign")}
              >
                Urgency
              </Table.HeaderCell>
              <Table.HeaderCell
                sorted={column === "pxCreateDateTime" ? direction : null}
                onClick={() => this.handleSort("pxCreateDateTime")}
              >
                Create Date
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>{rows}</Table.Body>
        </Table>

        <Container fluid>
          <Pagination
            activePage={activePage}
            totalPages={totalPages}
            onPageChange={(e, rows) => this.changePage(e)}
          />

          <Dropdown
            selection
            floating
            labeled
            style={{ float: "right" }}
            options={pageOptions}
            onChange={(e, obj) => this.handlePageSizeChange(e, obj)}
            text={this.state.pageSize + " records"}
          />
          <label style={{ float: "right", marginTop: "10px" }}>
            Rows per page:&nbsp;&nbsp;
          </label>
        </Container>
      </div>
    );
  }

  handlePageSizeChange(e, obj) {
    let pageSize = obj.value;
    console.log(pageSize);
    this.setState({
      pageSize,
    });
  }

  changePage(e) {
    let activePage = e.target.getAttribute("value");
    this.setState({
      pages: {
        ...this.state.pages,
        [this.state.current]: activePage,
      },
    });
  }

  changeBasket(basketId) {
    this.setState({
      current: basketId,
    });

    this.refreshWorklist(basketId);
  }

  getHeaderContent() {
    if (this.props.workBaskets.length === 0) {
      return <Header.Content>Worklist</Header.Content>;
    }

    let workBaskets = this.props.workBaskets.slice(0);
    workBaskets.unshift("Worklist");

    return (
      <Dropdown
        text={
          this.state.current === "Worklist"
            ? this.state.current
            : /*"Workqueue for " + */ this.state.current
        }
      >
        <Dropdown.Menu>
          {workBaskets.map((wb, index) => {
            if (wb !== "") {
              return (
                <Dropdown.Item
                  key={wb}
                  text={wb}
                  onClick={() => this.changeBasket(wb)}
                />
              );
            } else {
              return null;
            }
          })}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  handleFilter(e) {
    let value = e.target.value;
    this.setState({
      searchText: value.toUpperCase(),
      pages: {
        Worklist: 1,
      },
    });
  }

  //<Header as="h3" textAlign="left">
  //

  render() {
    const no_border = { border: 0 };
    // Symantec-ui seems to use sizing units of 16 wide (this is why column grid widths add up to that number)
    return (
      <div>
        <Grid>
          <Grid.Column as="h3" width={4} textAlign="left">
            <Button
              basic
              color="blue"
              icon
              labelPosition="left"
              size="large"
              onClick={(e) => this.getNextAssignment()}
              loading={this.state.loading}
            >
              <Icon name="plus" />
              Get Next Work
            </Button>
          </Grid.Column>
          <Grid.Column as="h3" width={8} textAlign="center">
            {this.getHeaderContent()}
          </Grid.Column>
          <Grid.Column as="h4" width={4} textAlign="right">
            <Button
              basic
              color="blue"
              icon
              size="large"
              data-tooltip="Refresh list"
              data-inverted=""
              onClick={(e) => this.refreshWorklist(this.state.current)}
            >
              <Icon name="refresh" />
            </Button>
            <span style={{ paddingLeft: "1em" }} />
            <div className="ui icon input top aligned">
              <input
                type="text"
                placeholder="Search by case ID..."
                value={this.props.searchText}
                onChange={(e) => this.handleFilter(e)}
              />
              <i className="search icon" />
            </div>
          </Grid.Column>
        </Grid>
        <Segment.Group>
          <Segment
            loading={this.props.loading || this.state.loading}
            style={no_border}
          >
            {this.getWorkItemTableFromAssignments()}
          </Segment>
        </Segment.Group>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { cases, assignments } = state;
  return {
    cases: cases.cases,
    allAssignments: assignments.allAssignments,
    loading: assignments.loading,
    workBaskets: state.user.userData.workbaskets
      ? state.user.userData.workbaskets
      : [],
    workQueues: state.workqueue.workQueues,
    workList: state.workqueue.workList,
    worklistSettings: assignments.worklistSettings,
  };
}

const connectedWorklist = connect(mapStateToProps)(Worklist);
export { connectedWorklist as Worklist };
