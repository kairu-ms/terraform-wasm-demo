import React, { Component } from "react";
import "./App.css";
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputBase,
  LinearProgress,
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
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    // transition: theme.transitions.create('width'),
    width: "100%",
    // [theme.breakpoints.up('md')]: {
    //   width: '20ch',
    // },
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
      code: null,
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
    let result = await Login(tenantId);
    this.setState({
      username: result.account.username,
      isAuthenticated: true,
    });
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
    const { resource_id } = this.state;
    const tfCfg = await this.buildTfConfig();
    let resource = await GetTFResource(resource_id, tfCfg);
    resource = JSON.parse(resource);
    const code = JSON.stringify(resource, undefined, 4);
    console.log(code);
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

  render() {
    const {
      isAuthenticated,
      tenantId,
      subscriptionId,
      resource_id,
      code,
      loading,
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
                {isAuthenticated && (
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
                  <Button color="inherit" onClick={this.logout}>
                    Logout
                  </Button>
                )}
              </Box>
            </Toolbar>
          </AppBar>
          <PageContainer>
            {loading && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Loading...
                </Typography>
                {/* <LinearProgress color="info" /> */}
              </Box>
            )}
            {code && (
              <Editor
                width="100%"
                height="100%"
                language="json"
                theme="vs-dark"
                value={code}
              ></Editor>
            )}
          </PageContainer>
          <Background />
        </div>

        <Dialog
          open={!isAuthenticated}
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
            <Button
              onClick={this.oauth2Login}
              disabled={!subscriptionId || !tenantId}
            >
              Login
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

export default App;
