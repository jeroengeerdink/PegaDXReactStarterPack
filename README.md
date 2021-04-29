## Table of Contents

- [Basic Information](#basic-information)
- [Development Environment](#development-environment)
- [Installation Instructions](#installation-instructions)
- [Basic Usage](#basic-usage)
- [Application Configuration](#application-configuration)
- [Pega Setup considerations](#pega-setup-considerations)
- [Settings within Settings Dialog](#settings-within-settings-dialog)
- [Application Structure](#application-structure)
- [Other Resources](#other-resources)

## Deploy in minutes with Firebase and Gitpod

Prerequisites:

- Running pega node with DX enabled application
- Google account
- A ready to go Firebase project with Hosting enabled -> https://console.firebase.google.com/

Get started by starting a Gitpod environment here -> https://gitpod.io/#https://github.com/jeroengeerdink/PegaDXAngularStarterPack
You may be asked to identify yourself if a first time gitpod user.

After setup (can take a few mins the first time) you will be asked to login to your google account and _copy the token back into the commandline_ (make sure to allow the copy action in your browser).

Make sure you update the URLs in `src/_services/endpoints.js`

### Testing

- `npm run build` to compile the code for deployment
- Run `serve -s build` for a dev server. Use the link in the command line to opem and

### Firebase setup

Use `firebase init` to enable hosting and select the project you want to use.

### Deploying

Run the following

- `npm run build` to compile the code for deployment
- `firebase deploy` to deploy the app

## Basic Information

The Pega React Starter Pack provides sample code which illustrates leveraging Version 1 of the [Pega Digital Experience (DX) APIs] (https://community.pega.com/digital-experience-api) to build a custom React front-end experience for Pega applications from which users can view, create, and update Pega cases and assignments.

It implements a simple case worker portal which should work against most simple Pega applications. It currently leverages [Semantic UI React] (https://react.semantic-ui.com/) as its UI component library.

A front-end developer will need to install the React Starter Pack on their local desktop computer and configure the source code to access either a simple Pega application (or you can deploy and leverage the provided CableConnect sample app).

## Development Environment

Node.js and NPM are critical for installation and exeuction of the Pega React Starter Pack. NVM is optional.
See https://docs.npmjs.com/downloading-and-installing-node-js-and-npm for info on installing Node.js and NPM and also discusses NVM.

This application was tested using:

- Node.js version: 15.5.1
- NPM version: 7.3.0
- NVM version: 0.37.2

## Installation Instructions

1.  Retrieve the latest Pega React Starter Pack zip file from Pega Community (https://community.pega.com/marketplace/components/react-starter-pack).
2.  Unzip the PegaReactStarterPack85.zip, it will create a PegaReactStarterPack85 directory that contains the following sub-directories:
    - `CableConnectApp` - contains the zip file to import from Pega Dev Studio to install the sample app
    - `Documents` - contains this README file and the instructions for installing the Pega CableConnect sample app
    - `ReactApp` - source code to allow building and executing the Pega React Starter Pack app
3.  Move `pega-react.zip` from `React App` directory into a directory of your choosing and unzip it.
    - This will create a subdirectory called `pega-react`
4.  Execute the following commands from within the `pega-react` directory within a terminal window (or command prompt):
    - `npm install`
    - This will retrieve all the dependent modules required by the Pega React Starter Pack application.
5.  Setup the CableConnect Pega sample application by following the instructions within CableConnectSampleApp.pdf (located within the Documents sub-directory)
6.  Make sure that your Pega application server and Pega application are setup properly. See [Pega Setup considerations](#pega-setup-considerations)
7.  Review the Pega server connection information within the file `pega-react/src/_services/endpoints.js`. See [Application Configuration](#application-configuration) section for more details on updating this to point to the Pega server which has been properly configured for DXAPI access.
8.  Execute the following commands from within the `pega-react` directory within a terminal window (or command prompt):
    - `npm start` OR `HTTPS=true npm start`
9.  This should open your browser to http://localhost:3000 (OR to https://localhost:3000), which is where the application will be served. If you don't see the browser open automatically, look at the output from npm start and enter the provided url into a browser.

## Basic Usage

By default, the starter pack application is configured to access a local Pega server http://localhost:1080/prweb.
To login to the CableConnect sample application, you can use any of the following credentials:
_ operator: rep.cableco, password: pega - case worker
_ operator: tech.cableco, password: pega – case worker
_ operator: manager.cableco, password: pega – case manager
_ operator: admin.cableco, password: pega – developer/admin

Once logged in, you can create cases from the CaseType list, open WorkObjects from the WorkList, and perform end-to-end flows, based on the data returned from the API.

## Application Configuration

The CableConnect application RAP includes a OAuth 2.0 Client Registration record named "CableCoV1Oauth". The default endpoints.js file is configured by default with a particular client id.  
If you want to configure the application to access a different server follow these steps:

- Open `pega-react/src/_services/endpoints.js` and modify the BASEURL field to your desired system.
- Decide whether you wish to use Basic or OAuth with the starter pack. (OAuth may only be used with Pega 8.5.x or better)
- Configuring to use Basic authentication:
  - Set use_OAuth to `false`
  - Using Dev Studio, confirm the "api" Service Package "Authentication type" is set to "Basic".
- Configuring for OAuth:
  - Set use_OAuth to `true`
  - Create an OAuth 2.0 Client Registration record for this Starter Kit app (if CableConnect app was not imported with the OAuth 2.0 Client registration record named "CableCoV1OAuth"):
    - Create a new "Security/OAuth 2.0 Client Registration" record for this app
    - You might name it "PegaReactSPA" for both the Short description and the Client Name.
    - Specify "Public" for the type of client (as browser apps are not able to prevent any "Client secret" from being compromised)
    - Select "Authorization Code" for the Grant type
    - Add a RedirectURI value based on the url used to access the deployed Pega React Starter Pack Application (e.g., http://localhost:3000/start)
      - Note: The Start route in the path is significant for this sample app
      - If you want to have a local http and https version of the app running, you will have to ccreate an configure an additional RedirectURI for the additional initial url you want OAuth to redirect to after the authentiation succeeds.
    - Enable the "Enable proof code for pkce" option
    - Set the "Access token lifetime" for how long you want the logged in session to last. Pega does not presently support the ability to refresh the token (for Public clients), so the user will have to authenticate again after this interval.
  - Enter the appropriate values (within endpoints.js) for client_id, authorization and token from the appropriate client registration record
    - Set use_pkce (within endpoints.js) to true or false based on whether "Enable proof code for pkce" is enabled or disabled
  - Using Dev Studio, confirm the "api" Service Package "Authentiation type" is set to "OAuth 2.0"

## Pega Setup considerations

This section covers some important Pega application and Pega server setup/configuration requirements for properly using this starter pack against a particular Pega server.

- When you login as a particular operator, the default application access group specified for the operator will be utilized. This access group must contain the "PegaAPI" role to allow proper acess to the Pega DX API. (This is also mentioned within the CableConnect sample application documentation.) Typically, <AppName>:PegaAPI role would be added to the application access group and that role will have PegaRules:PegaAPI specified as a dependent role.

- The Confirm harness/page has to be explicitly available within the application as the default one will not currently work with the DX API.

- The API Service Package record needs to have the proper Authentication mechanism configured to permit proper access (either Basic or OAuth) and the Starter Pack app needs to be configured to match. See [Application Configuration](#application-configuration).

- The Integration/Services/Endpoint-CORS policy mapping much the configured properly so that the "api/" endpoint is configured to utilize the "APIHeadersAllowed" CORS policy.

## Settings within Settings Dialog

There are three settings presently within the Settings dialog which are persent to illustrate atlernate sequences of API usage

- `Autocomplete/Dropdown use local options for Data Page`
  - When not checked, the options which are populated within the field structure (since Pega Infinity 8.3+) are ignored and separate GET /data/ endpoint tranactions result to retrieve the options for the field
- `Autocomplete/Dropdown use local options for Clipboard`
  - When not checked, the options which are populated within the field structure (since Pega Infinity 8.3+) are ignored and the data is retrieved from the appropriate "content" portion from the earlier retrieve data from the GET /cases/{ID} post
- `Save assignment (preferred) (vs. Save Case)`
  - When checked, invokes POST /assignments/{ID} rather than PUT /cases/{ID}
  - The POST assignments endpoint is available since Pega Infinity 8.4 and offers additional validation against the flow action properties.

## Application Structure

If you are familiar with React / Redux, then many of the components and classes will be straightfoward.

```
PegaApp/
  README.md
  docs/
  node_modules/
  package.json
  public/
  src/
    _actions/
    _components/
    _constants/
    _helpers/
    _reducers/
    _services/
    _styles/
    AppHeader/
    Dashboard/
    DashboardWidget/
    LoginPage/
    IframePage/
    PegaApp/
    PopupPage/
    StartPage/
    PegaForm/
    Workarea/
    Worklist/
    WorkObject/
```

Some of the most important directories and files are highlighted below:

## `_actions/`

These files contain action creators, used to dispatch actions via Redux.

There are separate files for actions related to:

- Alerts
- Assignments
- Cases
- Errors
- Users
- Workqueues

## `_reducers/`

Redux reducers.
Used to update state in the store after actions are dispatched.

There are separate reducers for:

- Alerts
- Assignments
- Cases
- Errors
- Users
- Workqueues

## `_services/`

Functions used to issue AJAX requests and manage responses.
All of the included methods use the Axios library for Promise-based requests.

There are separate service files for:

- Assignments
- Cases
- Data Pages
- Users

## `PegaForm/PegaForm.js`

This is a React component used to generate forms for assignments, views, and pages based on data returned from the Pega API.
Form generation for assignments, views, and pages are all based on a nested UI data structure returned from the API.

- Views / pages contain groups.
- Each element of a Group array can contain a view, layout, field, paragraph or caption.
- Layouts determine the UI structure of the form.
  - Supported layouts (layout.groupFormat values) are:
    - Dynamic (Simple layout)
    - Grid (Table)
    - Stacked
    - Inline middle
    - Inline grid double
    - Inline grid double (70 30)
    - Inline grid double (30 70)
    - Inline grid triple
  - Additional supported structural components:
    - Repeating (Dynamic) layout
    - Repeating (Grid) row
    - Embedded Section
  - Unsupported layouts and structural components include:
    - Layout group
    - Column layout
    - Dynamic layout group
    - Hierarchical table
    - Navigational tree
    - Dynamic container
    - AJAX container
    - Non-auto generated sections
    - Sections that include scripts
    - Non guardrail-compliant sections
- Fields contain information about the property, including reference, current value, outstanding validation messages, and attached actions.
- Supported fields:
  - pxTextInput
  - pxDropdown
  - pxCheckbox
  - pxTextArea
  - pxURL
  - pxEmail
  - pxDateTime
  - pxInteger
  - pxNumber
  - pxPhone
  - pxDisplayText
  - pxHidden
  - pxButton
  - label
  - pxLink
  - pxIcon
  - pxRadioButtons
  - pxCurrency
  - pxAutoComplete
- Supported actions:
  - setValue
  - postValue
  - refresh
  - takeAction
  - runScript
  - openUrlInWindow

PageGroups and PageLists are supported.

When changing values on the form (checking a checkbox, typing into an input, etc...) the changes in value are reflected in state.values for PegaForm.
When doing a POST to submit an assignment or refresh fields, the state.values object is translated into a nested representation of the data based on page structure, and sent to the server.

## `_helpers/ReferenceHelper.js`

- Class to handle translating Pega's fully qualified property paths to a nested Object structure, and vice versa.
- Also some utility methods for:
  - Handling initial PegaForm state given View from API
  - Finding correct PageGroup/List based on property reference
  - Getting blank entry for PageGroup/List when adding new element
- When posting data to the server via API, it must be nested.
- When retrieving field information from the server, the property paths are flat and qualified.

## `_components/DataPageDropdown.js`

This is an example of a self-contained React component that has some Pega-API-specific logic.
In this case, the DataPageDropdown creates a dropdown form element that sources its options from a DataPage.

## Other Resources

- This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).
- [Semantic UI React](https://react.semantic-ui.com/)
- [Pega Digital Experience (DX) API Version 1](https://community.pega.com/knowledgebase/articles/pega-digital-experience-dx-api-version-1-overview/pega-digital-experience-dx-api-version-1-overview)
- [Info on which Pega application layouts are supported by DX API](https://community.pega.com/knowledgebase/articles/user-experience/85/layouts-dx-api)
