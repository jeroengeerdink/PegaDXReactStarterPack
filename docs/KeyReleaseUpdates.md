## Key Updates Since release 1.3

- Replaced JSO library with oidc-client library for OAuth

## Key Updates Since release 1.2

- Upgraded to React 16.8 (from React 16.2)
- Adjusted layout of Dashboard title to consolidate actions on same row and eliminate extra top headers
  - Added Refresh action
- Support for OAuth Authorization Code grant flow (with or without PKCE)
- Upgraded datetime library being utilized from moment to date-fns
  - Upgraded date picker being utilized from react-dates (moment based) to react-datepicer (date-fns based)
- Fixed many issues with proper HTML decoding not being done on all visible UI fields
- Fixed issue with bounding double quotes not properly being stripped from property values
- Eliminated duplicating labels as a placeholder (when a placeholder isn't defined)
  - Added utilization of field specified placeholder
- Removed vertical column dividers for multi-column layouts
- Modified telephone field to use a canned placeholder only when no tooltip or placeholder is specified
- Removed occasional creation of stray horizontal group dividers
- Fixed warnings/error layout style to also consider bounding rectangle
- Casetypes response and case creation handling improvements
  - Fix case names in New menu to be the friendly names provided within the startingProcesses array
  - Include all the startingProcesses entries within the New menu (not just the first one)
  - Properly cope with casetype entries that are missing startingProcesses property
  - Stop hardcoding "pyStartCase" as the processID to use on POST /cases (rather always use ID value within startingProcesses entry)
- Image references relative to Pega app paths are not reachable, so display no image icon
- Enhance pxIcon and pxLink image handling to also leverage any classes in pega-icons as a fallback and share more common code
- Added "Settings" modal dialog and support for settings:
  - to utilize local options for Autocomplete and Dropdown fields configured to get values from a Data Page (The API now populates the options structure as it would for locallist sources, saving the additional transactions to retrieve the Data Page)
  - to utilize local options for Autocomplete and Dropdown fields configured to get values from a Clipboard Page
  - to use the preferred POST /assignments for the Save action within views. This then allows for validation against the flow action properties.
- Support for pxNumber field control type
- BUG FIXES:
  - Dropdown fields were not executing configured onchange action sets (rather was doing it onblur)
  - RadioButton was not executing configured onchange action sets
  - ENTER key within INPUT field was executing the Cancel button (should do nothing)
  - Checkbox controls not interacting smoothly/properly
    - keyboard space key not working to toggle state
    - clicking on label of left positioned checkbox now working
    - able to select text within left positioned checkbox label
  - "Inline middle" group layout style was displaying poorly
  - Autocomplete datapage queries were not passing configured params
  - Paragraph field title (Layout title) was being center aligned rather than left aligned
  - OpenUrlInWindow action set action was not properly resolving another field property reference
