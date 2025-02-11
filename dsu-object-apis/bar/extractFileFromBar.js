require('../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;
const path = require("path");

const tir = require("../../../psknode/tests/util/tir.js");

let folderPath;
let filePath;
let barPath;

let folders;

let tempFolder;

const text = ["first text", "second fragment", "third"];

require("callflow").initialise();
$$.LEGACY_BEHAVIOUR_ENABLED = true;

$$.flows.describe("AddFile", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist(folders, filePath, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.computeFileHash(filePath, (err, initialHash) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");

                this.initialHash = initialHash;
                double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
                    tir.launchApiHubTestNode(100, folder, async err => {
                        assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                        this.createArchive();
                    });
                });
            });
        });

    },

    createArchive: function () {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, bar) => {
            if (err) {
                throw err;
            }

            this.archive = bar;
            this.addFile();
        })
    },

    addFile: function () {
        this.archive.safeBeginBatch(err => {
            if (err) {
                throw err;
            }
            this.archive.addFile(filePath, barPath, async (err, mapDigest) => {
                if (err) {
                    throw err;
                }

                await this.archive.commitBatchAsync();
                let fs = require("fs");
                //double_check.deleteFoldersSync(folderPath);
                fs.rmdirSync(folderPath, {recursive: true, maxRetries: 10});
                this.archive.getKeySSIAsString((err, keySSI) => {
                    if (err) {
                        throw err;
                    }

                    this.extractFile(keySSI);
                });
            });
        });
    },

    extractFile: function (keySSI) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");

        resolver.loadDSU(keySSI, (err, archive) => {
            if (err) {
                throw err;
            }

            archive.extractFile(filePath, barPath, (err) => {
                if (err) {
                    throw err;
                }

                double_check.computeFileHash(filePath, (err, newHash) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                    assert.true(this.initialHash === newHash, "The extracted file is not te same as the initial one");

                    double_check.deleteFoldersSync([folderPath]);

                    this.callback();
                });
            });
        })
    }
});

double_check.createTestFolder("Extract file from bar", (err, testFolder) => {
    tempFolder = path.join(testFolder, "tmp");
    folderPath = path.join(testFolder, "fld");
    barPath = "myFile";
    folders = [folderPath];
    filePath = path.join(testFolder, "fld", "a.txt");
    assert.callback("AddFileEDFSTest", (callback) => {
        $$.flows.start("AddFile", "start", callback);
    }, 10000);
});
