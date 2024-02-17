// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {	
	// Command for counting words
	let disposableCountWords = vscode.commands.registerCommand('helloworld.countWords', () => {
    // Get the active text editor
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No document is open');
      return;
    }

    const documentText = editor.document.getText();
    const wordCount = countWords(documentText);
    vscode.window.showInformationMessage(`Word Count: ${wordCount}`);
  });

  // Command for counting lines
  let disposableCountLines = vscode.commands.registerCommand('helloworld.countLines', () => {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No document is open');
      return;
    }

    const lineCount = editor.document.lineCount;
    vscode.window.showInformationMessage(`Line Count: ${lineCount}`);
  });

  context.subscriptions.push(disposableCountWords, disposableCountLines);
}

// Function to count words in a string
function countWords(text: string): number {
	// Split the text into words using a regular expression
	const words = text.match(/\w+/g);
	return words ? words.length : 0;
  }

// This method is called when your extension is deactivated
export function deactivate() {}
