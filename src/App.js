import React, {Component} from 'react';
import './App.css';
import { PublicClientApplication, LogLevel } from '@azure/msal-browser';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      tenantId: "",
      subscriptionId: "",
      msalInstance: null,
      username: null,
    };
  }

  buildMsalConfig = () => {
    const {tenantId, subscriptionId} = this.state;
    if (!tenantId || !subscriptionId) {
      return null;
    }
    return {
      auth: {
        clientId: process.env.REACT_APP_AZURE_APP_CLIENT_ID,
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
                }	
            }	
        }	
      }
    };
  }

  oauth2Login = async () => {
    const msalConfig = this.buildMsalConfig();
    console.debug(msalConfig);
    if (!msalConfig) {
      return;
    }
    try {
      const msalInstance = await PublicClientApplication.createPublicClientApplication(msalConfig);  
      const loginRequest = {
        scopes: ["https://management.core.windows.net//user_impersonation", "openid", "email", "profile"],
      };
      let response = await msalInstance.loginPopup(loginRequest);
      if (response == null) {
        return;        
      }
      msalInstance.setActiveAccount(response.account);
      const tokenRequest = {
        // scopes: ["https://management.azure.com//.default"],
        scopes: ["https://graph.microsoft.com/.default"],
        // it's invalid to combine two scopes together like: 
        // ["https://graph.microsoft.com/.default", "https://management.azure.com//.default"],
      };
      response = await msalInstance.acquireTokenSilent(tokenRequest);
      if (response == null) {
        return;
      }
      console.debug(response);
      this.setState({
        isAuthenticated: true,
        msalInstance: msalInstance,
        username: response.account.username,
      });
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    const { isAuthenticated, tenantId, subscriptionId, username } = this.state;
    
    return (
      <>
        <div className="App">
          <h1>Terraform</h1>
          {username && <pre>Hello {username}</pre>}
        </div>
        <Dialog open={!isAuthenticated} maxWidth="md" fullWidth={true} disableEscapeKeyDown>
          <DialogTitle>Sign In</DialogTitle>
          <DialogContent sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}>
            <TextField
                autoFocus
                margin="normal"
                id="tenantId"
                required
                value={tenantId}
                onChange={(event) => {
                    this.setState({
                      tenantId: event.target.value,
                    })
                }}
                label="Tenant ID"
                type="text"
                variant='standard'
            />
            <TextField
                autoFocus
                margin="normal"
                id="subscriptionId"
                required
                value={subscriptionId}
                onChange={(event) => {
                    this.setState({
                      subscriptionId: event.target.value,
                    })
                }}
                label="Subscription ID"
                type="password"
                variant='standard'
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.oauth2Login} disabled={!subscriptionId || !tenantId}>Confirm</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

export default App;
