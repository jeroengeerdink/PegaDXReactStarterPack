/* eslint no-eval: 0 */
import React, { Component } from "react";
import { connect } from "react-redux";
import {
  Header,
  Checkbox,
  Form,
  Grid,
  Divider,
  Table,
  Button,
  Icon,
  Popup,
  Segment,
  Label,
  Radio,
} from "semantic-ui-react";
import _, { isDate } from "lodash";
import {
  isValid as datefn_isValid,
  format as datefn_format,
  formatDistanceToNow as datefn_fromNow,
  formatISO as datefn_formatISO,
  parseISO as datefn_parseISO,
} from "date-fns";
import DatePicker from "react-datepicker";

import { assignmentActions, caseActions } from "../_actions";
import {
  fieldTypes,
  sourceTypes,
  layoutTypes,
  gridTypes,
  pageNames,
  actionNames,
  iconSources,
} from "../_constants";
import { DataPageDropdown, PegaAutoComplete } from "../_components";
import { ReferenceHelper, htmlDecode, getImageInfo } from "../_helpers";
import { errorActions } from "../_actions";

// import { locale } from "core-js";

/**
 * Component to handle building forms from Pega layout APIs
 * Can be used to build an entire form, page, or single view.
 */
class PegaForm extends Component {
  /**
   * Constructor stores WorkObject
   * @param { Object } workObject - React component corresponding to the WorkObject
   */
  constructor(props) {
    super(props);

    this.supportedActions = [
      actionNames.POST_VALUE,
      actionNames.SET_VALUE,
      actionNames.REFRESH,
      actionNames.PERFORM_ACTION,
      actionNames.RUN_SCRIPT,
      actionNames.OPEN_URL,
    ];

    let viewOrPage = props.view ? props.view : props.page;

    this.state = {
      values:
        this.props.openCasesData &&
        this.props.openCasesData[this.props.caseID] &&
        Object.keys(this.props.openCasesData[this.props.caseID]).length !== 0
          ? this.props.openCasesData[this.props.caseID]
          : ReferenceHelper.getInitialValuesFromView(viewOrPage),
      loadingElems: {},
      validationErrors: this.getValidationErrorsByKey(props.validationErrors),
      processID:
        props.page && props.page.processID ? props.page.processID : null,
      bUseLocalOptionsForDataPage:
        localStorage.getItem("useLocalOptionsForDataPage") === "1",
      bUseLocalOptionsForClipboardPage:
        localStorage.getItem("useLocalOptionsForClipboardPage") === "1",
      bUsePostAssignSave:
        localStorage.getItem("usePostAssignmentsSave") === "1",
    };
  }

  /**
   * Hooking into lifecycle methods to ensure when getting a new view, we initialize
   * the state of the values object.
   * Also using this hook to ensure validationErrors are stored correctly.
   * @param { Object } nextProps
   * @param { Object } nextState
   */
  componentWillUpdate(nextProps, nextState) {
    if (!_.isEqual(nextProps.view, this.props.view)) {
      // If we have a new view, reinitialize our values
      this.setState({
        values: ReferenceHelper.getInitialValuesFromView(nextProps.view),
      });
    } else if (nextProps.page && !this.props.page) {
      // If we are getting a new page (harness), we may need values from its fields
      this.setState({
        values: ReferenceHelper.getInitialValuesFromView(nextProps.page),
      });
    } else if (nextProps.forceRefresh && !this.props.forceRefresh) {
      // If we have performed a case-level refresh, we want to force reinitialize the values
      this.setState({
        values: ReferenceHelper.getInitialValuesFromView(nextProps.view),
      });
      this.props.resetForceRefresh();
    }

    if (
      nextProps.validationErrors &&
      !_.isEqual(this.props.validationErrors, nextProps.validationErrors)
    ) {
      this.setState({
        validationErrors: this.getValidationErrorsByKey(
          nextProps.validationErrors
        ),
      });
    }
  }

  // static getDerivedStateFromProps(props, state) {
  //   console.log("From getDrivedStateFromProps");
  // }

  componentWillUnmount() {
    this.props.dispatch(
      assignmentActions.saveCaseData(this.props.caseID, this.state.values)
    );
  }

  /**
   * Top level method to be called when generating the form.
   * @return { Object } React component for the form
   * Note: The type="button" for non-primary buttons is important if you wanted ENTER key to invoke the primary button click
   */
  getForm() {
    return (
      <Form
        warning
        onSubmit={() => this.handleSubmit()}
        loading={this.props.loading}
      >
        <Segment attached="top">
          <Header as="h2" textAlign="center">
            {this.props.header}
          </Header>
        </Segment>

        <Segment
          attached
          className={
            this.props.view && this.getFirstLayoutStyle(this.props.view)
          }
        >
          {this.props.view && this.createView(this.props.view)}
        </Segment>
        <Segment attached="bottom" style={{ overflow: "hidden" }}>
          <Button.Group floated="left">
            <Button
              type="button"
              onClick={(e, data) => this.handleCancel(e, data)}
            >
              Cancel
            </Button>
          </Button.Group>
          <Button.Group floated="right">
            <Button
              type="button"
              onClick={(e, data) => this.handleSave(e, data)}
            >
              Save
            </Button>
            <Button type="submit" primary>
              Submit
            </Button>
          </Button.Group>
        </Segment>
      </Form>
    );
  }

  /**
   * Top level method to call when generating a page. (Pega harness)
   * @return { Object } React component for the page
   */
  getPage() {
    const isNew = this.props.page.name === pageNames.NEW;
    const isConfirm = this.props.page.name === pageNames.CONFIRM;

    return (
      <Form onSubmit={isNew ? () => this.handleCaseCreate() : null}>
        <Segment attached="top">
          <Header as="h2" textAlign="center">
            {this.props.page.name}
            {isConfirm && (
              <Header.Subheader>
                Status: {this.props.caseStatus}
              </Header.Subheader>
            )}
          </Header>
        </Segment>
        <Segment attached={isNew ? true : "bottom"}>
          {this.props.page && this.createView(this.props.page)}
        </Segment>
        {isNew && (
          <Segment attached="bottom">
            <Button type="submit" primary>
              Submit
            </Button>
          </Segment>
        )}
        {isConfirm && (
          <div className="middle aligned row">
            <Grid centered>
              <Grid.Column textAlign="center">
                <Button
                  primary
                  onClick={(e, data) => this.handleCancel(e, data)}
                >
                  Close
                </Button>
              </Grid.Column>
            </Grid>
          </div>
        )}
      </Form>
    );
  }

  /**
   * Top level method to call when generating a standalone view for case. (Section)
   * @return { Object } React component for the view
   */
  getCaseView() {
    const { caseView } = this.props;

    if (!caseView) {
      return <Segment loading />;
    }

    return (
      <Form>
        <Segment attached="top">
          <Header as="h2" textAlign="center">
            {caseView.name}
          </Header>
        </Segment>
        <Segment attached="bottom">{this.createView(caseView)}</Segment>
      </Form>
    );
  }

  /**
   * Create a view.
   * @param { Object } view - view returned from the API. Can be a nested view.
   * @param { int } index - index for elem. Needed for unique component keys.
   * @return { Object } React component with all the view's children.
   */
  createView(view, index = 0) {
    if (view.visible === false) {
      return null;
    }

    return (
      <div key={index}>
        {view.groups.map((group, childIndex) => {
          return this.createGroup(group, childIndex);
        })}
      </div>
    );
  }

  /**
   * Create a group.
   * @param { Object } group - Single group returned from API.
   * @param { int } index - index for elem. Needed for unique component keys.
   * @param { boolean } [showLabel=true] - whether to display the label
   * @return { Object } React component with all the group's children.
   */
  createGroup(group, index = 0, showLabel = true) {
    if (group.view) {
      // DigExp app (particularly the Repeats screen) looks bad with these dividers so removing them
      // const incDivider = group.view.visible;
      const incDivider = false;

      return (
        <div key={index}>
          {incDivider && <Divider />}
          {this.createView(group.view, index)}
        </div>
      );
    }

    if (group.layout) {
      return this.createLayout(group.layout, index);
    }

    if (group.paragraph) {
      return this.createParagraph(group.paragraph, index);
    }

    if (group.caption) {
      return this.createCaption(group.caption, index);
    }

    if (group.field) {
      return this.createField(group.field, index, showLabel);
    }
  }

