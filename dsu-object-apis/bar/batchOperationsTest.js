require('../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../psknode/tests/util/tir.js");
const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("BatchOperationsTest", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
                tir.launchApiHubTestNode(100, folder, async err => {
                    assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                    this.createDSU((dsu) => {
                        this.testBatchIsCommited(dsu);
                    });
                });
            });
        });

    },

    createDSU: function (callback) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            callback(dsu);
        });
    },

    testBatchIsCommited: function (dsu) {
        this.testDSU = dsu;
        this.testDSU.safeBeginBatch((err) => {
            if(err){
                throw err;
            }

        this.testDSU.writeFile('f1.txt', text[0], (err) => {
            if (err) {
                throw err;
            }

            this.testDSU.hasUnanchoredChanges((err, status) => {
                assert.true(status);
                this.testDSU.writeFile('f2.txt', text[1], (err) => {
                    if (err) {
                        throw err;
                    }
                    this.testDSU.hasUnanchoredChanges((err, status) => {
                        assert.true(status);
                        this.testDSU.addFolder(folderPath, 'fld', (err) => {
                            if (err) {
                                throw err;
                            }
                            this.testDSU.hasUnanchoredChanges((err, status) => {
                                assert.true(status);

                                this.testDSU.commitBatch((err, result) => {
                                    if (err) {
                                        throw err;
                                    }
                                    this.testDSU.hasUnanchoredChanges((err, status) => {
                                        assert.false(status);

                                        this.testBatchWithMountedDSUs();
                                    });
                                })
                            });
                        })
                    })
                });
            })
            })
        });
    },

    testBatchWithMountedDSUs: function () {
        this.createDSU((dsu) => {
            dsu.getKeySSIAsString(async (err, keySSI) => {
                if (err) {
                    throw err;
                }

                await dsu.safeBeginBatchAsync();
                dsu.writeFile('/some/path.txt', 'text', async (err) => {
                    if (err) {
                        throw err;
                    }
                    await dsu.commitBatchAsync();
                    this.level1MountedDSU = dsu;
                    await this.testDSU.safeBeginBatchAsync();
                    this.testDSU.mount('/level1', keySSI, (err) => {
                        if (err) {
                            throw err;
                        }

                        this.testDSU.writeFile('/level1/file1.txt', text[0], (err) => {
                            if (err) {
                                throw err;
                            }

                            this.testDSU.hasUnanchoredChanges((err, status) => {
                                assert.true(status);
                                this.testDSU.writeFile('/level1/file2.txt', text[1], (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    this.testDSU.hasUnanchoredChanges((err, status) => {
                                        assert.true(status);

                                        this.testDSU.writeFile('/root-file.txt', text[0], (err) => {
                                            if (err) {
                                                throw err;
                                            }
                                            this.testDSU.hasUnanchoredChanges((err, status) => {
                                                assert.true(status);

                                                this.testDSU.commitBatch((err, result) => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                    this.testDSU.hasUnanchoredChanges((err, status) => {
                                                        assert.false(status);

                                                        this.testDSU.getKeySSIAsString((err, keySSI) => {
                                                            if (err) {
                                                                throw err;
                                                            }
                                                            this.testCommitedBatch(keySSI);
                                                        })
                                                    });
                                                })
                                            });
                                        })
                                    });
                                })
                            });
                        })
                    })
                })
            })
        })
    },

    testCommitedBatch: function (keySSI) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        resolver.loadDSU(keySSI, (err, dsu) => {
            if (err) {
                throw err;
            }

            dsu.readFile('/f1.txt', (err, data) => {
                if (err) {
                    throw err;
                }

                assert.true(text[0] === data.toString());

                dsu.readFile('/f2.txt', (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(text[1] === data.toString());

                    dsu.readFile('/fld/a.txt', (err, data) => {
                        if (err) {
                            throw err;
                        }

                        assert.true(text[0] === data.toString());

                        dsu.readFile('/fld/b.txt', (err, data) => {
                            if (err) {
                                throw err;
                            }

                            assert.true(text[1] === data.toString());

                            dsu.readFile('/fld/c.txt', (err, data) => {
                                if (err) {
                                    throw err;
                                }

                                assert.true(text[2] === data.toString());

                                dsu.readFile('/level1/file1.txt', (err, data) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(text[0] === data.toString());

                                    dsu.readFile('/level1/file2.txt', (err, data) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(text[1] === data.toString());

                                        dsu.readFile('/root-file.txt', (err, data) => {
                                            if (err) {
                                                throw err;
                                            }

                                            assert.true(text[0] === data.toString());

                                            this.testBatchInMountSecondLevel(dsu);
                                        })
                                    })
                                })
                            });
                        });
                    });
                });
            })
        })
    },

    testBatchInMountSecondLevel: function (testDSU) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        this.createDSU((dsu) => {
            dsu.getKeySSIAsString((err, keySSI) => {
                if (err) {
                    throw err;
                }

                this.level1MountedDSU.load(async (err) => {
                    if (err) {
                        throw err;
                    }

                    await this.level1MountedDSU.safeBeginBatchAsync();
                    this.level1MountedDSU.mount('/level2', keySSI, async (err) => {
                        if (err) {
                            throw err;
                        }
                        await this.level1MountedDSU.commitBatchAsync();
                        testDSU.getKeySSIAsString((err, keySSI) => {
                            if (err) {
                                throw err;
                            }

                            resolver.loadDSU(keySSI, (err, dsu) => {
                                if (err) {
                                    throw err;
                                }

                                dsu.batch((done) => {
                                    dsu.writeFile('/level1/level2/file1.txt', text[0], (err) => {
                                        if (err) {
                                            throw err;
                                        }
                                        dsu.hasUnanchoredChanges((err, status) => {
                                            assert.true(status);

                                            dsu.writeFile('/level1/level2/file2.txt', text[1], (err) => {
                                                if (err) {
                                                    throw err;
                                                }
                                                dsu.hasUnanchoredChanges((err, status) => {
                                                    assert.true(status);
                                                    done();
                                                });
                                            })
                                        });
                                    })

                                }, (err, result) => {
                                    if (err) {
                                        throw err;
                                    }
                                    dsu.hasUnanchoredChanges((err, status) => {
                                        assert.false(status);

                                        dsu.load((err) => {
                                            if (err) {
                                                throw err;
                                            }
                                            dsu.readFile('/level1/level2/file1.txt', (err, data) => {
                                                if (err) {
                                                    throw err;
                                                }
                                                assert.true(text[0], data.toString());

                                                dsu.readFile('/level1/level2/file2.txt', (err, data) => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                    assert.true(text[1], data.toString());

                                                    this.testBatchCancel(dsu);
                                                })
                                            })
                                        })
                                    });
                                })
                            })
                        })

                    })
                })

            })

        })
    },

    testBatchCancel: function (dsu) {
        dsu.beginBatch();

        dsu.writeFile('/level1/level2/tmp.txt', "this should not be anchored", (err) => {
            if (err) {
                throw err;
            }
            dsu.hasUnanchoredChanges((err, status) => {
                assert.true(status);

                dsu.writeFile('/level1/tmp.txt', 'this should not be anchored', (err) => {
                    if (err) {
                        throw err;
                    }
                    dsu.hasUnanchoredChanges((err, status) => {
                        assert.true(status);

                        dsu.writeFile('/tmp.txt', 'this should not be anchored', (err) => {
                            if (err) {
                                throw err;
                            }
                            dsu.hasUnanchoredChanges((err, status) => {
                                assert.true(status);

                                dsu.cancelBatch((err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    dsu.hasUnanchoredChanges((err, status) => {
                                        assert.false(status);
                                        this.callback();
                                    });
                                })
                            });
                        })
                    });
                })
            });
        })
    }
});

double_check.createTestFolder("batch_op_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Batch operations", (callback) => {
        $$.flows.start("BatchOperationsTest", "start", callback);
        //}, 3000 * 1000);
    }, 3000);
});
