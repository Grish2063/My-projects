"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = void 0;
const vscode = require("vscode");
/**
 * Generates the HTML for the phone preview webview
 */
function getWebviewContent(webview, extensionUri, device, currentFile, availableDevices, isPro, licenseInfo) {
    // Calculate camera dimensions
    const islandWidth = device.width / 2.5;
    // Get background image
    const backgroundImageUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'assets', 'iphone-default-background.png'));
    // Format expiry date if available
    const expiryDate = licenseInfo?.expiryDate
        ? new Date(licenseInfo.expiryDate).toLocaleDateString()
        : null;
    // Compute pixel offset for cutout (height of cutout region)
    const cutoutOffset = device.cameraType === 'notch' ? 43 : device.cameraType === 'island' ? 46 : device.cameraType === 'hole' ? 24 : 0;
    const statusBarHeight = device.cameraType === 'notch' ? 42 + 4 : device.cameraType === 'island' ? 54 + 4 : device.cameraType === 'hole' ? 42 + 4 : 0;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: transparent;
                    font-family: system-ui, -apple-system, sans-serif;
                    position: relative;
                }
                
                /* Hide scrollbars but allow scrolling */
                html::-webkit-scrollbar,
                body::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                }
                html,
                body {
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE 10+ */
                }
                /* Hide scrollbars inside the iframe */
                .phone-content {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .phone-content::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                }

                /* Simple iOS-style status bar */
                .status-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: ${statusBarHeight}px;
                    display: flex;
                    justify-content: space-between;
                    background:rgb(62, 62, 62);
                    align-items: center;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    pointer-events: none;
                    z-index: 0;
                }
                
                /* Status bar content */
                .status-left, .status-center, .status-right {
                    padding: 0 10px;
                }
                
                .status-left {
                    width: 30%;
                    margin-left: 8%;
                    text-align: left;
                }
                
                .status-center {
                    width: 40%;
                    text-align: center;
                }
                
                .status-right {
                    width: 30%;
                    margin-right: 2%;
                    text-align: right;
                }
                
                .wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 10px;
                }
                .controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 90%;
                    max-width: 800px;
                    margin: 0 auto 10px;
                    padding: 8px;
                    background: rgba(45, 45, 45, 0.95);
                    border-radius: 6px;
                    position: sticky;
                    top: 10px;
                    z-index: 1000;
                }
                .controls-left {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    align-items: center;
                    gap: 10px;
                }
                .pro-button {
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    background: ${isPro ? '#10B981' : '#3B82F6'};
                    color: white;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pro-button:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
                .pro-button .icon {
                    font-size: 14px;
                }
                .device-selector {
                    padding: 6px 10px;
                    border-radius: 4px;
                    border: 1px solid #444;
                    background: #2d2d2d;
                    color: white;
                    font-size: 13px;
                }
                .phone-container-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    min-height: 400px;
                    margin: 10px 0;
                }
                .phone-container {
                    position: relative;
                    background: black;
                    border: 4px solid black;
                    border-radius: 45px;
                    padding: 6px;
                    height: fit-content;
                    width: fit-content;
                    transform-origin: center;
                    transform: scale(var(--scale-factor, 1));
                }
                .phone-screen {
                    position: relative;
                    width: ${device.width}px;
                    height: ${device.height}px;
                    border-radius: 35px;
                    background: black;
                    overflow: hidden;
                }
                
                /* Position iframe under cutout, allow scrolling */
                .phone-content {
                    position: absolute;
                    top: ${statusBarHeight}px;
                    left: 0;
                    width: 100%;
                    height: calc(100% - ${statusBarHeight}px);
                    border: none;
                    z-index: 1;
                }
                
                /* Phone buttons styling */
                .power-button {
                    position: absolute;
                    width: 4px;
                    height: 40px;
                    background-color: black;
                    right: -2px;
                    top: 120px;
                    border-radius: 2px;
                    z-index: 10;
                }
                
                .volume-up-button {
                    position: absolute;
                    width: 4px;
                    height: 40px;
                    background-color: black;
                    left: -2px;
                    top: 100px;
                    border-radius: 2px;
                    z-index: 10;
                }
                
                .volume-down-button {
                    position: absolute;
                    width: 4px;
                    height: 40px;
                    background-color: black;
                    left: -2px;
                    top: 150px;
                    border-radius: 2px;
                    z-index: 10;
                }
                
                .url-input-container {
                    display: flex;
                    align-items: center;
                    width: 90%;
                    max-width: 800px;
                    margin: 0 auto 10px;
                    position: sticky;
                    top: 60px;
                    z-index: 999;
                }
                .url-input {
                    flex: 1;
                    padding: 6px 10px;
                    border-radius: 4px;
                    border: 1px solid #444;
                    background: #2d2d2d;
                    color: white;
                    font-size: 13px;
                    margin-right: 6px;
                }
                .reload-button {
                    padding: 6px 10px;
                    border-radius: 4px;
                    border: 1px solid #444;
                    background: #2d2d2d;
                    color: white;
                    cursor: pointer;
                }
                ${device.cameraType !== 'none' ? `
                .${device.cameraType} {
                    position: absolute;
                    ${device.cameraType === 'island' ? `
                    /* island cutout shape */
                    width: 1px;
                    padding-left: calc(${islandWidth}px / 2.5);
                    padding-right: calc(${islandWidth}px / 2.5);
                    height: 38px;
                    background: black;
                    left: 50%;
                    top: 8px;
                    transform: translate(-50%, 0%);
                    border-radius: 40px;
                    ` : `
                    /* notch cutout shape */
                    width: 160px;
                    height: 35px;
                    background: black;
                    left: 50%;
                    top: -1px;
                    transform: translateX(-50%);
                    border-bottom-left-radius: 24px;
                    border-bottom-right-radius: 24px;
                    `}
                    z-index: 3; /* overlay above masks */
                }
                
                ${device.cameraType === 'hole' ? `
                .hole {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: black;
                    border-radius: 50%;
                    left: 50%;
                    top: 12px;
                    transform: translateX(-50%);
                    z-index: 2; /* above iframe */
                }
                ` : ''}
                ` : ''}
                .popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: rgba(0, 0, 0, 0.75);
                    visibility: hidden;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .popup-content {
                    background-color: #1E1E1E;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    padding: 24px;
                    position: relative;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                    color: white;
                }
                .popup-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .popup-title {
                    color: white;
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                }
                .popup-subtitle {
                    color: #94A3B8;
                    font-size: 14px;
                    margin: 0;
                }
                .feature-list {
                    display: grid;
                    gap: 12px;
                    margin: 24px 0;
                }
                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                    font-size: 14px;
                }
                .feature-icon {
                    min-width: 20px;
                    height: 20px;
                    background: #3B82F6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }
                .popup-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 24px;
                }
                .popup-secondary-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: space-between;
                }
                .popup-button {
                    padding: 12px;
                    border-radius: 6px;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                    text-decoration: none;
                }
                .popup-button.primary {
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    color: white;
                }
                .popup-button.secondary {
                    background: transparent;
                    border: 1px solid #4B5563;
                    color: #E5E7EB;
                    flex: 1;
                    padding: 8px;
                    font-size: 13px;
                }
                .popup-button.primary:hover {
                    filter: brightness(1.1);
                }
                .popup-button.secondary:hover {
                    background: rgba(75, 85, 99, 0.1);
                }
                .popup-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: none;
                    background: #374151;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
            <script>
                const vscode = acquireVsCodeApi();
                
                function calculateScale() {
                    const phone = document.querySelector('.phone-container');
                    const wrapper = document.querySelector('.wrapper');
                    const phoneWrapper = document.querySelector('.phone-container-wrapper');
                    if (!phone || !wrapper || !phoneWrapper) return;
                    
                    const deviceWidth = ${device.width} + 24;
                    const deviceHeight = ${device.height} + 24;
                    const wrapperRect = wrapper.getBoundingClientRect();
                    const availableWidth = wrapperRect.width * 0.9;
                    const availableHeight = phoneWrapper.clientHeight;
                    
                    const scaleFactor = Math.min(availableWidth / deviceWidth, availableHeight / deviceHeight, 1);
                    phone.style.setProperty('--scale-factor', scaleFactor.toString());
                    phone.style.transform = 'scale(' + scaleFactor + ')';
                }

                function navigateToUrl(event) {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const url = event.target.value;
                        const iframe = document.querySelector('.phone-content');
                        const finalUrl = url.startsWith('http') ? url : 'http://' + url;
                        iframe.src = finalUrl;
                        event.target.value = finalUrl;
                        vscode.postMessage({ command: 'updateUrl', url: finalUrl });
                    }
                }

                function reloadPage() {
                    const iframe = document.querySelector('.phone-content');
                    iframe.src = iframe.src;
                }
                
                function showProPopup() {
                    console.log("Showing popup");
                    const popup = document.getElementById('proPopup');
                    if (popup) {
                        popup.style.display = 'flex';
                        popup.style.visibility = 'visible';
                        document.body.style.overflow = 'hidden'; // Prevent scrolling
                    } else {
                        console.error("Popup element not found");
                        // Create popup dynamically if not found
                        createProPopup();
                    }
                }

                function hideProPopup() {
                    console.log("Hiding popup");
                    const popup = document.getElementById('proPopup');
                    if (popup) {
                        popup.style.visibility = 'hidden';
                        document.body.style.overflow = ''; // Restore scrolling
                    }
                }
                
                function createProPopup() {
                    console.log("Creating popup dynamically");
                    const popupHtml = \`
                        <div id="proPopup" class="popup-overlay">
                            <div class="popup-content">
                                <button class="popup-close" onclick="hideProPopup()">×</button>
                                <div class="popup-header">
                                    <h2 class="popup-title">Unlock Pro Features</h2>
                                    <p class="popup-subtitle">Take your mobile development to the next level</p>
                                </div>
                                <div class="feature-list">
                                    <div class="feature-item">
                                        <span class="feature-icon">✓</span>
                                        <span>Access to all iPhone devices</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-icon">✓</span>
                                        <span>All Android devices</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-icon">✓</span>
                                        <span>Tablet devices (iPad)</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-icon">✓</span>
                                        <span>Custom device configurations</span>
                                    </div>
                                </div>
                                <div class="popup-actions">
                                    <a href="#" class="popup-button primary" onclick="purchaseLicense()">
                                        Upgrade to Pro - $5 Lifetime
                                    </a>
                                    <div class="popup-secondary-actions">
                                        <button class="popup-button secondary" onclick="enterLicense()">
                                            Enter License Key
                                        </button>
                                        <button class="popup-button secondary" onclick="hideProPopup()">
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    document.body.insertAdjacentHTML('beforeend', popupHtml);
                    
                    const popup = document.getElementById('proPopup');
                    if (popup) {
                        popup.addEventListener('click', function(e) {
                            if (e.target === popup) {
                                hideProPopup();
                            }
                        });
                    }
                }

                function enterLicense() {
                    vscode.postMessage({
                        command: 'enterLicense'
                    });
                    hideProPopup();
                }

                function switchToPro() {
                    vscode.postMessage({
                        command: 'switchToPro'
                    });
                }

                function purchaseLicense() {
                    vscode.postMessage({
                        command: 'purchaseLicense'
                    });
                    hideProPopup();
                }

                function changeDevice(event) {
                    const device = event.target.value;
                    const option = event.target.options[event.target.selectedIndex];
                    const isPro = option.dataset.isPro === 'true';
                    
                    if (isPro && !${isPro}) {
                        showProPopup();
                        // Reset selection to previous device
                        setTimeout(() => {
                            event.target.value = event.target.dataset.lastValue || '${device.name}';
                        }, 0);
                        return;
                    }
                    
                    event.target.dataset.lastValue = device;
                    vscode.postMessage({
                        command: 'changeDevice',
                        device: device
                    });
                }

                // Initialize everything when DOM is fully loaded
                document.addEventListener('DOMContentLoaded', function() {
                    console.log("DOM fully loaded");
                    const iframe = document.querySelector('.phone-content');
                    const urlInput = document.querySelector('.url-input');
                    const deviceSelector = document.querySelector('.device-selector');
                    
                    // Initialize the last selected device
                    if (deviceSelector) {
                        deviceSelector.dataset.lastValue = deviceSelector.value;
                    }
                    
                    urlInput.value = '${currentFile}';
                    calculateScale();
                    
                    // Create popup if it doesn't exist
                    if (!document.getElementById('proPopup')) {
                        createProPopup();
                        hideProPopup();
                    }
                    
                    console.log("Camera type: ${device.cameraType}");
                });

                window.addEventListener('resize', () => {
                    requestAnimationFrame(calculateScale);
                });
            </script>
        </head>
        <body>
            <div class="wrapper">
                <div class="controls">
                    <div class="controls-left">
                        <select class="device-selector" onchange="changeDevice(event)">
                            ${availableDevices.map(d => `
                                <option value="${d.name}" ${d.name === device.name ? 'selected' : ''} data-is-pro="${d.category === 'pro'}">
                                    ${d.name}
                                </option>
                            `).join('')}
                        </select>
                        <button class="pro-button" onclick="${isPro ? 'switchToPro' : 'showProPopup'}()">
                            <span class="icon">${isPro ? '✓' : '⭐'}</span>
                            ${isPro ? 'Pro' : 'Buy Pro'}
                        </button>
                    </div>
                </div>
                
                <div class="url-input-container">
                    <input type="text" class="url-input" 
                        placeholder="Enter URL and press Enter"
                        onkeypress="navigateToUrl(event)"
                    />
                    <button class="reload-button" onclick="reloadPage()">⟳</button>
                </div>
                
                <div class="phone-container-wrapper">
                    <div class="phone-container">
                        <div class="power-button"></div>
                        <div class="volume-up-button"></div>
                        <div class="volume-down-button"></div>
                        <div class="phone-screen">
                            <iframe class="phone-content" src="${currentFile}"></iframe>
                            ${device.cameraType === 'notch' ? `<div class="notch" style="z-index:3"></div>` :
        device.cameraType === 'island' ? `<div class="island" style="z-index:3"></div>` :
            device.cameraType === 'hole' ? `<div class="hole" style="z-index:3"></div>` : ''}
                            <div class="status-bar">
                                <div class="status-left">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div class="status-center"></div>
                                <div class="status-right">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi-icon lucide-wifi"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-battery-charging-icon lucide-battery-charging"><path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><path d="m11 7-3 5h4l-3 5"/><line x1="22" x2="22" y1="11" y2="13"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Popup will be created dynamically -->
        </body>
        </html>
    `;
}
exports.getWebviewContent = getWebviewContent;
//# sourceMappingURL=webview-template.js.map