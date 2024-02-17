import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

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

	let disposableListOpenEditors = vscode.commands.registerCommand('extension.listOpenEditors', () => {
		const openedDocs = vscode.workspace.textDocuments;
		if (openedDocs.length === 0) {
			vscode.window.showInformationMessage('No files are currently opened');
			return;
		}

		// Map the document URIs to their file paths
		const filePaths = openedDocs.map(doc => doc.uri.fsPath);

		// Show the file paths in a Quick Pick menu
		vscode.window.showQuickPick(filePaths, {
			placeHolder: 'Opened Files',
			onDidSelectItem: item => {
				const selectedPath = item as string;
				const doc = openedDocs.find(d => d.uri.fsPath === selectedPath);
				if (doc) {
					vscode.window.showTextDocument(doc);
				}
			}
		});
	});

	let disposableReplaceJuan = vscode.commands.registerCommand('extension.replaceJuanWithMola', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No editor is active');
			return;
		}

		const document = editor.document;

		// Create a text edit for each occurrence of "juan" and replace it with "mola"
		const edit = new vscode.WorkspaceEdit();
		const regex = /juan/gi; // The "i" flag is for case-insensitive search

		for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
			const line = document.lineAt(lineNumber);
			let match;
			while ((match = regex.exec(line.text)) !== null) {
				const matchRange = new vscode.Range(lineNumber, match.index, lineNumber, match.index + match[0].length);
				edit.replace(document.uri, matchRange, 'mola');
			}
		}

		// Apply the text edits
		vscode.workspace.applyEdit(edit).then(success => {
			if (success) {
				vscode.window.showInformationMessage('All occurrences of "juan" have been replaced with "mola"');
			} else {
				vscode.window.showErrorMessage('Failed to replace text');
			}
		});
	});

	let disposableListAllFiles = vscode.commands.registerCommand('extension.listAllFiles', async () => {
		if (vscode.workspace.workspaceFolders === undefined) {
			vscode.window.showInformationMessage('No workspace is open');
			return;
		}

		const workspaceFolders = vscode.workspace.workspaceFolders;
		const allFilesPromises = workspaceFolders.map(folder => listFilesInDirectory(folder.uri.fsPath));

		Promise.all(allFilesPromises).then(filesArrays => {
			const allFiles = filesArrays.flat();
			vscode.window.showQuickPick(allFiles, {
				placeHolder: 'Select a file to open',
				canPickMany: true
			}).then(selectedFiles => {
				if (selectedFiles) {
					selectedFiles.forEach(file => {
						vscode.workspace.openTextDocument(file).then(doc => {
							vscode.window.showTextDocument(doc);
						});
					});
				}
			});
		});
	});

	let disposableCallWebService = vscode.commands.registerCommand('helloworld.callWebService', async () => {
		try {
			const response = await axios.get('https://api.github.com/users/octocat');
			vscode.window.showInformationMessage(`User: ${response.data.login}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error}`);
		}
	});

	let disposableCreateWindow = vscode.commands.registerCommand('extension.createWindow', () => {
		const panel = vscode.window.createWebviewPanel(
			'newWindow',
			'New Window',
			vscode.ViewColumn.One,
			{
				// Enable scripts in the webview
				enableScripts: true
			}
		);

		panel.webview.html = getWebviewContent();

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'buttonClicked':
						vscode.window.showInformationMessage('Button was clicked!');
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});
	
	const myView = vscode.window.createTreeView('myView', {
		treeDataProvider: aNodeWithId('Hello World')
	});

	context.subscriptions.push(disposableCountWords, disposableCountLines, disposableListOpenEditors, disposableReplaceJuan, disposableListAllFiles,
		disposableCallWebService, disposableCreateWindow, myView);


}

function countWords(text: string): number {
	// Split the text into words using a regular expression
	const words = text.match(/\w+/g);
	return words ? words.length : 0;
}

async function listFilesInDirectory(dir: string): Promise<string[]> {
	const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));
	const files = entries.filter(entry => entry[1] === vscode.FileType.File).map(entry => path.join(dir, entry[0]));
	const directories = entries.filter(entry => entry[1] === vscode.FileType.Directory).map(entry => path.join(dir, entry[0]));

	const filesInSubdirectoriesPromises = directories.map(subdir => listFilesInDirectory(subdir));
	const filesInSubdirectories = await Promise.all(filesInSubdirectoriesPromises);

	return files.concat(filesInSubdirectories.flat());
}

function getWebviewContent() {
	return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Window</title>
            <script>
                const vscode = acquireVsCodeApi();

                function buttonClicked() {
                    // Send a message to the extension
                    vscode.postMessage({
                        command: 'buttonClicked'
                    });
                }
            </script>
        </head>
        <body>
            <h1>Hello World</h1>
            <button onclick="buttonClicked()">Click me</button>
        </body>
        </html>`;
}

function aNodeWithId(label: string): vscode.TreeDataProvider<string> {
	return {
		getTreeItem: (id: string): vscode.TreeItem => {
			let treeItem = new vscode.TreeItem(id);
			treeItem.id = id;
			return treeItem;
		},
		getChildren: (id: string): Thenable<string[]> => {
			if (id) {
				return Promise.resolve([id]);
			} else {
				return Promise.resolve(['Hello World']);
			}
		}
	};
}

// This method is called when your extension is deactivated
export function deactivate() { }
