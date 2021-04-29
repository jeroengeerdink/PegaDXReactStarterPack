import React, { Component } from "react";
import { connect } from "react-redux";
import { Form } from "semantic-ui-react";

import { dataPageService } from "../_services";

/**
 * Standardized component to handle dropdowns sourced from data pages.
 */
class DataPageDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      options: [],
    };
  }

  componentDidMount() {
    const { mode } = this.props;
    let params = this.buildDPParams(mode.dataPageParams);

    // Directly calling dataPageService methods so we do not have actions overhead.
    // This should be very narrow use case, specific to component.
    dataPageService.getDataPage(mode.dataPageID, params).then(
      (dataPage) => {
        this.setState({
          options: this.convertDataPageToOptions(dataPage),
        });
      },
      (error) => {
        this.setState({
          options: [{ key: error, text: error, value: error }],
        });
      }
    );
  }

  buildDPParams(dpParams) {
    let pPage = {};

    if (dpParams && dpParams.length > 0) {
      for (let i in dpParams) {
        let sVal = "";
        if (dpParams[i].value != null) {
          sVal = dpParams[i].value;
        } else {
          sVal = dpParams[i].valueReference.lastSavedValue;
        }

        pPage[dpParams[i].name] = sVal;
      }
    }
    return pPage;
  }

  convertDataPageToOptions(dataPage) {
    let { mode } = this.props;
    let options = [];

    // Value it the first advanced search entered entry (main result)
    let propName = mode.dataPageValue,
      propPrompt = mode.dataPagePrompt,
      propTooltip = mode.dataPageTooltip;

    if (propName.indexOf(".") === 0) {
      propName = propName.substring(1);
    }

    dataPage.pxResults.forEach((result) => {
      if (result[propName]) {
        options.push({
          key: result["pzInsKey"],
          text: result[propPrompt],
          value: result[propName],
          tooltip: result[propTooltip],
        });
      }
    });

    return options;
  }

  getOptions() {
    if (this.state.options.length > 0) {
      return this.state.options;
    } else {
      return [];
    }
  }

  render() {
    const { props } = this;

    return (
      <Form.Dropdown
        placeholder={props.placeholder}
        labeled={props.labeled}
        fluid={props.fluid}
        selection={props.selection}
        options={this.getOptions()}
        onChange={props.onChange}
        onBlur={props.onBlur}
        reference={props.reference}
        value={props.value}
        required={props.required}
        disabled={props.readOnly}
        error={props.error}
        label={props.label}
        {...props.tooltip}
      />
    );
  }
}

function mapStateToProps(state) {
  return {};
}

const connectedDataPageDropdown = connect(mapStateToProps)(DataPageDropdown);
export { connectedDataPageDropdown as DataPageDropdown };
