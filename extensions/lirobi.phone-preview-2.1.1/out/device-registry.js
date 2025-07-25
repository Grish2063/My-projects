"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceRegistry = void 0;
/**
 * Device registry to store all available devices
 */
class DeviceRegistry {
    /**
     * Get all devices based on license status
     * @param isPro Whether the user has a pro license
     * @returns Array of available devices
     */
    static getDevices(isPro) {
        // Always return all devices, regardless of license status
        // The UI will handle showing the Pro popup when needed
        return this.devices;
    }
    /**
     * Get devices by type and license status
     * @param type The device type to filter by
     * @param isPro Whether the user has a pro license
     * @returns Array of available devices of the specified type
     */
    static getDevicesByType(type, isPro) {
        const devices = this.getDevices(isPro);
        return devices.filter(device => device.type === type);
    }
    /**
     * Get devices by manufacturer and license status
     * @param manufacturer The manufacturer to filter by
     * @param isPro Whether the user has a pro license
     * @returns Array of available devices from the specified manufacturer
     */
    static getDevicesByManufacturer(manufacturer, isPro) {
        const devices = this.getDevices(isPro);
        return devices.filter(device => device.manufacturer === manufacturer);
    }
    /**
     * Get a specific device by name
     * @param name The name of the device to retrieve
     * @returns The requested device or the default device if not found
     */
    static getDevice(name) {
        const device = this.devices.find(d => d.name === name);
        if (!device) {
            // Return default device if not found
            return this.devices[0];
        }
        return device;
    }
    /**
     * Get device names for configuration
     * @param isPro Whether the user has a pro license
     * @returns Array of device names
     */
    static getDeviceNames(isPro) {
        if (isPro) {
            // Pro users see all devices without suffix
            return this.devices.map(device => device.name);
        }
        else {
            // Free users see all devices, but pro ones have a suffix
            return this.devices.map(device => {
                if (device.category === "free") {
                    return device.name;
                }
                else {
                    return `${device.name} (Pro)`;
                }
            });
        }
    }
}
exports.DeviceRegistry = DeviceRegistry;
DeviceRegistry.devices = [
    // Free devices (limited to 3 iPhone devices)
    {
        name: "iPhone 13 Pro",
        width: 390,
        height: 844,
        cameraType: "notch",
        category: "free",
        manufacturer: "Apple",
        type: "phone"
    },
    {
        name: "iPhone 15",
        width: 393,
        height: 852,
        cameraType: "island",
        category: "free",
        manufacturer: "Apple",
        type: "phone"
    },
    {
        name: "iPhone 15 Pro Max",
        width: 430,
        height: 932,
        cameraType: "island",
        category: "free",
        manufacturer: "Apple",
        type: "phone"
    },
    // Pro devices - iPhones
    {
        name: "iPhone 12 Mini",
        width: 360,
        height: 780,
        cameraType: "notch",
        category: "pro",
        manufacturer: "Apple",
        type: "phone"
    },
    {
        name: "iPhone 14 Pro",
        width: 393,
        height: 852,
        cameraType: "island",
        category: "pro",
        manufacturer: "Apple",
        type: "phone"
    },
    {
        name: "iPhone 11",
        width: 414,
        height: 896,
        cameraType: "notch",
        category: "pro",
        manufacturer: "Apple",
        type: "phone"
    },
    // Pro devices - iPads
    {
        name: "iPad Pro 11",
        width: 834,
        height: 1194,
        cameraType: "none",
        category: "pro",
        manufacturer: "Apple",
        type: "tablet"
    },
    {
        name: "iPad Air",
        width: 820,
        height: 1180,
        cameraType: "none",
        category: "pro",
        manufacturer: "Apple",
        type: "tablet"
    },
    {
        name: "iPad Mini",
        width: 768,
        height: 1024,
        cameraType: "none",
        category: "pro",
        manufacturer: "Apple",
        type: "tablet"
    },
    // Pro devices - Android phones
    {
        name: "Samsung Galaxy S23",
        width: 360,
        height: 800,
        cameraType: "hole",
        category: "pro",
        manufacturer: "Samsung",
        type: "phone"
    },
    {
        name: "Google Pixel 7",
        width: 412,
        height: 915,
        cameraType: "hole",
        category: "pro",
        manufacturer: "Google",
        type: "phone"
    },
    {
        name: "OnePlus 10 Pro",
        width: 412,
        height: 919,
        cameraType: "hole",
        category: "pro",
        manufacturer: "OnePlus",
        type: "phone"
    },
    {
        name: "Xiaomi 13",
        width: 393,
        height: 851,
        cameraType: "hole",
        category: "pro",
        manufacturer: "Xiaomi",
        type: "phone"
    },
    // Pro devices - Android tablets
    {
        name: "Samsung Galaxy Tab S8",
        width: 800,
        height: 1280,
        cameraType: "hole",
        category: "pro",
        manufacturer: "Samsung",
        type: "tablet"
    },
    {
        name: "Google Pixel Tablet",
        width: 834,
        height: 1112,
        cameraType: "hole",
        category: "pro",
        manufacturer: "Google",
        type: "tablet"
    }
];
//# sourceMappingURL=device-registry.js.map