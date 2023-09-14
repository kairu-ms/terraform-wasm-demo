import React, { Component } from "react";
import "./App.css";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import Login from "./oauth";

import { LoadWasm, RunAzapi } from "./terraform";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      tenantId: process.env.REACT_APP_USER_TANENT_ID
        ? process.env.REACT_APP_USER_TANENT_ID
        : "",
      subscriptionId: process.env.REACT_APP_USER_SUBSCRIPTION_ID
        ? process.env.REACT_APP_USER_SUBSCRIPTION_ID
        : "",
      username: null,
      resource_type: process.env.REACT_APP_TEST_RESOURCE_TYPE
        ? process.env.REACT_APP_TEST_RESOURCE_TYPE
        : null,
      resource_id: process.env.REACT_APP_TEST_RESOURCE_ID
        ? process.env.REACT_APP_TEST_RESOURCE_ID
        : null,
    };
  }

  componentDidMount() {
    LoadWasm().catch((err) => {
      console.error(err);
    });
    console.log(process.env);
  }

  oauth2Login = async () => {
    const { tenantId } = this.state;
    // let result = await Login(tenantId);
    this.setState({
      // username: result.account.username,
      isAuthenticated: true,
    });
    this.getResource();
  };

  buildTfConfig = () => {
    const { tenantId, subscriptionId } = this.state;
    return {
      tenant_id: tenantId,
      subscription_id: subscriptionId,
      // TODO: use GetToken() to get token instead.
      client_id: process.env.REACT_APP_USER_CLIENT_ID,
      client_secret: process.env.REACT_APP_USER_CLIENT_PASSWORD,
    };
  };

  getResource = async () => {
    const { resource_type, resource_id } = this.state;
    const tfCfg = this.buildTfConfig();
    const result = await RunAzapi(resource_type, resource_id, tfCfg);
    console.log(result);
  };

  render() {
    const { isAuthenticated, tenantId, subscriptionId, username } = this.state;

    return (
      <>
        <div className="App">
          <h1>Terraform</h1>
          {username && <pre>Hello {username}</pre>}
        </div>
        <Dialog
          open={!isAuthenticated}
          maxWidth="md"
          fullWidth={true}
          disableEscapeKeyDown
        >
          <DialogTitle>Sign In</DialogTitle>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <TextField
              autoFocus
              margin="normal"
              id="tenantId"
              required
              value={tenantId}
              onChange={(event) => {
                this.setState({
                  tenantId: event.target.value,
                });
              }}
              label="Tenant ID"
              type="text"
              variant="standard"
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
                });
              }}
              label="Subscription ID"
              type="password"
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={this.oauth2Login}
              disabled={!subscriptionId || !tenantId}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

export default App;
