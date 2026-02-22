const vscode = acquireVsCodeApi();

let gridApi;
let editedRows = {};


document.addEventListener("DOMContentLoaded", () => {
  const gridDiv = document.querySelector("#myGrid");

  const gridOptions = {
    cellSelection: true,
    enableRangeSelection: true,
    defaultColDef: {
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
    },

    rowSelection: {
      mode: "multiRow"
    },
    animateRows: true,
    onCellValueChanged: (params) => {
      const rowId = params.node.id;
      editedRows[rowId] = params.data;

      document.getElementById("dirtyFlag").innerText =
        "Unsaved changes";
    },
    onSortChanged: () => {
      const sortModel = gridApi.getSortModel();
      vscode.postMessage({
        command: "sort",
        sortModel
      });
    },
    onFilterChanged: () => {
      const filterModel = gridApi.getFilterModel();
      vscode.postMessage({
        command: "filter",
        filterModel
      });
    }
  };

  gridApi = agGrid.createGrid(gridDiv, gridOptions);

  vscode.postMessage({ command: "webviewReady" });
});

window.addEventListener("message", event => {
  const message = event.data;

  if (message.command === "render") {
    const columnDefs = message.headers.map(h => ({
      headerName: h,
      field: h
    }));

    gridApi.setGridOption("columnDefs", columnDefs);
    gridApi.setGridOption('rowData', message.rows);
  }

  if (message.command === "clearDirty") {
    editedRows = {};
    document.getElementById("dirtyFlag").innerText = "";
  }
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  vscode.postMessage({ command: "refresh" });
});

document.getElementById("saveBtn").addEventListener("click", () => {
  vscode.postMessage({
    command: "saveChanges",
    changes: Object.values(editedRows)
  });
});