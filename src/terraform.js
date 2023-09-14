function getWasmUrl(filename) {
  const url = process.env.REACT_APP_PUBLIC_URL + "/" + filename;
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

async function RunAzapi(resource_type, resource_id, tfCfg) {
  const url = getWasmUrl("azapi.wasm");
  return await window.terraformImport(
    "azapi",
    url,
    resource_type,
    resource_id,
    JSON.stringify(tfCfg)
  );
}

export { LoadWasm, RunAzapi };