  /**
   * Create a layout.
   * @param { Object } layout - Single layout returned from API.
   * @param { int } index - index for elem. Needed for unique component keys.
   * @return { Object } React component with all the layout's children.
   */
  createLayout(layout, index = 0) {
    if (layout.visible === false) {
      return;
    }

    let header = layout.title ? (
      <Header as="h3" textAlign="left">
        {htmlDecode(layout.title)}
      </Header>
    ) : null;

    switch (layout.groupFormat) {
      case layoutTypes.INLINE_GRID_DOUBLE:
        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            <Grid columns={2}>
              <Grid.Row>
                {layout.groups.map((group, childIndex) => {
                  return (
                    <Grid.Column width={8} key={childIndex}>
                      {this.createGroup(group)}
                    </Grid.Column>
                  );
                })}
              </Grid.Row>
            </Grid>
          </div>
        );
      case layoutTypes.INLINE_GRID_TRIPLE:
        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            <Grid columns={3}>
              <Grid.Row>
                {layout.groups.map((group, childIndex) => {
                  return (
                    <Grid.Column key={childIndex}>
                      {this.createGroup(group)}
                    </Grid.Column>
                  );
                })}
              </Grid.Row>
            </Grid>
          </div>
        );
      case layoutTypes.INLINE_GRID_70_30:
      case layoutTypes.INLINE_GRID_30_70:
        let colWidths =
          layout.groupFormat === layoutTypes.INLINE_GRID_70_30
            ? [11, 5]
            : [5, 11];

        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            <Grid columns={2}>
              <Grid.Row>
                {layout.groups.map((group, childIndex) => {
                  return (
                    <Grid.Column width={colWidths[childIndex]} key={childIndex}>
                      {this.createGroup(group)}
                    </Grid.Column>
                  );
                })}
              </Grid.Row>
            </Grid>
          </div>
        );
      case layoutTypes.STACKED:
        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            {layout.groups.map((group, childIndex) => {
              return this.createGroup(group, childIndex);
            })}
          </div>
        );
      case layoutTypes.GRID:
        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            {this.createGrid(layout, index)}
          </div>
        );
      case layoutTypes.DYNAMIC:
        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            {layout.rows.map((row, childIndex) => {
              return row.groups.map((group, childIndexB) => {
                return this.createGroup(group, childIndexB);
              });
            })}
          </div>
        );
      case layoutTypes.INLINE_MIDDLE:
        let cols = 1 + layout.groups.length;
        return (
          <div className={this.getLayoutStyle(layout)} key={index}>
            {header}
            <Grid columns={cols}>
              <Grid.Row>
                {layout.groups.map((group, childIndex) => {
                  return (
                    <Grid.Column key={childIndex} flex>
                      {this.createGroup(group)}
                    </Grid.Column>
                  );
                })}
                <Grid.Column width={1} />
              </Grid.Row>
            </Grid>
          </div>
        );
      default:
        console.log(
          "Unexpected layout type encountered: " + layout.groupFormat
        );
      case layoutTypes.DEFAULT:
      case layoutTypes.EMPTY:
      case layoutTypes.MIMIC_A_SENTENCE:
        /* Will enable the ones below once I see a screen which utilizes these */
        //case layoutTypes.ACTION_AREA:
        //case layoutTypes.SIMPLE_LIST:
        if (layout.groups) {
          return (
            <div className={this.getLayoutStyle(layout)} key={index}>
              {header}
              {layout.groups.map((group, childIndex) => {
                return this.createGroup(group, childIndex);
              })}
            </div>
          );
        }

        if (layout.view) {
          return (
            <div className={this.getLayoutStyle(layout)} key={index}>
              {header}
              {this.createView(layout.view)}
            </div>
          );
        }
        break;
    }
  }

  /**
   * Get layout style
   * @param { layout } layout - Single layout returned from API, that contains a grid.
   */

  getLayoutStyle(layout) {
    let layoutStyle = "";
    if (layout && layout.containerFormat) {
      if (layout.containerFormat.toUpperCase() === "WARNINGS") {
        layoutStyle = "layout-warning";
      } else if (layout.containerFormat.toUpperCase() === "ERROR") {
        layoutStyle = "layout-error";
      }
    }
    return layoutStyle;
  }

  /**
   * Get First Layout style within view.  Used to propogate up the warning or error style to outer container.
   * @param { layout } view - Single view returned from API.
   */

  getFirstLayoutStyle(view) {
    let layoutStyle = "";
    if (view.groups) {
      for (let i = 0; i < view.groups.length; i++) {
        if (view.groups[i].layout && view.groups[i].layout.visible) {
          layoutStyle = this.getLayoutStyle(view.groups[i].layout);
          break;
        }
      }
    }
    return layoutStyle;
  }

  /**
   * Create a grid. For PageGroups and PageLists.
   * @param { Object } layout - Single layout returned from API, that contains a grid.
   * @param { int } index - index for elem. Needed for unique component keys.
   * @return { Object } React component with all the grid's children.
   */
  createGrid(layout, index = 0) {
    const reference = layout.reference;

    const actionHandler =
      layout.referenceType === gridTypes.GROUP
        ? (e, data) => this.handleGroupActions(e, data)
        : (e, data) => this.handleListActions(e, data);

    const footerWidth =
      layout.referenceType === gridTypes.GROUP
        ? layout.header.groups.length + 1
        : layout.header.groups.length;

    return (
      <Table compact key={index}>
        <Table.Header>
          <Table.Row>
            {layout.header.groups.map((group, childIndex) => {
              return (
                <Table.HeaderCell key={childIndex}>
                  {this.createGroup(group, childIndex)}
                </Table.HeaderCell>
              );
            })}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {layout.rows.map((row, childIndex) => {
            return (
              <Table.Row key={childIndex}>
                {row.groups.map((group, childIndexB) => {
                  return (
                    <Table.Cell key={childIndexB}>
                      {this.createGroup(group, childIndexB, false)}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            );
          })}
        </Table.Body>
        <Table.Footer fullWidth>
          <Table.Row>
            <Table.HeaderCell colSpan={footerWidth}>
              <Button
                icon
                labelPosition="left"
                primary
                size="small"
                onClick={actionHandler}
                action={"add"}
                reference={reference}
                referencetype={layout.referenceType}
                loading={this.state.loadingElems[reference]}
              >
                <Icon name="plus" /> Add Row
              </Button>
              <Button
                icon
                labelPosition="left"
                negative
                size="small"
                onClick={actionHandler}
                action={"remove"}
                reference={reference}
                referencetype={layout.referenceType}
                loading={this.state.loadingElems[reference]}
              >
                <Icon name="minus" /> Delete Row
              </Button>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    );
  }

  /**
   * Create a paragraph
   * @param { Object } paragraph - Paragraph returned from API
   * @param { int } index - index for elem. Needed for unique component keys.
   * @return { Object } React component corresponding to the paragraph.
   */
  createParagraph(paragraph, index) {
    if (!paragraph.visible) {
      return null;
    }

    return (
      <div key={index} dangerouslySetInnerHTML={{ __html: paragraph.value }} />
    );
  }

  /**
   * Create a caption
   * @param { Object } caption - caption returned from API
   * @param { int } index - index for elem. Needed for unique component keys.
   * @return { Object } React component corresponding to the paragraph.
   */
  createCaption(caption, index) {
    return this.getReadOnlyText(htmlDecode(caption.value), "", index);
  }

  /**
   * Create a field.
   * @param { Object } field - Single field returned from API.
   * @param { int } index - index for elem. Needed for unique component keys.
   * @return { Object } React component correpsonding to the field.
   */
  createField(field, index, showLabel) {
    if (field.visible === false) {
      return;
    }

    let fieldElem;

    let value = this.state.values[field.reference];
    if (value === undefined || value === null) {
      value = htmlDecode(field.value);
      if (!value) value = "";
    }

    const handleChange = (e, data, callback) =>
      this.handleChange(e, data, callback);

    // handleEvent doesn't do any filtering of actions based on the current event type, whereas handleNamedEvent does
    let handleEvent = this.generateEventHandler(field);
    // Previously the Dropdown element's onblur handler was using handleEvent.  This causes issues
    let handleNamedEvent = (e, data) => this.generateEventHandler(field, e);

    const required = field.required ? true : false;
    const readOnly = field.readOnly ? true : false;
    const disabled = field.disabled ? true : false;
    const bModesExist = field.control.modes && field.control.modes.length > 0;

    let label = null;

    if (showLabel) {
      if (!field.label && field.labelReserveSpace) {
        label = " ";
      } else if (field.label) {
        let bStripOuterQuotes = false;
        switch (field.control.type) {
          case fieldTypes.LINK:
          case fieldTypes.CHECKBOX:
          case fieldTypes.BUTTON:
            bStripOuterQuotes = true;
            break;
          default:
            break;
        }
        label = htmlDecode(field.label, bStripOuterQuotes);
      }
    }

    let error = false;
    let errorMessage;

    if (this.state.validationErrors[field.reference]) {
      error = true;
      errorMessage = this.state.validationErrors[field.reference];
    } else if (field.validationMessages && value === field.value) {
      error = true;
      errorMessage = field.validationMessages;
    }

    switch (field.control.type) {
      case fieldTypes.CHECKBOX:
        value = field.value === "true" || value === true;
        if (readOnly) {
          let displayValue = this.getDisplayTextFormattedValue(field);
          fieldElem = this.getReadOnlyText(label, displayValue, index);
        } else if (
          bModesExist &&
          field.control.modes[0].captionPosition === "left"
        ) {
          fieldElem = (
            <div key={index}>
              <label class="readonlytext-label">
                {field.showLabel && label}
              </label>
              <Form.Field
                key={index}
                required={required}
                disabled={disabled}
                error={error}
                reference={field.reference}
                {...this.getTooltip(field)}
              >
                <div class="inline">
                  <label
                    class="field"
                    for={field.reference}
                    style={{ paddingRight: ".5em", userSelect: "none" }}
                  >
                    {htmlDecode(field.control.label)}
                  </label>
                  <Checkbox
                    name={field.name}
                    defaultChecked={value}
                    id={field.reference}
                    onChange={(e, data) => {
                      handleChange(e, data, handleEvent);
                    }}
                  />
                </div>
              </Form.Field>
            </div>
          );
        } else {
          fieldElem = (
            <div key={index}>
              <label class="readonlytext-label">
                {field.showLabel && label}
              </label>
              <Form.Checkbox
                key={index}
                required={required}
                disabled={disabled}
                error={error}
                name={field.name}
                label={htmlDecode(field.control.label)}
                defaultChecked={value}
                onChange={(e, data) => {
                  handleChange(e, data, handleEvent);
                }}
                reference={field.reference}
                {...this.getTooltip(field)}
              />
            </div>
          );
        }
        break;
      case fieldTypes.RADIOBUTTONS:
        // Radio buttons do not explicitly look at listSources presently.  API should map DP or CP data to local options
        if (readOnly) {
          fieldElem = this.getReadOnlyText(
            label,
            htmlDecode(field.value),
            index
          );
        } else {
          let labelClass =
            "readonlytext-label" + (disabled ? " disabled field " : "");
          fieldElem = (
            <div key={index} style={{ padding: "5px" }}>
              <label className={labelClass} {...this.getTooltip(field)}>
                {label}
              </label>
              {bModesExist &&
                field.control.modes[0].options.map((option) => {
                  // Appears the value might be encoded but not the key when using property type "Prompt list" but both are encoded when
                  //  using property type "Local list".  Best to always decode both values
                  let decodedKey = htmlDecode(option.key);
                  let checked = decodedKey === value;
                  return (
                    <Form.Field
                      key={decodedKey}
                      disabled={disabled || readOnly}
                      control={Radio}
                      label={htmlDecode(option.value)}
                      value={decodedKey}
                      reference={field.reference}
                      onChange={(e, data) =>
                        this.handleChange(e, data, handleEvent)
                      }
                      checked={checked}
                    />
                  );
                })}
            </div>
          );
        }
        break;
      case fieldTypes.AUTOCOMPLETE:
        if (readOnly) {
          fieldElem = this.getReadOnlyText(
            label,
            htmlDecode(field.value),
            index
          );
        } else {
          let mode = bModesExist ? field.control.modes[0] : {};
          let placeholder = mode.placeholder
            ? this.getPropertyValue(mode.placeholder)
            : "";
          // If don't want to use mode.options...null it out.  Using this as a mechanism to always load the DP (rather
          //  than passing in or re-reading the bUseLocalOptionsForDataPage value currently set)
          if (
            (mode.listSource === sourceTypes.DATAPAGE &&
              !this.state.bUseLocalOptionsForDataPage) ||
            (mode.listSource === sourceTypes.PAGELIST &&
              !this.state.bUseLocalOptionsForClipboardPage)
          ) {
            mode.options = null;
          }
          fieldElem = (
            <PegaAutoComplete
              key={index}
              mode={mode}
              caseDetail={this.props.caseDetail}
              reference={field.reference}
              onChange={(e, data) => this.handleChange(e, data, handleEvent)}
              onResultSelect={handleEvent}
              value={value}
              required={required}
              disabled={disabled || readOnly}
              error={error}
              label={label}
              placeholder={placeholder}
              tooltip={this.getTooltip(field)}
            />
          );
        }
        break;
      case fieldTypes.DROPDOWN:
        if (readOnly) {
          fieldElem = this.getReadOnlyText(
            label,
            htmlDecode(field.value),
            index
          );
        } else {
          let control = field.control;
          let mode = bModesExist ? control.modes[0] : {};
          let placeholder = mode.placeholder
            ? this.getPropertyValue(mode.placeholder)
            : "";
          if (
            mode.listSource === sourceTypes.DATAPAGE &&
            !this.state.bUseLocalOptionsForDataPage
          ) {
            fieldElem = (
              <DataPageDropdown
                key={index}
                placeholder={placeholder}
                labeled
                fluid
                selection
                mode={mode}
                reference={field.reference}
                onChange={(e, data) => this.handleChange(e, data, handleEvent)}
                onBlur={handleNamedEvent}
                value={value}
                required={required}
                disabled={disabled}
                error={error}
                label={label}
                tooltip={this.getTooltip(field)}
              />
            );
          } else {
            let options = this.getDropdownOptions(field);
            fieldElem = (
              <div key={index} style={{ marginBottom: 14 }}>
                <Form.Dropdown
                  required={required}
                  disabled={disabled}
                  error={error}
                  label={label}
                  name={field.name}
                  placeholder={placeholder}
                  labeled
                  fluid
                  selection
                  options={options}
                  onChange={(e, data) => {
                    handleChange(e, data, handleEvent);
                  }}
                  onBlur={handleNamedEvent}
                  reference={field.reference}
                  value={value}
                  {...this.getTooltip(field)}
                />
              </div>
            );
          }
        }
        break;
      case fieldTypes.EMAIL:
      case fieldTypes.PHONE:
      case fieldTypes.INTEGER:
      case fieldTypes.NUMBER:
      case fieldTypes.URL:
      case fieldTypes.CURRENCY:
      case fieldTypes.TEXTINPUT:
        if (readOnly) {
          fieldElem = this.getReadOnlyText(
            label,
            htmlDecode(field.value),
            index,
            field
          );
        } else {
          // let isNum =
          //   field.control.type === fieldTypes.INTEGER ||
          //   field.control.type === fieldTypes.NUMBER ||
          //   field.control.type === fieldTypes.CURRENCY;
          let type = this.getFormatType(field);
          // For type==="tel" fields might look at tooltip value and see if it a pattern to try to do
          //  client side validation...but look awkward if we display a tooltip pattern that is different
          //  than the placehoder pattern.  Disabling the tel pattern for now
          // let pattern = type === "tel" ? { pattern: "[0-9]{3}-[0-9]{3}-[0-9]{4}" } : {};
          let pattern = {};
          let mode = bModesExist ? field.control.modes[0] : {};
          let placeholder = mode.placeholder
            ? this.getPropertyValue(mode.placeholder)
            : "";
          let telPlaceholder = null;
          if (type === "tel") {
            telPlaceholder = this.getTooltip(field);
          }
          value = htmlDecode(value);
          fieldElem = (
            <Form.Input
              key={index}
              required={required}
              disabled={disabled}
              name={field.name}
              type={type}
              fluid
              {...pattern}
              label={label}
              placeholder={
                placeholder
                  ? placeholder
                  : telPlaceholder && telPlaceholder["data-tooltip"]
                  ? telPlaceholder["data-tooltip"]
                  : ""
              }
              onChange={handleChange}
              onKeyPress={(e) => this.disableEnter(e)}
              onBlur={handleEvent}
              value={value}
              reference={field.reference}
              error={error}
              {...this.getTooltip(field)}
            />
          );
        }
        break;
      case fieldTypes.TEXTAREA:
        if (readOnly) {
          fieldElem = this.getReadOnlyText(
            label,
            htmlDecode(field.value),
            index
          );
        } else {
          let mode = bModesExist ? field.control.modes[0] : {};
          let placeholder =
            mode && mode.placeholder
              ? this.getPropertyValue(mode.placeholder)
              : "";
          fieldElem = (
            <div key={index} {...this.getTooltip(field)}>
              <Form.TextArea
                required={required}
                disabled={disabled}
                name={field.name}
                label={label}
                placeholder={placeholder}
                onChange={handleChange}
                onBlur={handleEvent}
                value={value}
                reference={field.reference}
                error={error}
              />
            </div>
          );
        }
        break;
      case fieldTypes.DISPLAYTEXT:
        let displayTextVal = field.value;
        if (field.type === "Date Time") {
          // displayTextVal.replace("GMT", "+0000"),
          displayTextVal = datefn_fromNow(
            datefn_parseISO(displayTextVal.replace(" GMT", "Z"))
          );
        } else {
          displayTextVal = this.getDisplayTextFormattedValue(field);
        }
        fieldElem = this.getReadOnlyText(label, displayTextVal, index, field);
        break;
      case fieldTypes.DATETIME:
        if (readOnly) {
          const displayDate = this.getDisplayTextFormattedValue(field);
          fieldElem = this.getReadOnlyText(label, displayDate, index, field);
        } else {
          let date = value ? datefn_parseISO(value) : new Date();
          if (date && !datefn_isValid(date)) {
            date = new Date();
          }
          /* Check if any action sets are defined...if so we want to fire appropriate events and since the datepicker
           *  isn't firing on blur, we will debounce the onchange in that scenario.
           */
          let bHasActions = !!this.actionSetChecker(
            field,
            this.supportedActions
          );
          // label attribute to Form.Field is mutually exclusive of children, but just specifying label element with label
          //  seems to achieve the same (gets styled same as if label was specified)
          fieldElem = (
            <Form.Field
              key={index}
              required={required}
              disabled={disabled}
              error={error}
              {...this.getTooltip(field)}
            >
              <label>{label}</label>
              <DatePicker
                selected={date}
                onChange={
                  bHasActions
                    ? _.debounce((date) => {
                        if (date) {
                          handleChange(
                            date,
                            { name: field.name, reference: field.reference },
                            handleEvent,
                            field
                          );
                        }
                      }, 500)
                    : (date) => {
                        if (date) {
                          handleChange(
                            date,
                            { name: field.name, reference: field.reference },
                            null,
                            field
                          );
                        }
                      }
                }
              />
            </Form.Field>
          );
        }
        break;
      case fieldTypes.BUTTON:
        let buttonFormat = this.getButtonFormat(field);
        fieldElem = (
          <Form.Button
            key={index}
            content={htmlDecode(field.control.label)}
            name={field.name}
            required={required}
            disabled={readOnly || disabled}
            onClick={handleEvent}
            label={field.showLabel ? label : null}
            reference={field.reference}
            {...this.getTooltip(field)}
            {...buttonFormat}
          />
        );
        break;
      case fieldTypes.LABEL:
        fieldElem = (
          <Label key={index} size="large">
            {label}
          </Label>
        );
        break;
      case fieldTypes.LINK:
        const linkMode = bModesExist ? field.control.modes[0] : {};
        const href = this.getPropertyValue(linkMode.linkData);
        let linkStyle = this.getLinkFormat(field);
        linkStyle["paddingLeft"] = 0;

        // Images can be displayed with class attribute on the <i> tag.  This is what both Pega and Semantic
        //  do.  Problem is mapping the class attributes from pega to meaningufl Semantic values.
        let linkImgInfo = getImageInfo(
          linkMode.linkImageSource,
          linkMode.linkStyle,
          linkMode.linkStandard,
          linkMode.linkImage
        );
        let bLinkOnLeft =
          linkMode.linkImageSource &&
          linkMode.linkImageSource != "none" &&
          linkMode.linkIconClass != "" &&
          linkMode.linkImagePosition == "left";
        let bLinkOnRight =
          linkMode.linkImageSource &&
          linkMode.linkImageSource != "none" &&
          linkMode.linkIconClass != "" &&
          linkMode.linkImagePosition == "right";
        let link = null;

        if (linkImgInfo.src) {
          link = (
            <img src={linkImgInfo.src.default} alt="Link image from file" />
          );
        } else if (linkImgInfo.class && linkImgInfo.src != "") {
          link = <i class={linkImgInfo.class}></i>;
        } else {
          switch (linkMode.iconSource) {
            case iconSources.EXTERNAL_URL:
              link = (
                <img
                  src={linkMode.iconUrl}
                  alt="Icon from external URL"
                  onClick={handleEvent}
                />
              );
              break;
            case iconSources.PROPERTY:
              link = (
                <img
                  src={this.getPropertyValue(linkMode.linkProperty)}
                  alt="Icon from property"
                  onClick={handleEvent}
                />
              );
              break;
            default:
              break;
          }
        }

        let labelClass =
          "readonlytext-label" + (disabled ? " disabled field" : "");
        fieldElem = (
          <div key={index} style={{ padding: "5px" }}>
            {field.showLabel && <label className={labelClass}>{label}</label>}
            <Label
              as="a"
              className={labelClass}
              style={linkStyle}
              href={href}
              basic
              target="_blank"
              size="large"
              {...this.getTooltip(field)}
              onClick={!href || href === "" ? handleEvent : null}
            >
              {bLinkOnLeft && link}
              {this.getPropertyValue(field.control.label)}
              {<span style={{ paddingLeft: "1em" }} />}
              {bLinkOnRight && link}
            </Label>
          </div>
        );
        break;
      case fieldTypes.ICON:
        const iconMode = bModesExist ? field.control.modes[0] : {};
        let imgInfo = getImageInfo(
          iconMode.iconSource,
          iconMode.iconStyle,
          iconMode.iconStandard,
          iconMode.iconImage
        );
        let icon = null;
        if (imgInfo.src) {
          icon = (
            <img
              src={imgInfo.src.default}
              alt="Icon from file"
              onClick={handleEvent}
            />
          );
        } else if (imgInfo.class && imgInfo.src != "") {
          icon = <i class={imgInfo.class} onClick={handleEvent}></i>;
        } else {
          switch (iconMode.iconSource) {
            case iconSources.EXTERNAL_URL:
              icon = (
                <img
                  src={iconMode.iconUrl}
                  alt="Icon from external URL"
                  onClick={handleEvent}
                />
              );
              break;
            case iconSources.PROPERTY:
              icon = (
                <img
                  src={this.getPropertyValue(iconMode.iconProperty)}
                  alt="Icon from property"
                  onClick={handleEvent}
                />
              );
              break;
            default:
              break;
          }
        }

        fieldElem = (
          <div key={index} {...this.getTooltip(field)}>
            {field.showLabel && (
              <label class="readonlytext-label">{label}</label>
            )}
            {icon}
          </div>
        );
        break;
      case fieldTypes.HIDDEN:
        return;
      case fieldTypes.PXSUBSCRIPT:
        fieldElem = this.getReadOnlyText(label, htmlDecode(field.value), index);

        break;
      default:
        fieldElem = (
          <Header key={index} as="h4">
            FormElement for '{field.control.type}' is undefined.
          </Header>
        );
        break;
    }

    if (error) {
      if (readOnly) {
        fieldElem = <div>{fieldElem}</div>;
      }

      return (
        <Popup
          key={index}
          trigger={fieldElem}
          content={errorMessage}
          size={"small"}
          position="bottom left"
        />
      );
    } else {
      return fieldElem;
    }
  }

  /**
   * Get input field type
   * @param { field } field
   */

  getFormatType(field) {
    let type;
    if (
      !field ||
      !field.control ||
      !field.control.modes ||
      field.control.modes.length === 0
    ) {
      return "text";
    }
    let fieldType = field.control.type;
    let formatType = field.control.modes[0].formatType;
    if (fieldType === fieldTypes.EMAIL || formatType === "email") {
      type = "email";
    } else if (fieldType === fieldTypes.PHONE || formatType === "tel") {
      type = "tel";
    } else if (fieldType === fieldTypes.URL || formatType === "url") {
      type = "url";
    } else if (
      fieldType === fieldTypes.INTEGER ||
      fieldType === fieldTypes.CURRENCY ||
      fieldType === fieldTypes.NUMBER ||
      formatType === "number"
    ) {
      type = "number";
    } else if (!type) {
      type = "text";
    }
    return type;
  }

  /**
   * Get read only text given value.
   * Re-usable for ReadOnly elem values, and also for DisplayTexts.
   * @param { String } label
   * @param { String } value
   * @param { int } index - used for key on component, needed for unique React children
   */
  getReadOnlyText(label, value, index, field) {
    let displayValue;
    let displayValueClasses = [];
    if (field && field.control.modes && field.control.modes.length > 1) {
      let mode = field.control.modes[1] ? field.control.modes[1] : {};
      switch (mode.formatType) {
        case "email":
          displayValue = <a href={"mailto:" + value}>{value}</a>;
          break;
        case "tel":
          displayValue = <a href={"tel:" + value}>{value}</a>;
          break;
        case "url":
          displayValue = (
            <a
              target={"_blank"}
              href={value.startsWith("http") ? value : "http://" + value}
            >
              {value}
            </a>
          );
          break;
        default:
          value = this.getDisplayTextFormattedValue(field);
          break;
      }
      switch (mode.textAlign) {
        case "Right":
          displayValueClasses.push("readonlytext-alignright");
          break;
        default:
          break;
      }
    }

    if (!displayValue) {
      displayValue = <p>{value ? value : " "}</p>;
    }

    return (
      <div key={index} class="readonlytext">
        <label class="readonlytext-label">{label}</label>
        <span class={displayValueClasses.join(" ")}>{displayValue}</span>
      </div>
    );
  }

  getDisplayTextFormattedValue(field) {
    let returnValue = field.value;
    if (field && field.control.modes.length > 0 && field.value) {
      let mode = field.control.modes[1];
      if (!mode) {
        return returnValue;
      }
      if (
        (mode.dateFormat && mode.dateFormat.match(/Date-/)) ||
        (mode.dateTimeFormat && mode.dateTimeFormat.match(/DateTime-/))
      ) {
        if (returnValue.includes("GMT")) {
          // field.value = field.value.replace("GMT", "+0000");
          field.value = field.value.replace(" GMT", "Z");
        }
        returnValue = this.generateDate(
          field.value,
          mode.dateTimeFormat ? mode.dateTimeFormat : mode.dateFormat
        );
      } else if (mode.formatType === "number") {
        let decimalPlaces = mode.decimalPlaces;
        if (!decimalPlaces) decimalPlaces = 2;
        let options = {
          minimumFractionDigits: decimalPlaces,
        };
        if (mode.numberSymbol === "currency")
          options = {
            ...options,
            ...this.getCurrencyFormatOptions(mode),
          };
        returnValue = Number(returnValue).toLocaleString(undefined, options);
      } else if (
        mode.formatType === "text" &&
        (mode.autoAppend || mode.autoPrepend)
      ) {
        returnValue = mode.autoPrepend
          ? mode.autoPrepend + returnValue
          : returnValue;
        returnValue = mode.autoAppend
          ? returnValue + mode.autoAppend
          : returnValue;
      } else if (mode.formatType === "truefalse") {
        returnValue = returnValue === "true" ? mode.trueLabel : mode.falseLabel;
      } else if (mode.formatType === "email") {
      } else if (mode.formatType === "tel") {
        returnValue = this.generatePhoneNumber(htmlDecode(field.value));
      } else if (mode.formatType === "url") {
        console.log("");
      } else if (mode.formatType === "advancedtext") {
      } else {
      }
    }
    returnValue = htmlDecode(returnValue);
    return returnValue;
  }

  getCurrencyFormatOptions(mode) {
    // ignoring most of the settings, but you get the idea
    let locale = navigator.language;
    let sCurrency = "USD";
    switch (locale) {
      case "en-US":
      case "es-US":
        sCurrency = "USD";
        break;
      case "en-CA":
      case "fr-CA":
        sCurrency = "CAD";
        break;
      case "fr-FR":
      case "es-ES":
      case "de-DE":
        sCurrency = "EUR";
        break;
      case "en-GB":
        sCurrency = "GBP";
        break;
      default:
        break;
    }

    let sDisplay = mode.currencySymbol;
    switch (sDisplay) {
      case "currencySymbol":
        sDisplay = "symbol";
        break;
      case "currencyCode":
        sDisplay = "code";
        break;
      case "currencyName":
        sDisplay = "name";
        break;
      default:
        break;
    }

    let props = {
      style: "currency",
      currency: sCurrency,
      currencyDisplay: sDisplay,
    };

    return props;
  }

  generatePhoneNumber(sNum) {
    let locale = navigator.language;
    switch (locale) {
      case "en-US":
      case "es-US":
      case "en-CA":
      case "es-MX":
        let formattedNum = "";
        let phoneLen = sNum.length;
        if (phoneLen === 11) {
          formattedNum = sNum.substring(0, 1) + "-";
          sNum = sNum.substring(1);
        }
        if (sNum.length === 10) {
          formattedNum +=
            sNum.substring(0, 3) +
            "-" +
            sNum.substring(3, 6) +
            "-" +
            sNum.substring(6);
          sNum = formattedNum;
        }
        break;
      default:
        break;
    }

    return sNum;
  }

  generateDate(dateVal, dateFormat) {
    let sReturnDate = dateVal;
    let date = datefn_parseISO(sReturnDate);

    switch (dateFormat) {
      case "Date-Short":
        // 1/1/01
        sReturnDate = datefn_format(date, "M/d/yy");
        break;
      case "Date-Short-YYYY":
        // 1/1/2001
        sReturnDate = datefn_format(date, "M/d/yyyy");
        break;
      case "Date-Short-Custom":
        // 01/01/01
        sReturnDate = datefn_format(date, "MM/dd/yy");
        break;
      case "Date-Short-Custom-YYYY":
        // 01/01/2001
        sReturnDate = datefn_format(date, "P");
        break;
      case "Date-Medium":
        // Jan 1, 2001
        sReturnDate = datefn_format(date, "PP");
        break;
      case "Date-DayMonthYear-Custom":
        // 01-Jan-2001
        sReturnDate = datefn_format(date, "dd-MMM-yyyy");
        break;
      case "Date-Full":
        // Monday, January 1, 2001
        sReturnDate = datefn_format(date, "eeee, MMMM d, yyyy");
        break;
      case "Date-Long":
        // January 1, 2001
        sReturnDate = datefn_format(date, "MMMM d, yyyy");
        break;
      case "Date-ISO-8601":
        // 2001/01/01 y/m/d
        sReturnDate = datefn_format(date, "yyyy/MM/dd");
        break;
      case "Date-Gregorian-1":
        // 01 January, 2001
        sReturnDate = datefn_format(date, "dd MMMM, yyyy");
        break;
      case "Date-Gregorian-2":
        // January 01, 2001
        sReturnDate = datefn_format(date, "MMMM dd, yyyy");
        break;
      case "Date-Gregorian-3":
        // 2001, January 01
        sReturnDate = datefn_format(date, "yyyy, MMMM dd");
        break;
      case "DateTime-Short":
        // 1/1/01 1:00 AM
        sReturnDate = datefn_format(date, "M/d/yy h:mm a");
        break;
      case "DateTime-Short-Custom":
        // 01/01/01 01:00 AM
        sReturnDate = datefn_format(date, "MM/dd/yy hh:mm a");
        break;
      case "DateTime-Short-YYYY-Custom":
        // 01/01/2001 01:00 AM
        sReturnDate = datefn_format(date, "M/d/yyyy hh:mm a");
        break;
      case "DateTime-Short-YYYY":
        // 1/1/2001 1:00 AM
        sReturnDate = datefn_format(date, "M/d/yyyy h:mm a");
        break;
      case "DateTime-Medium":
        // Jan 1, 2001 1:00:00 AM
        sReturnDate = datefn_format(date, "MMM d, yyyy h:mm:ss a");
        break;
      case "DateTime-Long":
        // January 1, 2001 1:00:00 AM
        sReturnDate = datefn_format(date, "MMMM d, yyyy h:mm:ss a");
        break;
      case "DateTime-DayMonthYear-Custom":
        // 01-Jan-2001 1:00:00 AM
        sReturnDate = datefn_format(date, "dd-MMM-yyyy h:mm:ss a");
        break;
      case "DateTime-Full":
        // Monday, January 1, 2001 1:00 AM EDT
        sReturnDate = datefn_format(date, "dddd, MMMM d, yyyy h:mm a z");
        break;
      case "DateTime-Frame":
      case "DateTime-Frame-Short":
        // 2 days, 5 hours ago
        sReturnDate = datefn_fromNow(date);
        break;
      case "DateTime-ISO-8601":
        // 2001/01/01 1:00:00 AM     y/m/d
        sReturnDate = datefn_format(date, "yyyy/MM/dd h:mm:ss a");
        break;
      case "DateTime-Gregorian-1":
        // 01 January, 2001 1:00:00 AM
        sReturnDate = datefn_format(date, "dd MMMM, yyyy h:mm:ss a");
        break;
      case "DateTime-Gregorian-2":
        // January 01, 2001 01:00:00 AM
        sReturnDate = datefn_format(date, "MMMM dd, yyyy hh:mm:ss a");
        break;
      case "DateTime-Gregorian-3":
        // 2001, January 01 1:00:00 AM
        sReturnDate = datefn_format(date, "yyyy, MMMM dd h:mm:ss a");
        break;
      case "DateTime-Custom":
        break;
      default:
        break;
    }

    return sReturnDate;
  }

  /**
   * Get control format for a button
   * @param { field }
   */
  getButtonFormat(field) {
    let buttonFormat = {};
    if (
      field &&
      field.control &&
      field.control.modes &&
      field.control.modes.length > 1
    ) {
      let format = field.control.modes[1].controlFormat;
      if (format) {
        format = format.toUpperCase();
        if (format !== "STANDARD" && format !== "PZHC") {
          if (format === "STRONG") buttonFormat.primary = true;
          else if (format === "LIGHT") {
            buttonFormat.basic = true;
          } else if (format === "RED") buttonFormat.color = "red";
        }
      }
    }
    return buttonFormat;
  }

  /**
   * Get control format for a link
   * @param { field }
   */

  getLinkFormat(field) {
    let linkFormat = { border: 0 };
    if (
      field &&
      field.control &&
      field.control.modes &&
      field.control.modes.length > 1
    ) {
      let format = field.control.modes[1].controlFormat;
      if (format) {
        format = format.toUpperCase();
        if (format === "STRONG") linkFormat.fontWeight = "bolder";
        else if (format === "LIGHT") {
          linkFormat.fontWeight = "lighter";
          linkFormat.color = "lightgray";
        } else if (format === "STANDARD" && format === "PZHC")
          linkFormat.fontWeight = "normal";
        else if (format === "RED") linkFormat.color = "red";
        // else if (format === 'LIST LINK') linkFormat.color = 'red';
      }
    }
    return linkFormat;
  }

  /**
   * Get tooltip for a field
   * @param { field }
   */

  getTooltip(field) {
    let tooltip = {};
    if (
      field &&
      field.control &&
      field.control.modes &&
      field.control.modes.length > 1
    ) {
      if (
        field.control.type === fieldTypes.BUTTON ||
        field.control.type === fieldTypes.LINK ||
        field.control.type === fieldTypes.ICON
      ) {
        if (field.control.modes[1].tooltip) {
          tooltip["data-tooltip"] = htmlDecode(field.control.modes[1].tooltip);
        }
      } else {
        if (field.control.modes[0].tooltip) {
          tooltip["data-tooltip"] = htmlDecode(field.control.modes[0].tooltip);
        }
      }
    }
    return tooltip;
  }

  /**
   * Get dropdown options from a clipboard page
   * @param { field }
   */

  getDropdownOptions(field) {
    let options = [];
    if (!field) return options;
    let control = field.control;
    let mode = control.modes[0];
    if (!mode) return options;

    if (
      mode &&
      mode.listSource === sourceTypes.PAGELIST &&
      !this.state.bUseLocalOptionsForClipboardPage
    ) {
      let pageId = field.control.modes[0].clipboardPageID;
      let clipboardPagePrompt = field.control.modes[0].clipboardPagePrompt;
      let clipboardPageValue = field.control.modes[0].clipboardPageValue;
      if (pageId && clipboardPagePrompt && clipboardPageValue) {
        let optionsPage = this.props.caseDetail.content[pageId];
        if (optionsPage && optionsPage.length > 0) {
          options = optionsPage.map((item) => {
            return {
              key: item[clipboardPageValue],
              text: item[clipboardPagePrompt],
              value: item[clipboardPageValue],
            };
          });
        }
      }
    } else {
      // This is the typical sourceTypes.LOCALLIST path
      if (mode.options) {
        options = mode.options.map((option) => {
          // Finding option.value may be encoded when using property of type "Prompt list".  However, when using property of
          // type "Local list", the key is also encoded.
          let decodedKey = htmlDecode(option.key);
          return {
            key: decodedKey,
            text: htmlDecode(option.value),
            value: decodedKey,
          };
        });
      }
    }
    return options;
  }

  createEventHandler(actionHandlers) {
    let eventHandler = (e, data) => {
      // This e.preventDefault is important to have things like alert actions not submit the form (and advance the stage) when
      //  they are dismissed.  However, it also intereferes with proper checkbox control event handling--both click (or left
      //  label checkboxes) and space bar press selection for both.
      if (e && !(data && data.type === "checkbox")) {
        e.preventDefault();
      }

      actionHandlers.reduce((promise, item) => {
        return promise.then((d) =>
          item.handler.call(this, e, data, item.data, item.refreshFor)
        );
      }, Promise.resolve());
    };
    return eventHandler;
  }

  /**
   * Helper function to generate an event handler function.
   * This is to support multiple actions attached to the same element;.
   * Returns a function to be called on field blur / click / etc.
   * DOES NOT UPDATE STATE.
   * @param { Object } field - field object from the API
   * @param { Object } [e=null] - event argument (if specified) will result in checking the event type and only returning actions relevant for that type of event
   * @return { func } function to handle events
   */
  generateEventHandler(field, e = null) {
    let actionData = this.getActionData(field, this.supportedActions, e);
    // let eventHandler = (e, data) => {
    //   e.preventDefault();
    // };

    // Mark if we have already included a refresh, so we don't do duplicates
    let hasFieldRefresh = false;

    // Mark if we have both a refresh and a setValue
    // setValue using setState won't update date before the POST if we do not handle it separately
    let dataForSetValueAndRefresh = this.getDataForSetValueAndRefresh(
      actionData
    );

    let actionsList = [];

    // We are going to append together each function, startin with the base handler that does a preventDefault().
    for (let i = 0; i < actionData.length; i++) {
      switch (actionData[i].action) {
        case actionNames.SET_VALUE:
          if (!dataForSetValueAndRefresh) {
            // eventHandler = this.appendActionHandler(
            //   eventHandler,
            //   this.handleSetValue,
            //   actionData[i].actionProcess
            // );

            actionsList.push({
              handler: this.handleSetValue,
              data: actionData[i].actionProcess,
            });
          }
          break;
        case actionNames.POST_VALUE:
          if (!hasFieldRefresh) {
            // eventHandler = this.appendActionHandler(
            //   eventHandler,
            //   this.handleFieldRefresh
            // );
            actionsList.push({ handler: this.handleFieldRefresh });
            hasFieldRefresh = true;
          }
          break;
        case actionNames.REFRESH:
          if (!hasFieldRefresh) {
            // eventHandler = this.appendActionHandler(
            //   eventHandler,
            //   this.handleFieldRefresh,
            //   dataForSetValueAndRefresh
            // );
            actionsList.push({
              handler: this.handleFieldRefresh,
              data: dataForSetValueAndRefresh,
              refreshFor: actionData[i],
            });
            hasFieldRefresh = true;
          }
          break;
        case actionNames.PERFORM_ACTION:
          // eventHandler = this.appendActionHandler(
          //   eventHandler,
          //   this.handlePerformAction,
          //   actionData[i].actionProcess
          // );
          actionsList.push({
            handler: this.handlePerformAction,
            data: actionData[i].actionProcess,
          });
          break;
        case actionNames.RUN_SCRIPT:
          // eventHandler = this.appendActionHandler(
          //   eventHandler,
          //   this.handleRunScript,
          //   actionData[i].actionProcess
          // );
          actionsList.push({
            handler: this.handleRunScript,
            data: actionData[i].actionProcess,
          });
          break;
        case actionNames.OPEN_URL:
          // eventHandler = this.appendActionHandler(
          //   eventHandler,
          //   this.handleOpenUrl,
          //   actionData[i].actionProcess
          // );
          actionsList.push({
            handler: this.handleOpenUrl,
            data: actionData[i].actionProcess,
          });
          break;
        default:
          break;
      }
    }
    return this.createEventHandler(actionsList);
    // return eventHandler;
  }

  /**
   * VRS: Jan 5, 2021: This function does not seem to be used and will likely be DELETED soon
   *
   * Function to compose multiple function calls together.
   * Used to support multiple actions on a single element (e.g. setValue + refresh)
   * Must use call() to ensure correct context at time of calling.
   * @param { func } curFunc - current composed function, to be added to
   * @param { func } newFunc - function to be appended onto curFunc
   * @param { Object } actionProcess - actionProcess data, returned from API for action.
   * @return { func } function of composed param functions
   */
  appendActionHandler(curFunc, newFunc, actionProcess = null) {
    return (e, data) => {
      curFunc.call(this, e, data);
      newFunc.call(this, e, data, actionProcess);
    };
  }

  /**
   * This is to check if the elem has both a set value and refresh.
   * Must handle simultaneous setValue + refresh carefully, as using setState to update the target
   * of setValue won't update the data before the POST.
   * Does not currently support multiple DIFFERENT setValue actions, but will support multiple
   * values that are set under a single action.
   * @param { Object } actionData - object of actionData attached to field.
   * @return { Object } setValueData if field has refresh AND setValue, null otherwise.
   */
  getDataForSetValueAndRefresh(actionData) {
    let hasRefresh = false;
    let hasSetValue = false;
    let setValueData = null;

    for (let i = 0; i < actionData.length; i++) {
      if (actionData[i].action === "setValue") {
        hasSetValue = true;
        setValueData = actionData[i].actionProcess;
      }

      if (actionData[i].action === "refresh") {
        hasRefresh = true;
      }
    }

    if (hasRefresh && hasSetValue) {
      return setValueData;
    }

    return null;
  }

  /**
   * Generic way to check over actionSets.
   * Returns all actions/events that match one of the targetActions.
   * Returns empty array if none found.
   * @param { Object } field - field object from the API
   * @param { Array } targetActions - array of strings, actions to target
   * @param { Object } [e=null] - optional event to use to filter results to only be ones specified for this event
   * @return { Array } array of target actions if found, otherwise empty array.
   */
  getActionData(field, targetActions, e = null) {
    let result = [];

    if (field.control && field.control.actionSets) {
      let actionSets = field.control.actionSets;

      for (let i = 0; i < actionSets.length; i++) {
        // If we see one of the target actions, return that action
        let actions = actionSets[i].actions;
        let events = actionSets[i].events;

        for (let j = 0; j < events.length; j++) {
          if (!e || events[j].event == e.type) {
            for (let k = 0; k < actions.length; k++) {
              if (
                targetActions.some(
                  (targetAction) => targetAction === actions[k].action
                )
              ) {
                result.push({ ...actions[k], events: events });
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Generic way to check over actionSets.
   * Returns the first action OR event that matches one of the targetActions or targetEvents.
   * Returns null if none found.
   * @param { Object } field - field object from the API
   * @param { Array } targetActions - array of strings, actions to target
   * @param { Array } targetEvents - array of strings, events to target
   * @return { Object } target action or event if found, otherwise null
   */
  actionSetChecker(field, targetActions, targetEvents) {
    if (field.control && field.control.actionSets) {
      let actionSets = field.control.actionSets;

      for (let i = 0; i < actionSets.length; i++) {
        // If we see one of the target actions, return that action
        let actions = actionSets[i].actions;
        for (let j = 0; j < actions.length; j++) {
          if (
            targetActions.some(
              (targetAction) => targetAction === actions[j].action
            )
          ) {
            return actions[j];
          }
        }

        // If we see one of the target event, return that event
        let events = actionSets[i].events;
        for (let j = 0; j < events.length; j++) {
          if (
            targetEvents.some((targetEvent) => targetEvent === events[j].event)
          ) {
            return events[j];
          }
        }
      }
    }

    return null;
  }

  /**
   * Helper function to expand relative path to fully qualified path.
   * Needed for storing correct values on state, and POSTing values to server.
   * e.g. converts ".Address(1).FirstName" to "Address(1).FirstName"
   * @param { String } relPath - relative path to expand to full path
   */
  expandRelativePath(relPath) {
    if (relPath.charAt(0) === ".") {
      return relPath.substring(1);
    }

    return relPath;
  }

  /**
   * Helper function to translate Pega string / bool / property reference to desired value.
   * If we receiving a direct string value from Pega, it will be enclosed in quotes.
   * If we recieve a property reference path, we want the actual value of the property.
   * If we receive a number, we want numerical type, not a string.
   * If we receive a bool in string form, we want a bool returned.
   * e.g. "\"I am a sample string\"" yields "I am a sample string"
   *      OR true yields true
   *      OR ".FirstName" yields actual value of FirstName property
   * @param { String / Bool } property - desired property to get value of
   * @return { String / Int / Bool } value of property, depending on contents
   */
  getPropertyValue(property, valueReference) {
    // If the property is a bool, return it directly
    if (typeof property === "boolean") {
      return property;
    }

    // Decode the property value first (and strip any outer quotes)
    property = htmlDecode(property, true);

    let value = null;
    // If the property starts with a . character, then convert it to full path and get its value
    if (property.charAt(0) === ".") {
      value = this.state.values[this.expandRelativePath(property)];
    }

    // If valueReference structure is passed in, then this value may be a reference without the leading ".", and otherwise,
    //  use the last saved value
    if (valueReference && !value) {
      value = this.state.values[this.expandRelativePath(property)];

      if (!value && valueReference.lastSavedValue) {
        value = htmlDecode(valueReference.lastSavedValue);
      }
    }

    // The property format was unhandled, return it directly
    if (!value) value = property;
    return value;
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

  /**
   * This section includes functions that handle updating state for the PegaForm component.
   * Data is maintained on state on the PegaForm.
   */

  /**
   * Handle change for field. Update state correspondingly.
   * Can handle input, checkboxes, dropdowns, and date times.
   * @param { Object } e - synthetic event
   * @param { Object } data - form element that called handler
   * @param { Func } callback - callback to be called after setState completes
   */
  handleChange(e, obj, callback = null, field) {
    let value;
    let date = null;

    if (e && isDate(e)) {
      // Handle date time
      value = datefn_formatISO(e, { format: "basic", representation: "date" });
      if (
        field &&
        field.control.modes.length > 0 &&
        field.control.modes[1].formatType
      ) {
        const formatType = field.control.modes[1].formatType;
        if (formatType.includes("datetime")) {
          value = value + "T000000.000";
        }
      }
      date = value;
      // Set e to null for now (so we don't confuse this for an event when callback might be invoked.
      //  Perhaps generate a new Event if important to distinguish which action sets are run based on event being handled
      //  since we are not doing that yet.)
      e = null;
      /*
      if( callback ) {
        e = new Event('change', { bubbles: true });
      }
      */
    } else {
      // Handle inputs or checkboxes, but exclude radio buttons
      if (obj.type == "checkbox") {
        // use "true" or "false" (string values)
        value = obj.checked ? "true" : "false";
      } else {
        if (e.target && e.target.classList) {
          e.target.classList.add("field");
        }
        value = obj.value;
      }
    }

    let callbackFunc = null;
    if (callback) {
      if (e) e.persist();
      callbackFunc = () => callback(e, obj);
    }
    // Store new values
    this.setState(
      {
        values: {
          ...this.state.values,
          [obj.reference]: value,
        },
        date: date ? datefn_parseISO(date) : this.state.date,
      },
      callbackFunc
    );
  }

  /**
   * List Action Handler
   * @param { Object } e - synthetic event
   * @param { Object } data - form element that called handler
   */
  handleListActions(e, data) {
    e.preventDefault();

    this.setState({
      loadingElems: {
        ...this.state.loadingElems,
        [data.reference]: true,
      },
    });

    let postContent = ReferenceHelper.getPostContent(this.state.values);
    let target = ReferenceHelper.getRepeatFromReference(
      data.reference,
      data.referencetype,
      postContent
    );

    switch (data.action) {
      case "add":
        target.push(ReferenceHelper.getBlankRowForRepeat(target));
        break;
      case "remove":
        if (target.length > 1) {
          target.pop();
        }
        break;
      default:
        break;
    }

    this.props
      .dispatch(
        assignmentActions.performRefreshOnAssignment(
          this.props.caseID,
          this.props.assignment.ID,
          this.props.currAssignmentAction,
          postContent
        )
      )
      .then(() => {
        this.setState({
          loadingElems: {
            ...this.state.loadingElems,
            [data.reference]: false,
          },
        });
      });
  }

  /**
   * PageGroup action handler
   * @param { Object } e - synthetic event
   * @param { Object } data - form element that called handler
   */
  handleGroupActions(e, data) {
    e.preventDefault();

    let isRemove = data.action === "remove";
    let postContent = ReferenceHelper.getPostContent(this.state.values);
    let target = ReferenceHelper.getRepeatFromReference(
      data.reference,
      data.referencetype,
      postContent
    );

    const name = isRemove
      ? prompt("Please enter the name of the group to be deleted.")
      : prompt("Please enter a name for the group.", "");

    if (name === null) {
      return;
    }

    if (isRemove) {
      delete target[name];
    } else {
      target[name] = {};
    }

    this.props
      .dispatch(
        assignmentActions.performRefreshOnAssignment(
          this.props.caseID,
          this.props.assignment.ID,
          this.props.currAssignmentAction,
          postContent
        )
      )
      .then(() => {
        this.setState({
          loadingElems: {
            ...this.state.loadingElems,
            [data.reference]: false,
          },
        });
      });
  }

  /**
   * This section handle actions attached to fields.
   *
   */

  /**
   * Method to handle field refresh. This is only triggered when we want to
   * send data to the server.
   * In the event that there are setValues connected to this refresh, we must directly
   * set those values in this method.
   * @param { Object } e - synthetic event
   * @param { Object } data - data representing the field that is triggering refresh
   * @param { Object } actionProcess - object with information about setValuePairs, if needed
   */
  handleFieldRefresh(e, data, actionProcess, refreshForData) {
    if (!this.props.assignment) {
      return;
    }

    let postContent = ReferenceHelper.getPostContent(this.state.values);
    // If we have setValues connected to this refresh, ensure the values are set before the POST
    // This is needed because setState is async, and calling it would not update the values in time
    if (actionProcess && actionProcess.setValuePairs) {
      actionProcess.setValuePairs.forEach((pair) => {
        // The paths attached to setvaluepairs include relative references.
        // Must make them absolute to be handled by ReferenceHelper.addEntry()
        let val;
        if (pair.valueReference) {
          val = this.getPropertyValue(
            pair.valueReference.reference,
            pair.valueReference
          );
          ReferenceHelper.addEntry(
            this.expandRelativePath(pair.name),
            val,
            postContent
          );
        } else {
          let fullPath = this.expandRelativePath(pair.name);
          val = this.getPropertyValue(pair.value);
          ReferenceHelper.addEntry(fullPath, val, postContent);
        }
      });
    }

    if (refreshForData && refreshForData.refreshFor) {
      ReferenceHelper.addEntry(
        "refreshFor",
        refreshForData.refreshFor,
        postContent
      );
    }

    return this.props.dispatch(
      assignmentActions.performRefreshOnAssignment(
        this.props.caseID,
        this.props.assignment.ID,
        this.props.currAssignmentAction,
        postContent
      )
    );
  }

  /**
   * Method to handle setValue for fields. This is only triggered when a setValue event
   * is found WITHOUT a refresh (which would POST the value).
   * setValue with refresh must happen simultaneously via handleFieldRefresh, as setState is async.
   * @param { Object } e - synthetic event
   * @param { Object } data - data representing the field that was blurred
   * @param { Object } actionProcess - object with information about setValuePairs
   */
  handleSetValue(e, data, actionProcess) {
    let newValues = Object.assign({}, this.state.values);

    actionProcess.setValuePairs.forEach((pair) => {
      // The paths attached to setvaluepairs include relative references.
      // Must make them absolute to be handled by ReferenceHelper.addEntry()
      if (pair.valueReference) {
        let val = this.getPropertyValue(
          pair.valueReference.reference,
          pair.valueReference
        );
        ReferenceHelper.addEntry(
          this.expandRelativePath(pair.valueReference.reference),
          val,
          newValues
        );
      } else {
        newValues[this.expandRelativePath(pair.name)] = this.getPropertyValue(
          pair.value
        );
      }
    });

    this.setState({
      values: newValues,
    });
  }

  /**
   * Method to handle PerformAction action. This is triggered when the event is seen.
   * @param { Object } e - synthetic event
   * @param { Object } data - data represneting the field that the perform action was triggered on
   * @param { Object } actionProcess - object with information about performAction
   */
  handlePerformAction(e, data, actionProcess) {
    this.props.updateCurrAssignmentAction(actionProcess.actionName);

    return this.props.dispatch(
      assignmentActions.getFieldsForAssignment(
        this.props.assignment,
        actionProcess.actionName
      )
    );
  }

  /**
   * Method to handle RunScript action. This is triggered when the event is seen.
   * @param { Object } e - synthetic event
   * @param { Object } data - data representing the field that the perform action was triggered on
   * @param { Object } actionProcess - object with information about script to run
   */
  handleRunScript(e, data, actionProcess) {
    let evalString = actionProcess.functionName + "(";

    if (actionProcess.functionParameters) {
      let paramString = actionProcess.functionParameters
        .map((param) => {
          // let val = this.state.values[this.expandRelativePath(param.value)];
          let val;
          if (param.valueReference) {
            val = this.getPropertyValue(
              param.valueReference.reference,
              param.valueReference
            );
          } else {
            val = this.getPropertyValue(param.value);
          }

          if (val === undefined || val === null) {
            val = "null";
          } else if (typeof val === "string") {
            val = `"${val}"`;
          }

          return val;
        }, this)
        .join(", ");

      evalString += paramString;
    }

    evalString += ");";
    try {
      eval(evalString);
    } catch (e) {
      alert("Error occurred on attempted run of:" + htmlDecode(evalString));
    }
  }

  /**
   * Method to handle OpenURL action. This is triggered when the event is seen.
   * @param { Object } e - synthetic event
   * @param { Object } data - data representing the field that the perform action was triggered on
   * @param { Object } actionProcess - object with information about url to open
   */
  handleOpenUrl(e, data, actionProcess) {
    let url;

    if (actionProcess.alternateDomain) {
      url = actionProcess.alternateDomain.url;
      if (!url && actionProcess.alternateDomain.urlReference)
        url = this.getPropertyValue(
          actionProcess.alternateDomain.urlReference.reference,
          actionProcess.alternateDomain.urlReference
        );
    }

    // url shouldn't have double quotes so just get rid of them (bounding double quotes have been encountered)
    url = url.replace(/"/g, "");
    // if a protocol isn't specified, launching it relative to localhost react server doesn't work so well
    if (url.indexOf("http") !== 0) {
      url = "https://" + url;
    }

    let queryParams = actionProcess.queryParams
      .map((param) => {
        let parmValue;
        if (param.value) parmValue = htmlDecode(param.value);
        else if (param.valueReference.reference)
          parmValue = this.getPropertyValue(
            param.valueReference.reference,
            param.valueReference
          );
        return `${param.name}=${parmValue}`.replace(/"/g, "");
      })
      .join("&");

    if (queryParams) url += "?" + queryParams;
    window.open(url, actionProcess.windowName, actionProcess.windowOptions);
  }

  /**
   * Handle submit for the form
   * Dispatch action to perform action on assignment, with state stored on Work Object.
   */
  handleSubmit(e) {
    const { assignment } = this.props;

    let newValues = Object.assign({}, this.state.values);

    this.props
      .dispatch(
        assignmentActions.performActionOnAssignment(
          this.props.caseID,
          assignment.ID,
          this.props.currAssignmentAction,
          newValues
        )
      )
      .then((action) => {
        // This is to handle the case that we are changing actions on the same assignment
        if (
          action.assignment &&
          action.assignment.nextAssignmentID === assignment.ID
        ) {
          this.props.updateCurrAssignmentAction(action.nextActionID);
        }
      });
  }

  /**
   * Handle cancel for the form. Closes the work object.
   * @param { Object } e - synthetic event
   * @param { Object } data
   */
  handleCancel(e, data) {
    e.preventDefault();
    this.props.dispatch(errorActions.clearErrors(this.props.caseID));
    this.props.dispatch(assignmentActions.closeAssignment(this.props.caseID));
  }

  /**
   * Handle save for the form. Does not close the work object.
   * @param { Object } e - synthetic event
   * @param { Object } data
   */
  handleSave(e, data) {
    e.preventDefault();

    let newValues = Object.assign({}, this.state.values);

    if (this.state.bUsePostAssignSave) {
      // 8.4 and greater
      // this is the PREFERRED way to save in an assignment as here we are saving the assignment and not the case
      // so there will be validation against the flow action properties that doesn't happen if you just save the case.
      this.props.dispatch(
        assignmentActions.saveAssignment(
          this.props.caseID,
          this.props.assignment.ID,
          this.props.currAssignmentAction,
          newValues
        )
      );
    } else {
      this.props.dispatch(
        caseActions.updateCase(this.props.caseID, newValues, this.props.etag)
      );
    }
  }

  /**
   * Handle case create when using New harness.
   * Dispatch action to perform case creation.
   */
  handleCaseCreate() {
    let postContent = ReferenceHelper.getPostContent(this.state.values);

    this.props.dispatch(
      caseActions.createCase(
        this.props.caseID,
        this.state.processID,
        postContent
      )
    );
  }

  /**
   * Returns an object with validation errors associated to field references.
   * @param { Object } errors - object returned from API with errors
   * @return { Object } object with validation errors associated with reference keys
   */
  getValidationErrorsByKey(errors) {
    let errorsByKey = {};

    if (errors) {
      errors.ValidationMessages.forEach((message) => {
        if (message.Path) {
          errorsByKey[this.expandRelativePath(message.Path)] =
            message.ValidationMessage;
        }
      });
    }

    return errorsByKey;
  }

  render() {
    // If we are showing New harness, then do not show caseView, only harness.
    if (this.props.page && this.props.page.name === pageNames.NEW) {
      return this.getPage();
    }

    // In the event that we have a page, show it instead of the form
    // This is used for things like the "Confirm" harness.
    // Also show caseView on the right side of the WorkObject.
    return (
      <Grid columns={2} stackable as={Segment} attached="bottom">
        <Grid.Row>
          <Grid.Column width={10}>
            {this.props.page ? this.getPage() : this.getForm()}
          </Grid.Column>
          <Grid.Column width={6}>{this.getCaseView()}</Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  const caseDetail = {
    ...state.cases.caseDetails[state.assignments.openAssignmentsTabIdx[0]],
  };
  const { openCasesData } = { ...state.assignments };
  return {
    openCasesData,
    caseDetail,
  };
}

const connectedPegaForm = connect(mapStateToProps)(PegaForm);
export { connectedPegaForm as PegaForm };
