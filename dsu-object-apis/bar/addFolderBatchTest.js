require('../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../psknode/tests/util/tir.js");
const text = ["first", "second", "third"];

require("callflow").initialise();
$$.LEGACY_BEHAVIOUR_ENABLED = true;
$$.flows.describe("AddFolderBatch", {
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


                this.addFolder(folderPath, "fld1", async (err, initialHash) => {
                    if (err) {
                        throw err;
                    }

                    await bar.commitBatchAsync();
                    this.bar.getKeySSIAsString((err, seedSSI) => {
                        resolver.loadDSU(seedSSI, (err, dsu) => {
                            dsu.listFiles('/', (err, files) => {
                                assert.true(files.length === 4);

                                dsu.readFile('/fld1/a.txt', (err, data) => {
                                    assert.true(err === null || typeof err === "undefined", "Failed to read file");
                                    assert.true(text[0] === data.toString(), "Invalid read first file");

                                    dsu.readFile('/fld1/b.txt', (err, data) => {
                                        assert.true(err === null || typeof err === "undefined", "Failed to read file");
                                        assert.true(text[1] === data.toString(), "Invalid read second file");

                                        dsu.readFile('/fld1/c.txt', (err, data) => {
                                            assert.true(err === null || typeof err === "undefined", "Failed to read file");
                                            assert.true(text[2] === data.toString(), "Invalid read third file");

                                            this.callback();
                                        });
                                    });
                                });
                            })
                        })
                    })
                });
            });
        })
    },

    addFolder: function (fsFolderPath, barPath, callback) {
        this.bar.addFolder(fsFolderPath, barPath, {embedded: true}, callback);
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add folder (embedded: true) to bar test", (callback) => {
        $$.flows.start("AddFolderBatch", "start", callback);
    }, 3000);
});
