"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptive_service_1 = require("./src/placement/adaptive.service");
async function main() {
    try {
        const result = await (0, adaptive_service_1.startPlacementTest)({
            accountId: 1,
            skillsToTest: ['vocabulary', 'reading', 'listening', 'writing', 'speaking']
        });
        console.log('SUCCESS:', result);
    }
    catch (err) {
        console.error('ERROR:', err);
    }
}
main();
//# sourceMappingURL=test-start.js.map