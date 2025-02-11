require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;
assert.callback("Create and load DSU test", (callback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keyssi = openDSU.loadApi("keyssi");
            const seedSSI = keyssi.createTemplateSeedSSI("default", undefined, undefined, "v0");

            resolver.createDSU(seedSSI, async (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                await rawDossier.safeBeginBatchAsync();
                rawDossier.writeFile("/a.txt", "some data", async (err) => {
                    if (err) {
                        throw err;
                    }

                    await rawDossier.commitBatchAsync();
                    rawDossier.getKeySSIAsString("sread", (err, sreadSSI) => {
                        if (err) {
                            throw err;
                        }

                        resolver.loadDSU(sreadSSI, (err, loadedDSU) => {
                            if (err) {
                                throw err;
                            }


                            loadedDSU.getKeySSIAsString("sread", (err, cloneKeySSI) => {
                                if (err) {
                                    throw err;
                                }

                                assert.true(sreadSSI === cloneKeySSI);
                                callback();
                            });
                        });

                    });
                });
            });
        });
    });
}, 15000);
