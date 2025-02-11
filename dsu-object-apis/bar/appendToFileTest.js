require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskWebServer");

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../psknode/tests/util/tir.js");

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";
    const dataToAppend = 'Some more text';
    const expectedFileData = `${fileData}${dataToAppend}`;

    assert.callback("AppendToFileTest", (callback) => {
        tir.launchVirtualMQNode(10, testFolder, (err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, bar) => {
                if (err) {
                    throw err;
                }

                bar.safeBeginBatch(err => {
                    if (err) {
                        throw err;
                    }

                    bar.writeFile("a.txt", fileData, (err, brickMapDigest) => {
                        if (err) {
                            throw err;
                        }
                        assert.true(err === null || typeof err === "undefined", "Failed to write file in BAR");

                        bar.appendToFile('a.txt', dataToAppend, async (err) => {
                            if (err) {
                                throw err;
                            }
                            await bar.commitBatchAsync();
                            bar.getKeySSIAsString((err, keySSI) => {
                                if (err) {
                                    throw err;
                                }

                                resolver.loadDSU(keySSI, (err, newBar) => {
                                    if (err) {
                                        throw err;
                                    }
                                    newBar.readFile("a.txt", (err, data) => {
                                        assert.true(err === null || typeof err === "undefined", "Failed read file from BAR.");
                                        assert.true(expectedFileData === data.toString(), "Invalid read data");

                                        callback();
                                    });
                                });
                            });
                        });
                    });
                })
            })
        });
    }, 2000);
});


