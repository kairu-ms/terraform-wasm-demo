import React, { Component } from "react";
import "./App.css";
import {
  AppBar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputBase,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";

import Login from "./oauth";
import { styled, alpha } from "@mui/material/styles";
import { LoadWasm, GetTFResource, BuildTFCfg } from "./terraform";
import SearchIcon from "@mui/icons-material/Search";
import Editor from "@monaco-editor/react";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(3),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "100%",
  },
}));

const ProviderSelector = styled(Select)(({ theme }) => ({
  color: "inherit",
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
}));

const PageContainer = styled(Container)(({ theme }) => ({
  color: theme.palette.common.white,
  position: "absolute",
  left: 0,
  right: 0,
  top: 64,
  bottom: 0,
  marginTop: 12,
  marginBottom: 12,
  display: "flex",
  alignItems: "stretch",
  flexDirection: "row",
  justifyContent: "center",
}));

const Background = styled(Box)({
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  zIndex: -2,
});

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
      resource_id: process.env.REACT_APP_TEST_RESOURCE_ID
        ? process.env.REACT_APP_TEST_RESOURCE_ID
        : null,
      tf_resource: null,
      loading: false,
      enable_auth: true,
      code: null,
      provider: "azapi"
    };
  }

  componentDidMount() {
    this.setState({
      loading: true,
    })
    LoadWasm().then(() => {
      this.setState({
        loading: false,
      })
    }).catch((err) => {
      console.error(err);
      this.setState({
        loading: false,
      })
    });
  }

  oauth2Login = async () => {
    this.setState({
      enable_auth: false,
    });
    const { tenantId } = this.state;
    try {
      let result = await Login(tenantId);
      this.setState({
        username: result.account.username,
        isAuthenticated: true,
        enable_auth: true,
      });
    } catch (err) {
      this.setState({
        enable_auth: true,
      });
    }
  };

  oauth2Logout = async () => {
    this.setState({
      isAuthenticated: false,
      username: null,
      resource_id: null,
      tf_resource: null,
    });
  };

  buildTfConfig = async () => {
    const { tenantId, subscriptionId } = this.state;
    const graphToken = await window.GetToken([
      "https://graph.microsoft.com/.default",
    ]);
    const mgmtToken = await window.GetToken([
      "https://management.azure.com//.default",
    ]);
    return BuildTFCfg(tenantId, subscriptionId, graphToken, mgmtToken);
  };

  getResource = async () => {
    this.setState({
      loading: true,
    });
    const { provider, resource_id } = this.state;
    const tfCfg = await this.buildTfConfig();
    const code = await GetTFResource(provider, resource_id, tfCfg);
    this.setState({
      code: code,
      loading: false,
    });
  };

  searchKeyDown = (event) => {
    const { loading } = this.state;
    if (!loading && event.key === "Enter") {
      this.getResource();
    }
  };

  onSearchChange = (event) => {
    this.setState({
      resource_id: event.target.value.trim(),
    });
  };

  changeProvider = (event) => {
    this.setState({
      provider: event.target.value,
    });
  }

  render() {
    const {
      isAuthenticated,
      tenantId,
      subscriptionId,
      resource_id,
      code,
      loading,
      enable_auth,
      provider,
    } = this.state;

    return (
      <>
        <div>
          <AppBar component="nav">
            <Toolbar sx={{ justifyContent: "space-between", height: 64 }}>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Terraform Wasm Demo
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 3,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isAuthenticated && (<>
                  <Search
                    sx={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <SearchIconWrapper>
                      <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                      sx={{ flex: 1 }}
                      placeholder="Please Input Resource ID"
                      inputProps={{ "aria-label": "search" }}
                      value={resource_id ? resource_id : ""}
                      onChange={this.onSearchChange}
                      onKeyDown={this.searchKeyDown}
                    />
                  </Search>

                  <ProviderSelector sx={{ width: 160}}
                    id="provider-selector"                    
                    value={provider}
                    label="Provider"
                    size="small"
                    onChange={this.changeProvider}
                  >
                    <MenuItem value={"azapi"}>AzAPI</MenuItem>
                    <MenuItem value={"azurerm"}>AzureRM</MenuItem>
                  </ProviderSelector>
                </>
                )}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                {isAuthenticated && (
                  <Button color="inherit" onClick={this.oauth2Logout}>
                    Logout
                  </Button>
                )}
              </Box>
            </Toolbar>
          </AppBar>
          <PageContainer>
            {code && !loading && <Editor
              width="100%"
              height="100%"
              language="HCL"
              theme="vs-dark"
              value={code}
            ></Editor>}
          </PageContainer>
          <Background />
        </div>

        <Dialog
          open={!isAuthenticated && !loading}
          maxWidth="md"
          fullWidth={true}
          disableEscapeKeyDown
        >
          <DialogTitle>Auth</DialogTitle>
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
              value={tenantId ? tenantId : ""}
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
              value={subscriptionId ? subscriptionId : ""}
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
            {!enable_auth && (
              <Box sx={{ width: "100%" }}>
                <LinearProgress color="info" />
              </Box>
            )}
            {enable_auth && (
              <Button
                onClick={this.oauth2Login}
                disabled={!subscriptionId || !tenantId}
              >
                Login
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </>
    );
  }
}

export default App;
