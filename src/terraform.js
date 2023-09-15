function getWasmUrl(filename) {
  const url = "https://terraformwasmdemo.blob.core.windows.net/statics/" + filename;
  return url;
}

async function LoadWasm() {
  const go = new window.Go();
  const url = getWasmUrl("client.wasm");
  const result = await WebAssembly.instantiateStreaming(
    fetch(url),
    go.importObject
  );
  go.run(result.instance);
}

function BuildTFCfg(tenantId, subscriptionId, graphToken, mgmtToken) {
  return {
    // tenant_id: tenantId,
    // subscription_id: subscriptionId,
    // graph_token: graphToken,
    // mgmt_token: mgmtToken,
    
    use_access_token: true,
    access_token: mgmtToken,
  };
}

async function GetTFResource(resource_id, tfCfg) {
  const url = getWasmUrl("azapi.wasm");
  return await window.terraformImport(
    "azapi",
    url,
    "azapi_resource",
    resource_id,
    JSON.stringify(tfCfg)
  );
}

export { LoadWasm, GetTFResource, BuildTFCfg };
