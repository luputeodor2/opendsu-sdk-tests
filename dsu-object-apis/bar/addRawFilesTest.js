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
$$.flows.describe("AddRawFiles", {
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
                this.bar.addFiles(files, 'filesFolder', (err, result) => {
                    if (err) {
                        throw err;
                    }
                    this.bar.commitBatch(err => {
                        if (err) {
                            throw err;
                        }
                        this.runAssertions();
                    })
                })
            })
        })
    },
    runAssertions: function () {
        this.bar.listFiles('filesFolder', (err, files) => {
            if (err) {
                throw err;
            }

            assert.true(files.length === 3);
            assert.true(files.indexOf('a.txt') !== -1);
            assert.true(files.indexOf('b.txt') !== -1);
            assert.true(files.indexOf('c.txt') !== -1);
            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add raw files to bar test", (callback) => {
        $$.flows.start("AddRawFiles", "start", callback);
    }, 3000);
});
