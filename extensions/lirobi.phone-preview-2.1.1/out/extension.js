"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const license_manager_1 = require("./license-manager");
const phone_preview_panel_1 = require("./phone-preview-panel");
/**
 * Activates the extension
 * @param context The extension context
 */
function activate(context) {
    // Register the main command to show the preview
    let disposable = vscode.commands.registerCommand('mobile-preview.show', () => {
        // Check if URL is set, if not, set the default
        const config = vscode.workspace.getConfiguration('mobile-preview');
        const currentUrl = config.get('url');
        if (currentUrl === null || currentUrl === undefined || currentUrl === "") {
            // Set default URL
            config.update('url', "https://extensions.lilianbischung.fr", true);
        }
        phone_preview_panel_1.PhonePreviewPanel.createOrShow(context.extensionUri, context);
    });
    // Register command to open settings
    let openSettings = vscode.commands.registerCommand('mobile-preview.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'Mobile Preview');
    });
    // Register command to toggle pro version (for demo purposes)
    let togglePro = vscode.commands.registerCommand('mobile-preview.togglePro', async () => {
        const isPro = license_manager_1.LicenseManager.isPro(context);
        if (!isPro) {
            // When activating pro, show a dialog to enter license key
            const result = await vscode.window.showInformationMessage('Upgrade to Pro version to access all devices and features.', { modal: true }, 'Enter License Key', 'Purchase License');
            if (result === 'Enter License Key') {
                vscode.commands.executeCommand('mobile-preview.enterLicense');
            }
            else if (result === 'Purchase License') {
                vscode.commands.executeCommand('mobile-preview.purchaseLicense');
            }
        }
        else {
            // For demo purposes, allow switching back to free
            await license_manager_1.LicenseManager.setPro(context, false);
            // Refresh the panel if it's open
            if (phone_preview_panel_1.PhonePreviewPanel.currentPanel) {
                phone_preview_panel_1.PhonePreviewPanel.currentPanel._update();
            }
            vscode.window.showInformationMessage('Switched to free version.');
        }
    });
    // Register command to enter license key
    let enterLicense = vscode.commands.registerCommand('mobile-preview.enterLicense', async () => {
        const licenseKey = await vscode.window.showInputBox({
            prompt: 'Enter your Mobile Preview Pro license key',
            placeHolder: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
            validateInput: (value) => {
                // Basic validation for license key format
                // For production: const licenseKeyRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
                // For testing, allow more flexible formats
                const licenseKeyRegex = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/;
                if (!value) {
                    return 'License key is required';
                }
                if (!licenseKeyRegex.test(value)) {
                    return 'Invalid license key format. Expected: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX';
                }
                return null; // Valid
            }
        });
        if (!licenseKey) {
            return; // User cancelled
        }
        // Show progress while activating
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Verifying license...',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Contacting license server...' });
                // Verify the license
                const verificationResult = await license_manager_1.LicenseManager.verifyLicense(context, licenseKey);
                if (verificationResult.success && verificationResult.isValid) {
                    progress.report({ message: 'License verified. Activating on this device...' });
                    // Activate the license on this device (using the same verify endpoint)
                    const activationResult = await license_manager_1.LicenseManager.activateLicense(context, licenseKey);
                    if (activationResult.success && activationResult.isValid) {
                        // Refresh panel if open
                        if (phone_preview_panel_1.PhonePreviewPanel.currentPanel) {
                            phone_preview_panel_1.PhonePreviewPanel.currentPanel._update();
                        }
                        // Show success message with license details
                        const licenseType = activationResult.licenseType === 'pro' ? 'Pro' : 'Free';
                        const expiryInfo = activationResult.expiresAt ?
                            `Expires: ${new Date(activationResult.expiresAt).toLocaleDateString()}` :
                            'License: Lifetime';
                        const activationsInfo = activationResult.activationsRemaining !== undefined ?
                            `Activations remaining: ${activationResult.activationsRemaining}` :
                            '';
                        vscode.window.showInformationMessage(`Mobile Preview ${licenseType} activated successfully! ${expiryInfo}. ${activationsInfo}`);
                    }
                    else {
                        const errorDetails = activationResult.error || 'Unknown error';
                        console.error('License activation failed:', errorDetails);
                        vscode.window.showErrorMessage(`License activation failed: ${errorDetails}`);
                    }
                }
                else {
                    const errorDetails = verificationResult.error || 'Invalid license key';
                    console.error('License verification failed:', errorDetails, verificationResult);
                    vscode.window.showErrorMessage(`License verification failed: ${errorDetails}`);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`License verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });
    // Register command to view license info
    let viewLicenseInfo = vscode.commands.registerCommand('mobile-preview.viewLicenseInfo', async () => {
        const licenseInfo = license_manager_1.LicenseManager.getLicenseInfo(context);
        if (!licenseInfo || !licenseInfo.isPro) {
            vscode.window.showInformationMessage('No active license found. Purchase a license to unlock Pro features.');
            return;
        }
        // Format expiry date
        const expiryDate = licenseInfo.expiryDate
            ? new Date(licenseInfo.expiryDate).toLocaleDateString()
            : 'Never';
        // Format last validation date
        const lastValidation = licenseInfo.lastValidation
            ? new Date(licenseInfo.lastValidation).toLocaleDateString()
            : 'Never';
        // Create a message with license details
        const message = `
License Information:
-------------------
Status: ${licenseInfo.isPro ? 'Active' : 'Inactive'}
Type: ${licenseInfo.licenseType || 'Unknown'}
User: ${licenseInfo.userName || 'N/A'}
Email: ${licenseInfo.userEmail || 'N/A'}
Activated: ${new Date(licenseInfo.activationDate).toLocaleDateString()}
Expires: ${expiryDate}
Last Validated: ${lastValidation}
${licenseInfo.activationCount !== undefined ? `Activations: ${licenseInfo.activationCount}/${licenseInfo.maxActivations || 'Unlimited'}` : ''}
Features: ${licenseInfo.features ? licenseInfo.features.join(', ') : 'Standard'}
        `;
        vscode.window.showInformationMessage(message);
    });
    // Register command to open license purchase page
    let purchaseLicense = vscode.commands.registerCommand('mobile-preview.purchaseLicense', async () => {
        const url = license_manager_1.LicenseManager.LICENSE_PURCHASE_URL;
        vscode.env.openExternal(vscode.Uri.parse(url));
    });
    // Register command to deactivate license
    let deactivateLicense = vscode.commands.registerCommand('mobile-preview.deactivateLicense', async () => {
        const licenseInfo = license_manager_1.LicenseManager.getLicenseInfo(context);
        if (!licenseInfo || !licenseInfo.licenseKey) {
            vscode.window.showInformationMessage('No active license found to deactivate.');
            return;
        }
        const confirm = await vscode.window.showWarningMessage('Are you sure you want to deactivate your license on this device? You will lose access to Pro features.', { modal: true }, 'Deactivate', 'Cancel');
        if (confirm !== 'Deactivate') {
            return;
        }
        // Show progress while deactivating
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Deactivating license...',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Removing license from this device...' });
                await license_manager_1.LicenseManager.deactivateLicense(context, licenseInfo.licenseKey);
                // Refresh panel if open
                if (phone_preview_panel_1.PhonePreviewPanel.currentPanel) {
                    phone_preview_panel_1.PhonePreviewPanel.currentPanel._update();
                }
                vscode.window.showInformationMessage('License deactivated successfully.');
            }
            catch (error) {
                vscode.window.showErrorMessage(`License deactivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });
    // Register command to check license server status
    let checkLicenseServer = vscode.commands.registerCommand('mobile-preview.checkLicenseServer', async () => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Checking license server...',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Contacting server...' });
                const isAvailable = await license_manager_1.LicenseManager.checkLicenseServerStatus();
                if (isAvailable) {
                    // If server is available, try to get more information
                    progress.report({ message: 'Server is available. Testing license verification endpoint...' });
                    try {
                        // Try to verify a test license to check if the license endpoints are working
                        const testLicenseKey = 'TEST-LICENSE-KEY-FOR-SERVER-CHECK';
                        const machineId = await vscode.env.machineId;
                        const testData = {
                            licenseKey: testLicenseKey,
                            machineId: machineId,
                            extensionVersion: '1.2.0'
                        };
                        // Just make a request to see if the endpoint exists and responds
                        const response = await fetch(`${license_manager_1.LicenseManager.getLicenseServerUrl()}/licenses/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(testData)
                        });
                        // Any response means the endpoint exists
                        if (response.status < 500) {
                            vscode.window.showInformationMessage('License server is available and the verification endpoint is responding. You can now activate your license.');
                        }
                        else {
                            vscode.window.showWarningMessage('License server is available but returned a server error. Your license may not validate correctly.');
                        }
                    }
                    catch (endpointError) {
                        vscode.window.showWarningMessage('License server is available but the verification endpoint could not be reached. Your license may not validate correctly.');
                    }
                }
                else {
                    vscode.window.showErrorMessage('License server is not responding. Please check your connection and server status.');
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error checking license server: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    });
    context.subscriptions.push(disposable, openSettings, togglePro, enterLicense, viewLicenseInfo, purchaseLicense, deactivateLicense, checkLicenseServer);
    // Initialize device configuration
    license_manager_1.LicenseManager.updateDeviceConfiguration(license_manager_1.LicenseManager.isPro(context));
}
exports.activate = activate;
/**
 * Deactivates the extension
 */
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map