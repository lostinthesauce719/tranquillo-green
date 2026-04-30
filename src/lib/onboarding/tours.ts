import { Step } from "react-joyride";

export const csvImportTourSteps: Step[] = [
  {
    target: '[data-tour="period-select"]',
    content: "First, select the accounting period these transactions belong to.",
    title: "Choose Period",
  },
  {
    target: '[data-tour="upload-dropzone"]',
    content: "Upload your CSV file by clicking here or dragging and dropping.",
    title: "Upload CSV",
  },
  {
    target: '[data-tour="column-mapping"]',
    content: "Map each CSV column to the appropriate accounting field. This tells us how to interpret your data.",
    title: "Map Columns",
  },
  {
    target: '[data-tour="preview-table"]',
    content: "Review the first few rows to confirm the mapping looks correct.",
    title: "Preview Data",
  },
  {
    target: '[data-tour="stage-button"]',
    content: "All set? Click 'Stage Import' to process your data.",
    title: "Stage Import",
  },
];

export const tours = [
  {
    id: "csv-import",
    name: "CSV Import",
  },
];
