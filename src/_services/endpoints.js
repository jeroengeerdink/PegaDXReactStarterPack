// OAuth login box type (only recent testing with Main)
export const loginBoxType = {
  Main: 1,
  Popup: 2,
  Modal: 3,
};

export const endpoints = {
  // Change this URL if you want to point the React application at another Pega server.
  BASEURL: "https://dx.pegatsdemo.com/prweb/api/v1", // local Pega server

  use_OAuth: false,

  OAUTHCFG: {
    // Sample settings (please update with data from your OAuth 2.0 Client Configuration record)
    client_id: "62031018436007304421",
    authority: "https://dx.pegatsdemo.com/prweb/PRRestService/oauth2/v1",
    authorization:
      "https://dx.pegatsdemo.com/prweb/PRRestService/oauth2/v1/authorize",
    token: "https://dx.pegatsdemo.com/prweb/PRRestService/oauth2/v1/token",

    // Optional params
    // Revoking "Public" tokens not currently supported within Pega 8.5 (leave below commented out)
    // revoke: "https://localhost:1080/prweb/PRRestService/oauth2/v1/revoke",

    use_pkce: true,
    loginExperience: loginBoxType.Main,
  },

  AUTH: "/authenticate",
  CASES: "/cases",
  CASETYPES: "/casetypes",
  VIEWS: "/views",
  ASSIGNMENTS: "/assignments",
  ACTIONS: "/actions",
  PAGES: "/pages",
  DATA: "/data",
  REFRESH: "/refresh",
};
