"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseManager = void 0;
const vscode = require("vscode");
const crypto = require("crypto");
const os = require("os");
const device_registry_1 = require("./device-registry");
/**
 * License management with enhanced security
 */
class LicenseManager {
    /**
     * Check if user has pro license with verification
     * @param context The extension context
     * @returns Whether the user has a valid pro license
     */
    static isPro(context) {
        try {
            const encryptedLicense = context.globalState.get(this.LICENSE_KEY);
            const verificationHash = context.globalState.get(this.LICENSE_VERIFICATION_KEY);
            if (!encryptedLicense || !verificationHash) {
                return false;
            }
            // Decrypt the license data
            const license = this.decrypt(encryptedLicense);
            if (!license) {
                return false;
            }
            // Parse the license data
            const licenseData = JSON.parse(license);
            // Verify the license hasn't been tampered with
            const computedHash = this.generateVerificationHash(licenseData);
            if (computedHash !== verificationHash) {
                // If verification fails, reset the license
                this.resetLicense(context);
                return false;
            }
            // Check if license is valid and not expired
            if (licenseData.isPro && licenseData.expiryDate) {
                const expiryDate = new Date(licenseData.expiryDate);
                return expiryDate > new Date();
            }
            // Check if we need to validate online
            if (licenseData.lastValidation) {
                const lastValidation = new Date(licenseData.lastValidation);
                const now = new Date();
                const daysSinceLastValidation = Math.floor((now.getTime() - lastValidation.getTime()) / (1000 * 60 * 60 * 24));
                // If we've been offline too long, we should validate online
                if (daysSinceLastValidation > this.OFFLINE_GRACE_PERIOD_DAYS) {
                    // We'll return true for now, but trigger a background validation
                    this.validateLicenseInBackground(context, licenseData.licenseKey || '');
                }
            }
            return licenseData.isPro === true;
        }
        catch (error) {
            // If any error occurs, reset the license and return false
            this.resetLicense(context);
            return false;
        }
    }
    /**
     * Check if user has a specific feature
     * @param context The extension context
     * @param featureName The name of the feature to check
     * @returns Whether the user has access to the feature
     */
    static hasFeature(context, featureName) {
        try {
            const encryptedLicense = context.globalState.get(this.LICENSE_KEY);
            const verificationHash = context.globalState.get(this.LICENSE_VERIFICATION_KEY);
            if (!encryptedLicense || !verificationHash) {
                return this.isDefaultFeature(featureName);
            }
            // Decrypt the license data
            const license = this.decrypt(encryptedLicense);
            if (!license) {
                return this.isDefaultFeature(featureName);
            }
            // Parse the license data
            const licenseData = JSON.parse(license);
            // Verify the license hasn't been tampered with
            const computedHash = this.generateVerificationHash(licenseData);
            if (computedHash !== verificationHash) {
                // If verification fails, reset the license
                this.resetLicense(context);
                return this.isDefaultFeature(featureName);
            }
            // Check if the feature is in the features array
            if (licenseData.features && licenseData.features.includes(featureName)) {
                return true;
            }
            // If no features array or feature not found, check if it's a default feature
            return this.isDefaultFeature(featureName);
        }
        catch (error) {
            // If any error occurs, reset the license and return default
            this.resetLicense(context);
            return this.isDefaultFeature(featureName);
        }
    }
    /**
     * Check if a feature is available in the free tier
     * @param featureName The name of the feature to check
     * @returns Whether the feature is available in the free tier
     */
    static isDefaultFeature(featureName) {
        // List of features available in the free tier
        const freeFeatures = ['iphone', 'localhost'];
        return freeFeatures.includes(featureName);
    }
    /**
     * Set pro license status with encryption and verification
     * @param context The extension context
     * @param isPro Whether to set pro license status
     */
    static async setPro(context, isPro) {
        try {
            // Create license data with expiry date (for future use with real licensing)
            const licenseData = {
                isPro,
                activationDate: new Date().toISOString(),
                expiryDate: isPro ? this.getExpiryDate().toISOString() : null,
                licenseId: this.generateLicenseId(),
                licenseType: isPro ? 'pro' : 'free',
                features: isPro ?
                    ['iphone', 'android', 'ipad', 'custom', 'multiple'] :
                    ['iphone', 'localhost']
            };
            // Encrypt the license data
            const encryptedLicense = this.encrypt(JSON.stringify(licenseData));
            // Generate a verification hash
            const verificationHash = this.generateVerificationHash(licenseData);
            // Store both the encrypted license and verification hash
            await context.globalState.update(this.LICENSE_KEY, encryptedLicense);
            await context.globalState.update(this.LICENSE_VERIFICATION_KEY, verificationHash);
            // Update configuration with available devices
            await this.updateDeviceConfiguration(isPro);
        }
        catch (error) {
            console.error('Error setting pro license:', error);
            vscode.window.showErrorMessage('Failed to update license status. Please try again.');
        }
    }
    /**
     * Set pro license status with a verified license from the server
     * @param context The extension context
     * @param serverLicenseData The verified license data from the server
     */
    static async setProWithLicense(context, serverLicenseData, licenseKey) {
        try {
            console.log('Setting pro license with server data:', JSON.stringify(serverLicenseData, null, 2));
            // For maximum flexibility, we'll treat any 200 OK response as a successful license
            // This allows the extension to work with various server implementations
            const success = serverLicenseData.success !== false;
            // If the server explicitly says the license is invalid, respect that
            // Otherwise, assume it's valid if the request was successful
            const isValid = serverLicenseData.isValid !== false && success;
            // If the server doesn't specify if it's a pro license, assume it is
            // This is safer than blocking features the user might have paid for
            const isPro = serverLicenseData.isPro !== false;
            if (!success) {
                throw new Error(serverLicenseData.error || 'Invalid license data');
            }
            if (!isValid) {
                throw new Error(serverLicenseData.error || 'License is not valid');
            }
            // Create license data with server-provided information
            const licenseData = {
                isPro: isPro,
                activationDate: serverLicenseData.activatedAt || new Date().toISOString(),
                expiryDate: serverLicenseData.expiresAt,
                licenseId: this.generateLicenseId(),
                userEmail: serverLicenseData.user?.email || 'user@example.com',
                userName: serverLicenseData.user?.name || 'User',
                licenseKey: licenseKey,
                activationCount: serverLicenseData.activationCount || 1,
                maxActivations: serverLicenseData.maxActivations || 5,
                features: serverLicenseData.features ||
                    (isPro ?
                        ['iphone', 'android', 'ipad', 'custom', 'multiple'] :
                        ['iphone', 'localhost']),
                licenseType: serverLicenseData.licenseType || (isPro ? 'pro' : 'free'),
                lastValidation: new Date().toISOString()
            };
            console.log('Storing license data:', JSON.stringify(licenseData, null, 2));
            // Encrypt the license data
            const encryptedLicense = this.encrypt(JSON.stringify(licenseData));
            // Generate a verification hash
            const verificationHash = this.generateVerificationHash(licenseData);
            // Store both the encrypted license and verification hash
            await context.globalState.update(this.LICENSE_KEY, encryptedLicense);
            await context.globalState.update(this.LICENSE_VERIFICATION_KEY, verificationHash);
            await context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());
            // Update configuration with available devices
            await this.updateDeviceConfiguration(isPro);
        }
        catch (error) {
            console.error('Error setting pro license:', error);
            throw error;
        }
    }
    /**
     * Verify a license key with the license server
     * @param context The extension context
     * @param licenseKey The license key to verify
     * @returns The license data if valid
     */
    static async verifyLicense(context, licenseKey) {
        try {
            // Get or generate machine ID
            const machineId = await this.getMachineId(context);
            const requestData = {
                licenseKey,
                machineId,
                extensionVersion: this.EXTENSION_VERSION
            };
            console.log(`Verifying license with server: ${this.LICENSE_SERVER_URL}/licenses/verify`);
            console.log('Request data:', JSON.stringify(requestData, null, 2));
            const response = await fetch(`${this.LICENSE_SERVER_URL}/licenses/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            console.log(`Server response status: ${response.status}`);
            const rawData = await response.text();
            console.log('Server raw response:', rawData);
            let data;
            try {
                data = JSON.parse(rawData);
            }
            catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error(`Invalid JSON response from server: ${parseError} + ${response.status}`);
            }
            console.log('Parsed response data:', JSON.stringify(data, null, 2));
            // Normalize the response to match our expected format
            const normalizedResponse = {
                success: response.ok,
                isValid: response.ok && (data.isValid !== false),
                isPro: !!data.isPro,
                licenseType: data.licenseType || (data.isPro ? 'pro' : 'free'),
                features: data.features ||
                    (data.isPro ? ['iphone', 'android', 'ipad', 'custom', 'multiple'] : ['iphone', 'localhost']),
                user: data.user || { email: data.email || 'user@example.com', name: data.name || 'User' },
                expiresAt: data.expiresAt || null,
                activatedAt: data.activatedAt || new Date().toISOString(),
                activationCount: data.activationCount || 1,
                maxActivations: data.maxActivations || 5,
                activationsRemaining: data.activationsRemaining || 4,
                error: data.error || (response.ok ? undefined : 'License verification failed')
            };
            console.log('Normalized response:', JSON.stringify(normalizedResponse, null, 2));
            if (!response.ok) {
                throw new Error(normalizedResponse.error || 'License verification failed');
            }
            return normalizedResponse;
        }
        catch (error) {
            console.error('License verification error:', error);
            throw error;
        }
    }
    /**
     * Activate a license on this device
     * @param context The extension context
     * @param licenseKey The license key to activate
     * @returns The activation response
     */
    static async activateLicense(context, licenseKey) {
        try {
            // Get or generate machine ID
            const machineId = await this.getMachineId(context);
            const requestData = {
                licenseKey,
                machineId,
                extensionVersion: this.EXTENSION_VERSION
            };
            console.log(`Activating license using verify endpoint: ${this.LICENSE_SERVER_URL}/licenses/verify`);
            console.log('Activation request data:', JSON.stringify(requestData, null, 2));
            const response = await fetch(`${this.LICENSE_SERVER_URL}/licenses/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            console.log(`Verification response status: ${response.status}`);
            const rawData = await response.text();
            console.log('Verification raw response:', rawData);
            let data;
            try {
                data = JSON.parse(rawData);
            }
            catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error(`Invalid JSON response from server: ${rawData}`);
            }
            console.log('Parsed verification data:', JSON.stringify(data, null, 2));
            // Normalize the response to match our expected format
            const normalizedResponse = {
                success: response.ok,
                isValid: response.ok && (data.isValid !== false),
                isPro: !!data.isPro,
                licenseType: data.licenseType || (data.isPro ? 'pro' : 'free'),
                features: data.features ||
                    (data.isPro ? ['iphone', 'android', 'ipad', 'custom', 'multiple'] : ['iphone', 'localhost']),
                user: data.user || { email: data.email || 'user@example.com', name: data.name || 'User' },
                expiresAt: data.expiresAt || null,
                activatedAt: data.activatedAt || new Date().toISOString(),
                activationCount: data.activationCount || 1,
                maxActivations: data.maxActivations || 5,
                activationsRemaining: data.activationsRemaining || 4,
                error: data.error || (response.ok ? undefined : 'License verification failed')
            };
            console.log('Normalized verification response:', JSON.stringify(normalizedResponse, null, 2));
            if (!response.ok) {
                throw new Error(normalizedResponse.error || 'License verification failed');
            }
            // Store the activation data
            await this.setProWithLicense(context, normalizedResponse, licenseKey);
            return normalizedResponse;
        }
        catch (error) {
            console.error('License activation error:', error);
            throw error;
        }
    }
    /**
     * Validate a license with the server
     * @param context The extension context
     * @param licenseKey The license key to validate
     * @returns The validation response
     */
    static async validateLicense(context, licenseKey) {
        try {
            // Get or generate machine ID
            const machineId = await this.getMachineId(context);
            const requestData = {
                licenseKey,
                machineId,
                extensionVersion: this.EXTENSION_VERSION
            };
            console.log(`Validating license with server: ${this.LICENSE_SERVER_URL}/licenses/verify`);
            console.log('Validation request data:', JSON.stringify(requestData, null, 2));
            const response = await fetch(`${this.LICENSE_SERVER_URL}/licenses/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            console.log(`Validation response status: ${response.status}`);
            const rawData = await response.text();
            console.log('Validation raw response:', rawData);
            let data;
            try {
                data = JSON.parse(rawData);
            }
            catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error(`Invalid JSON response from server: ${rawData}`);
            }
            console.log('Parsed validation data:', JSON.stringify(data, null, 2));
            // Normalize the response to match our expected format
            const normalizedResponse = {
                success: response.ok,
                isValid: response.ok && (data.isValid !== false),
                isPro: !!data.isPro,
                licenseType: data.licenseType || (data.isPro ? 'pro' : 'free'),
                features: data.features ||
                    (data.isPro ? ['iphone', 'android', 'ipad', 'custom', 'multiple'] : ['iphone', 'localhost']),
                user: data.user || { email: data.email || 'user@example.com', name: data.name || 'User' },
                expiresAt: data.expiresAt || null,
                activatedAt: data.activatedAt || new Date().toISOString(),
                activationCount: data.activationCount || 1,
                maxActivations: data.maxActivations || 5,
                activationsRemaining: data.activationsRemaining || 4,
                error: data.error || (response.ok ? undefined : 'License validation failed')
            };
            console.log('Normalized validation response:', JSON.stringify(normalizedResponse, null, 2));
            if (!response.ok) {
                throw new Error(normalizedResponse.error || 'License validation failed');
            }
            // Update the last validation time
            await context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());
            // If the license is valid, update the stored license data
            if (normalizedResponse.isValid) {
                const licenseInfo = this.getLicenseInfo(context);
                if (licenseInfo && licenseInfo.licenseKey === licenseKey) {
                    licenseInfo.lastValidation = new Date().toISOString();
                    licenseInfo.features = normalizedResponse.features;
                    licenseInfo.licenseType = normalizedResponse.licenseType;
                    licenseInfo.expiryDate = normalizedResponse.expiresAt;
                    licenseInfo.activationCount = normalizedResponse.activationCount;
                    licenseInfo.maxActivations = normalizedResponse.maxActivations;
                    // Encrypt and store the updated license data
                    const encryptedLicense = this.encrypt(JSON.stringify(licenseInfo));
                    const verificationHash = this.generateVerificationHash(licenseInfo);
                    await context.globalState.update(this.LICENSE_KEY, encryptedLicense);
                    await context.globalState.update(this.LICENSE_VERIFICATION_KEY, verificationHash);
                }
            }
            return normalizedResponse;
        }
        catch (error) {
            console.error('License validation error:', error);
            throw error;
        }
    }
    /**
     * Validate the license in the background without showing UI
     * @param context The extension context
     * @param licenseKey The license key to validate
     */
    static async validateLicenseInBackground(context, licenseKey) {
        try {
            if (!licenseKey) {
                return;
            }
            const result = await this.validateLicense(context, licenseKey);
            if (!result.isValid) {
                // License is no longer valid, reset to free
                await this.resetLicense(context);
                // Show a notification to the user
                vscode.window.showWarningMessage('Your Mobile Preview Pro license is no longer valid. Please reactivate or purchase a new license.', 'Enter License Key', 'Purchase License').then(selection => {
                    if (selection === 'Enter License Key') {
                        vscode.commands.executeCommand('mobile-preview.enterLicense');
                    }
                    else if (selection === 'Purchase License') {
                        vscode.commands.executeCommand('mobile-preview.purchaseLicense');
                    }
                });
            }
        }
        catch (error) {
            // Silently fail in background validation
            console.error('Background license validation failed:', error);
        }
    }
    /**
     * Deactivate a license from this device
     * @param context The extension context
     * @param licenseKey The license key to deactivate
     * @returns Whether the deactivation was successful
     */
    static async deactivateLicense(context, licenseKey) {
        try {
            // Simply reset the license locally since we can't communicate with a deactivate endpoint
            await this.resetLicense(context);
            return true;
        }
        catch (error) {
            console.error('License deactivation error:', error);
            throw error;
        }
    }
    /**
     * Get or generate a unique machine ID
     * @param context The extension context
     * @returns A unique machine ID
     */
    static async getMachineId(context) {
        // Try to get existing machine ID
        let machineId = context.globalState.get(this.MACHINE_ID_KEY);
        if (!machineId) {
            // Generate a new machine ID based on hardware info
            const cpus = os.cpus();
            const networkInterfaces = os.networkInterfaces();
            const hostname = os.hostname();
            // Create a unique string from hardware info
            const hardwareString = JSON.stringify({
                cpuModel: cpus.length > 0 ? cpus[0].model : '',
                cpuCount: cpus.length,
                hostname,
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                mac: this.getPrimaryMacAddress(networkInterfaces)
            });
            // Hash the hardware string to create a machine ID
            machineId = crypto.createHash('sha256').update(hardwareString).digest('hex');
            // Store the machine ID
            await context.globalState.update(this.MACHINE_ID_KEY, machineId);
        }
        return machineId;
    }
    /**
     * Get the primary MAC address from network interfaces
     * @param networkInterfaces The network interfaces
     * @returns The primary MAC address or an empty string
     */
    static getPrimaryMacAddress(networkInterfaces) {
        // Try to find a non-internal interface with a MAC address
        for (const [, interfaces] of Object.entries(networkInterfaces)) {
            if (!interfaces)
                continue;
            for (const iface of interfaces) {
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    return iface.mac;
                }
            }
        }
        return '';
    }
    /**
     * Reset license if tampering is detected
     * @param context The extension context
     */
    static async resetLicense(context) {
        await context.globalState.update(this.LICENSE_KEY, undefined);
        await context.globalState.update(this.LICENSE_VERIFICATION_KEY, undefined);
        await context.globalState.update(this.LAST_VALIDATION_KEY, undefined);
        await this.updateDeviceConfiguration(false);
    }
    /**
     * Generate a unique license ID
     * @returns A unique license ID
     */
    static generateLicenseId() {
        return crypto.randomUUID();
    }
    /**
     * Get the expiry date for a license
     * @returns The expiry date
     */
    static getExpiryDate() {
        // For demo purposes, set expiry to 30 days from now
        // In a real implementation, this would come from the license server
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        return expiryDate;
    }
    /**
     * Encrypt text using AES-256-GCM
     * @param text The text to encrypt
     * @returns The encrypted text
     */
    static encrypt(text) {
        try {
            // Generate a random initialization vector
            const iv = crypto.randomBytes(16);
            // Create a key from the secret key
            const key = crypto.createHash('sha256').update(this.SECRET_KEY).digest();
            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            // Encrypt the text
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // Get the auth tag
            const authTag = cipher.getAuthTag();
            // Return the IV, encrypted text, and auth tag as a single string
            return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
        }
        catch (error) {
            console.error('Encryption error:', error);
            return '';
        }
    }
    /**
     * Decrypt text using AES-256-GCM
     * @param encryptedText The encrypted text
     * @returns The decrypted text
     */
    static decrypt(encryptedText) {
        try {
            // Split the encrypted text into IV, ciphertext, and auth tag
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted text format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const ciphertext = parts[1];
            const authTag = Buffer.from(parts[2], 'hex');
            // Create a key from the secret key
            const key = crypto.createHash('sha256').update(this.SECRET_KEY).digest();
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            // Decrypt the text
            let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            console.error('Decryption error:', error);
            return '';
        }
    }
    /**
     * Generate a verification hash for license data
     * @param licenseData The license data
     * @returns A verification hash
     */
    static generateVerificationHash(licenseData) {
        // Create a string representation of the license data
        const licenseString = JSON.stringify({
            isPro: licenseData.isPro,
            activationDate: licenseData.activationDate,
            expiryDate: licenseData.expiryDate,
            licenseId: licenseData.licenseId
        });
        // Hash the license string with the secret key
        return crypto.createHmac('sha256', this.SECRET_KEY).update(licenseString).digest('hex');
    }
    /**
     * Update device configuration based on license status
     * @param isPro Whether the user has a pro license
     */
    static async updateDeviceConfiguration(isPro) {
        try {
            const deviceNames = device_registry_1.DeviceRegistry.getDeviceNames(isPro);
            await vscode.workspace.getConfiguration('mobile-preview').update('deviceOptions', deviceNames, vscode.ConfigurationTarget.Global);
        }
        catch (error) {
            console.error('Error updating device configuration:', error);
        }
    }
    /**
     * Get license information
     * @param context The extension context
     * @returns The license information or null if no license
     */
    static getLicenseInfo(context) {
        try {
            const encryptedLicense = context.globalState.get(this.LICENSE_KEY);
            const verificationHash = context.globalState.get(this.LICENSE_VERIFICATION_KEY);
            if (!encryptedLicense || !verificationHash) {
                return null;
            }
            // Decrypt the license data
            const license = this.decrypt(encryptedLicense);
            if (!license) {
                return null;
            }
            // Parse the license data
            const licenseData = JSON.parse(license);
            // Verify the license hasn't been tampered with
            const computedHash = this.generateVerificationHash(licenseData);
            if (computedHash !== verificationHash) {
                return null;
            }
            return licenseData;
        }
        catch (error) {
            console.error('Error getting license info:', error);
            return null;
        }
    }
    /**
     * Check if the license server is available
     * @returns Whether the license server is available
     */
    static async checkLicenseServerStatus() {
        try {
            console.log(`Checking license server status: ${this.LICENSE_SERVER_URL}`);
            // Try the licenses/verify endpoint directly
            const response = await fetch(`${this.LICENSE_SERVER_URL}/licenses/verify`, {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log(`License server response status: ${response.status}`);
            // Any response means the server is up, even if it's an error
            return response.status < 500; // Consider any non-server error as "available"
        }
        catch (error) {
            console.error('License server status check failed:', error);
            return false;
        }
    }
    /**
     * Get the license server URL
     * @returns The license server URL
     */
    static getLicenseServerUrl() {
        return this.LICENSE_SERVER_URL;
    }
}
exports.LicenseManager = LicenseManager;
// Use multiple keys to make it harder to tamper with
LicenseManager.LICENSE_KEY = 'mobile-preview.license';
LicenseManager.LICENSE_VERIFICATION_KEY = 'mobile-preview.verification';
LicenseManager.MACHINE_ID_KEY = 'mobile-preview.machineId';
LicenseManager.LAST_VALIDATION_KEY = 'mobile-preview.lastValidation';
LicenseManager.SECRET_KEY = 'mobilePreviewSecretKey2024'; // This would ideally be stored more securely
LicenseManager.LICENSE_SERVER_URL = 'https://extensions.lilianbischung.fr/api'; // Using localhost for testing
LicenseManager.EXTENSION_VERSION = '1.2.0'; // Should match package.json
LicenseManager.OFFLINE_GRACE_PERIOD_DAYS = 14; // Days allowed offline before requiring validation
LicenseManager.LICENSE_PURCHASE_URL = process.env.LOCAL_LICENSE_SERVER_URL ? process.env.LOCAL_LICENSE_SERVER_URL + "/pricing?source=vscode" : 'https://extensions.lilianbischung.fr/pricing?source=vscode'; // URL for purchasing licenses
//# sourceMappingURL=license-manager.js.map