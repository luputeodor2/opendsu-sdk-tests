require('../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;
let extractionPath;

let files;

const tir = require("../../../psknode/tests/util/tir.js");

const text = ["first", "second", "third"];

require("callflow").initialise();
$$.LEGACY_BEHAVIOUR_ENABLED = true;
$$.flows.describe("AddRawFile", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
                tir.launchApiHubTestNode(100, folder, async err => {
                    assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                    this.createBAR();
                });
            });
        });

    },

    createBAR: function () {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, bar) => {
            if (err) {
                throw err;
            }

            this.bar = bar;
            this.bar.safeBeginBatch(err => {
                if (err) {
                    throw err;
                }

                this.addFile(filePath, "fld/a.txt", (err, initialHash) => {
                    if (err) {
                        throw err;
                    }

                    this.addFile(filePath, "fld/b.txt", (err, controlHash) => {
                        if (err) {
                            throw err;
                        }

                        this.bar.commitBatch(err => {
                            if (err) {
                                throw err;
                            }
                            this.callback();
                        })
                    })
                })
            });
        })
    },

    addFile: function (fsFilePath, barPath, callback) {
        this.bar.addFile(fsFilePath, barPath, {encrypt: false}, callback);
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "fld/a.txt");
    extractionPath = path.join(testFolder, "test.txt");
    assert.callback("Add raw file to bar test", (callback) => {
        $$.flows.start("AddRawFile", "start", callback);
    }, 3000);
});
