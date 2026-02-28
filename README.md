# DBTool - VS Code Database Explorer

Edit database data in a spreadsheet-like view directly within VS Code. Intuitive like Excel.

![Demo](media/demo.gif)

Currently supports PostgreSQL, with more databases coming soon.

## Features

- Connect to PostgreSQL databases
- Browse schemas and tables
- Edit data in a spreadsheet view
- Execute queries

## Installation

VS Code Marketplace or manual install:
`code --install-extension db-tool-0.1.1.vsix`

## Development

Submodule:
```cmd
npm install
npm run build
```
Main project:
```cmd
npm install
npm run compile
vsce package
```
