import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

function buildMsalConfig(tenantId) {
  return {
    auth: {
      clientId: process.env.REACT_APP_AZURE_APP_CLIENT_ID,
      // https://login.microsoftonline.com/<tenantId>
      authority: process.env.REACT_APP_AZURE_APP_AUTHORITY_HOST + tenantId,
      redirectUri: process.env.REACT_APP_AZURE_APP_REDIRECT_URI,
    },
    cache: {
      cacheLocation: "sessionStorage", // This configures where your cache will be stored
      storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              console.info(message);
              return;
            case LogLevel.Verbose:
              console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
            default:
              console.log(message);
              return;
          }
        },
      },
    },
  };
}

async function GetToken(scopes = ["https://management.azure.com//.default"]) {
  if (!window.msalInstance) {
    throw Error("Login first");
  }
  const tokenRequest = {
    scopes: scopes,
  };
  let response = await window.msalInstance.acquireTokenSilent(tokenRequest);
  if (response == null) {
    response = await window.msalInstance.acquireTokenPopup(tokenRequest);
  }
  if (!response) {
    throw Error("Get token failed");
  }
  return response.accessToken;
}

async function Login(tenantId) {
  window.msalInstance = null;
  window.GetToken = null;
  const msalConfig = buildMsalConfig(tenantId);
  const msalInstance =
    await PublicClientApplication.createPublicClientApplication(msalConfig);
  const loginRequest = {
    scopes: [
      "https://management.core.windows.net//user_impersonation",
      "openid",
      "email",
      "profile",
    ],
  };
  let response = await msalInstance.loginPopup(loginRequest);
  if (response == null) {
    throw Error("Login failed");
  }
  msalInstance.setActiveAccount(response.account);
  window.msalInstance = msalInstance;
  window.GetToken = GetToken;
  return response;
}

export default Login;
