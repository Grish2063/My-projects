"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhonePreviewPanel = void 0;
const vscode = require("vscode");
const device_registry_1 = require("./device-registry");
const license_manager_1 = require("./license-manager");
const webview_template_1 = require("./webview-template");
/**
 * Manages the phone preview webview panel
 */
class PhonePreviewPanel {
    /**
     * Creates a new PhonePreviewPanel or shows an existing one
     * @param extensionUri The extension URI
     * @param context The extension context
     */
    static createOrShow(extensionUri, context) {
        if (PhonePreviewPanel.currentPanel) {
            PhonePreviewPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
            return;
        }
        const config = vscode.workspace.getConfiguration('mobile-preview');
        const deviceName = config.get('device') || "iPhone 13 Pro";
        const panel = vscode.window.createWebviewPanel('phonePreview', deviceName, vscode.ViewColumn.Two, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'out', 'assets')
            ]
        });
        PhonePreviewPanel.currentPanel = new PhonePreviewPanel(panel, extensionUri, context);
    }
    /**
     * Private constructor to enforce singleton pattern
     * @param panel The webview panel
     * @param extensionUri The extension URI
     * @param context The extension context
     */
    constructor(panel, extensionUri, context) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update content when the active editor changes
        vscode.window.onDidChangeActiveTextEditor(() => {
            this._update();
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            await this._handleMessage(message);
        });
    }
    /**
     * Updates the webview content
     */
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        // Update panel title to match selected device
        const config = vscode.workspace.getConfiguration('mobile-preview');
        const deviceName = config.get('device') || "iPhone 13 Pro";
        this._panel.title = deviceName;
    }
    /**
     * Generates the HTML for the webview
     * @param webview The webview
     * @returns The HTML content
     */
    _getHtmlForWebview(webview) {
        const config = vscode.workspace.getConfiguration('mobile-preview');
        const currentFile = config.get('url') || "https://extensions.lilianbischung.fr";
        const deviceName = config.get('device') || "iPhone 13 Pro";
        // Get device from registry
        const device = device_registry_1.DeviceRegistry.getDevice(deviceName);
        // Check if pro version is enabled
        const isPro = license_manager_1.LicenseManager.isPro(this._context);
        // Get available devices based on license status
        const availableDevices = device_registry_1.DeviceRegistry.getDevices(isPro);
        // Get license info if available
        const licenseInfo = license_manager_1.LicenseManager.getLicenseInfo(this._context);
        return (0, webview_template_1.getWebviewContent)(webview, this._extensionUri, device, currentFile, availableDevices, isPro, licenseInfo);
    }
    /**
     * Handle messages from the webview
     * @param message The message from the webview
     */
    async _handleMessage(message) {
        switch (message.command) {
            case 'openUrl':
                vscode.env.openExternal(vscode.Uri.parse(message.url));
                break;
            case 'switchToPro':
                vscode.commands.executeCommand('mobile-preview.togglePro');
                break;
            case 'changeDevice':
                // Remove the "(Pro)" suffix if present to get the actual device name
                const cleanDeviceName = message.device.replace(' (Pro)', '');
                // Get the actual device to check its category
                const device = device_registry_1.DeviceRegistry.getDevice(cleanDeviceName);
                // Check if this is a pro device and the user doesn't have pro
                if (device.category === "pro" && !license_manager_1.LicenseManager.isPro(this._context)) {
                    // Show a popup to purchase Pro
                    const action = await vscode.window.showInformationMessage('This device is only available in the Pro version.', 'Purchase License', 'Enter License Key');
                    if (action === 'Purchase License') {
                        vscode.commands.executeCommand('mobile-preview.purchaseLicense');
                    }
                    else if (action === 'Enter License Key') {
                        vscode.commands.executeCommand('mobile-preview.enterLicense');
                    }
                    return;
                }
                // If we get here, either the user has Pro or selected a free device
                await vscode.workspace.getConfiguration('mobile-preview').update('device', cleanDeviceName, true);
                this._update();
                break;
            case 'enterLicense':
                vscode.commands.executeCommand('mobile-preview.enterLicense');
                break;
            case 'viewLicenseInfo':
                vscode.commands.executeCommand('mobile-preview.viewLicenseInfo');
                break;
            case 'purchaseLicense':
                vscode.commands.executeCommand('mobile-preview.purchaseLicense');
                break;
            case 'updateUrl':
                // Update the URL in settings
                await vscode.workspace.getConfiguration('mobile-preview').update('url', message.url, true);
                break;
        }
    }
    /**
     * Disposes of the panel and its resources
     */
    dispose() {
        PhonePreviewPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.PhonePreviewPanel = PhonePreviewPanel;
//# sourceMappingURL=phone-preview-panel.js.map