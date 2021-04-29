import _ from "lodash";

import { actionTypes } from "../_actions";

/**
 * Redux reducers.
 * Used to update state in the store after actions are issued.
 */
const assignmentsDefaultState = {
  allAssignments: {},
  assignmentDetails: {},
  assignmentLoading: {},
  openAssignments: [],
  views: {},
  viewHeaders: {},
  activeIndex: 0,
  openAssignmentsTabIdx: [],
  worklistSettings: {
    column: "pxUrgencyAssign",
    direction: "descending",
    assignmentType: "Worklist",
  },
  openCasesData: {},
};

export function assignments(state = assignmentsDefaultState, action) {
  switch (action.type) {
    case actionTypes.ASSIGNMENTS_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case actionTypes.ASSIGNMENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        allAssignments: _.keyBy(action.assignments, (o) => o.caseID),
      };
    case actionTypes.ASSIGNMENTS_FAILURE:
      return {
        ...state,
        loading: false,
      };
    case actionTypes.ASSIGNMENT_FIELDS_SUCCESS:
      return {
        ...state,
        views: {
          ...state.views,
          [action.data.caseID]: action.data.view,
        },
        viewHeaders: {
          ...state.viewHeaders,
          [action.data.caseID]: action.data.name,
        },
        assignmentLoading: {
          ...state.assignmentLoading,
          [action.data.caseID]: false,
        },
      };
    case actionTypes.ASSIGNMENT_PERFORM_REFRESH_SUCCESS:
      return {
        ...state,
        loading: false,
        views: {
          ...state.views,
          [action.assignment.caseID]: action.assignment.view,
        },
        viewHeaders: {
          ...state.viewHeaders,
          [action.assignment.caseID]: action.assignment.name,
        },
      };
    case actionTypes.ASSIGNMENT_REQUEST:
      return state;
    case actionTypes.ADD_OPEN_ASSIGNMENT:
      let successIndex = state.openAssignments.findIndex(
        (x) => x === action.caseID
      );

      return {
        ...state,
        openAssignments:
          successIndex === -1
            ? [...state.openAssignments, action.caseID]
            : [
                ...state.openAssignments.slice(0, successIndex),
                ...state.openAssignments.slice(successIndex + 1),
                action.caseID,
              ],
      };
    case actionTypes.ASSIGNMENT_SUCCESS:
      return {
        ...state,
        openAssignmentsTabIdx: state.openAssignmentsTabIdx.find(
          (x) => x === action.assignment.caseID
        )
          ? state.openAssignmentsTabIdx
          : [action.assignment.caseID, ...state.openAssignmentsTabIdx],
        assignmentDetails: {
          ...state.assignmentDetails,
          [action.assignment.caseID]: action.assignment,
        },
        activeIndex: state.openAssignments ? state.openAssignments.length : 0,
        openCasesData: {
          ...state.openCasesData,
          [action.assignment.caseID]: {},
        },
      };

    case actionTypes.ASSIGNMENT_REVIEW_MODE:
      return {
        ...state,
        openAssignmentsTabIdx: [action.caseID, ...state.openAssignmentsTabIdx],
        activeIndex: state.openAssignments.length,
      };

    case actionTypes.ASSIGNMENT_FAILURE:
      return state;

    case actionTypes.ASSIGNMENT_CLOSED:
      let close_index = state.openAssignments.findIndex((x) => x === action.id);
      let openAssignments = state.openAssignments;
      if (close_index > -1) {
        openAssignments = [
          ...state.openAssignments.slice(0, close_index),
          ...state.openAssignments.slice(close_index + 1),
        ];
      }

      let tabIdx = state.openAssignmentsTabIdx.findIndex(
        (x) => x === action.id
      );
      let openAssignmentsTabIdx = state.openAssignmentsTabIdx;
      if (tabIdx > -1) {
        openAssignmentsTabIdx = [
          ...state.openAssignmentsTabIdx.slice(0, tabIdx),
          ...state.openAssignmentsTabIdx.slice(tabIdx + 1),
        ];
      }

      let caseIdx = openAssignments.findIndex(
        (x) => x === openAssignmentsTabIdx[0]
      );
      if (caseIdx === -1 && !action.id.includes(" "))
        caseIdx = openAssignments.length;

      return {
        ...state,
        openAssignmentsTabIdx,
        openAssignments,
        openCasesData: {
          ...state.openCasesData,
          [action.id]: {},
        },
        activeIndex: caseIdx >= 0 ? caseIdx + 1 : 0,
      };

    case actionTypes.ASSIGNMENT_CHANGED:
      let openAssignmentsIdxs = [...state.openAssignmentsTabIdx];
      if (action.activeIndex > 0) {
        let caseId = state.openAssignments[action.activeIndex - 1];
        let tabIdx = state.openAssignmentsTabIdx.findIndex((x) => x === caseId);
        if (tabIdx !== -1) {
          openAssignmentsIdxs = [
            caseId,
            ...state.openAssignmentsTabIdx.slice(0, tabIdx),
            ...state.openAssignmentsTabIdx.slice(tabIdx + 1),
          ];
        }
      }
      return {
        ...state,
        openAssignmentsTabIdx: openAssignmentsIdxs,
        activeIndex: action.activeIndex,
      };

    case actionTypes.WORKLIST_SAVE_SETTINGS:
      return {
        ...state,
        worklistSettings: action.worklist,
      };

    case actionTypes.ASSIGNMENT_REFRESH_REQUEST:
      return {
        ...state,
        assignmentLoading: {
          ...state.assignmentLoading,
          [action.caseID]: true,
        },
      };
    case actionTypes.ASSIGNMENT_REFRESH_SUCCESS:
      return {
        ...state,
        assignmentDetails: {
          ...state.assignmentDetails,
          [action.assignment.caseID]: action.assignment,
        },
        assignmentLoading: {
          ...state.assignmentLoading,
          [action.caseID]: false,
        },
      };
    case actionTypes.ASSIGNMENT_REFRESH_FAILURE:
      return {
        ...state,
        assignmentLoading: {
          ...state.assignmentLoading,
          [action.caseID]: false,
        },
      };
    case actionTypes.ASSIGNMENT_PERFORM_ACTION_REQUEST:
      return {
        ...state,
        assignmentLoading: {
          ...state.assignmentLoading,
          [action.caseID]: true,
        },
      };
    case actionTypes.ASSIGNMENT_PERFORM_ACTION_SUCCESS:
      return state;
    case actionTypes.ASSIGNMENT_PERFORM_ACTION_FAILURE:
      return {
        ...state,
        assignmentLoading: {
          ...state.assignmentLoading,
          [action.caseID]: false,
        },
      };
    case actionTypes.ASSIGNMENT_SAVE_DATA:
      return {
        ...state,
        openCasesData: {
          ...state.openCasesData,
          [action.caseID]: action.data,
        },
      };
    default:
      return state;
  }
}
