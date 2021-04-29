import React, { Component } from "react";
import { Search } from "semantic-ui-react";
import _ from "lodash";

import { dataPageService } from "../_services";
import { sourceTypes } from "../_constants";

/**
 * Standardized component to handle AutoCompletes sourced from data pages.
 */
class PegaAutoComplete extends Component {
  constructor(props) {
    super(props);

    const { mode } = this.props;
    let source = [];

    // If we are using a local list as source, set its value now
    if (
      mode.listSource === sourceTypes.LOCALLIST ||
      mode.listSource === sourceTypes.PAGELIST ||
      (mode.listSource === sourceTypes.DATAPAGE && mode.options != null)
    ) {
      // source = mode.options.map(option => {
      //   return { title: option.key, description: option.value };
      // });
      source = this.getAutoCompleteOptions(mode);
    }

    this.state = {
      isLoading: false,
      results: [],
      value: props.value,
      source: source,
    };
  }

  /**
   * Get dropdown options ffrom a clipboard page
   * @param { field }
   */

  getAutoCompleteOptions(mode) {
    let options = [];
    if (!mode) return options;

    if (mode && mode.listSource === sourceTypes.PAGELIST && !mode.options) {
      let pageId = mode.clipboardPageID;
      let clipboardPagePrompt = mode.clipboardPagePrompt;
      let clipboardPageValue = mode.clipboardPageValue;
      let clipboardPageTooltip = mode.clipboardPageTooltip;
      if (pageId && clipboardPagePrompt && clipboardPageValue) {
        let optionsPage = this.props.caseDetail.content[pageId];
        if (optionsPage && optionsPage.length > 0) {
          options = optionsPage.map((item) => {
            return {
              title: item[clipboardPageValue],
              description:
                clipboardPagePrompt && item[clipboardPagePrompt]
                  ? item[clipboardPagePrompt]
                  : "",
              tooltip:
                clipboardPageTooltip && item[clipboardPageTooltip]
                  ? item[clipboardPageTooltip]
                  : "",
            };
          });
        }
      }
    } else if (
      mode &&
      (mode.listSource === sourceTypes.LOCALLIST ||
        (mode.listSource === sourceTypes.DATAPAGE && mode.options != null) ||
        (mode.listSource === sourceTypes.PAGELIST && mode.options != null))
    ) {
      // key is the primary displayed value and value is the prompt
      options = mode.options.map((option) => {
        return {
          title: option.key,
          description: option.value ? option.value : "",
          tooltip: option.tooltip ? option.tooltip : "",
        };
      });
    }

    return options;
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

  componentDidMount() {
    const { mode } = this.props;

    // In the event that the autocomplete is sourced from a DataPage:
    // Directly call dataPageService methods so we do not have actions overhead.
    // This should be very narrow use case, specific to component.
    if (mode.listSource === sourceTypes.DATAPAGE && mode.options == null) {
      let params = this.buildDPParams(mode.dataPageParams);
      dataPageService.getDataPage(mode.dataPageID, params).then(
        (dataPage) => {
          this.setState({
            source: this.convertDataPageToSource(dataPage),
          });
        },
        (error) => {
          this.setState({
            source: [{ key: error, text: error, value: error }],
          });
        }
      );
    }
  }

  convertDataPageToSource(dataPage) {
    // dataPageValue is the primary displayed value (key) and dataPagePrompt is the (additional info) and dataPageTooltip is more addtl info
    let { mode } = this.props;
    let source = [];

    // Value it the first advanced search entered entry (main result)
    let propKey = mode.dataPageValue,
      propValue = mode.dataPagePrompt,
      propTooltip = mode.dataPageTooltip;

    // Is this important...how about for other entries?
    if (propKey.indexOf(".") === 0) {
      propKey = propKey.substring(1);
    }

    dataPage.pxResults.forEach((result) => {
      if (result[propKey]) {
        let entry = {
          title: result[propKey],
          description: propValue && result[propValue] ? result[propValue] : "",
          tooltip:
            propTooltip && result[propTooltip] ? result[propTooltip] : "",
        };
        source.push(entry);
      }
    });

    return source;
  }

  /**
   * Disable the ENTER key so that it doesn't invoke a defined onClick handler for the submit button (or the first button).
   *  If you really want to have the ENTER key within input fields to lead to submit, unwire this handler
   */
  disableEnter(e) {
    if (e.which === 13) {
      e.preventDefault();
    }
  }

  handleResultSelect = (e, { result }) => {
    // This is needed because otherwise we get a warning that we are accessing preventDefault() on a released
    // instances of the synthetic object. Should only be needed for AutoComplete and for small # of cases.
    if (!e) return;
    e.persist();

    this.setState({ value: result.title });
    this.props.onChange(
      e,
      {
        value: result.title,
        reference: this.props.reference,
      },
      this.props.onResultSelect
    );
  };

  handleSearchChange = (e, { value }) => {
    this.setState({ isLoading: true, value });

    setTimeout(() => {
      if (this.state.value.length < 1)
        return this.setState({ isLoading: false, results: [], value: "" });

      const re = new RegExp(_.escapeRegExp(this.state.value), "i");
      const isMatch = (result) => re.test(result.title);

      const filtered = _.filter(this.state.source, isMatch);

      this.setState({
        isLoading: false,
        results: filtered,
      });
    }, 300);
  };

  resultRenderer = ({ title, description, tooltip }) => (
    <div class="content">
      <span class="title">{title}</span>
      <span class="description results-padleft">{description}</span>
      <span class="description results-padleft">{tooltip}</span>
    </div>
  );

  render() {
    const tooltip = { ...this.props.tooltip };
    /* Note: The Semantic Search tag expects results attribute to be an array with entries having a title and description property */
    return (
      <div className="field">
        <label>{this.props.label}</label>
        <Search
          fluid
          placeholder={this.props.placeholder}
          loading={this.state.isLoading}
          onResultSelect={this.handleResultSelect}
          onSearchChange={_.debounce(this.handleSearchChange, 500, {
            leading: true,
          })}
          onKeyPress={(e) => this.disableEnter(e)}
          results={this.state.results}
          resultRenderer={this.resultRenderer}
          value={this.state.value}
          {...tooltip}
        />
      </div>
    );
  }
}

export { PegaAutoComplete };
