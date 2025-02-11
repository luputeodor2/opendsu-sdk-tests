require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("List mounted dossiers test", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
        if (err) {
            throw err;
        }
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dossier) => {
            if (err) {
                throw err;
            }

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, anotherDossier) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, yetAnotherDossier) => {
                    if (err) {
                        throw err;
                    }
                    dossier.getKeySSIAsString((err, dossierKeySSI) => {
                        if (err) {
                            throw err;
                        }

                        anotherDossier.getKeySSIAsString((err, anotherDossierKeySSI) => {
                            if (err) {
                                throw err;
                            }

                            yetAnotherDossier.getKeySSIAsString((err, yetAnotherDossierKeySSI) => {
                                if (err) {
                                    throw err;
                                }

                                const mountingPoints = [{path: "/temp", name: "dir", seed: dossierKeySSI}, {
                                    path: "/temp/dossier1/folder",
                                    name: "dossier2",
                                    seed: anotherDossierKeySSI
                                }, {path: "/temp/dossier1/folder", name: "dossier3", seed: yetAnotherDossierKeySSI}];

                                resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, raw_dossier) => {
                                    if (err) {
                                        throw err;
                                    }

                                    await raw_dossier.safeBeginBatchAsync();
                                    raw_dossier.writeFile("testFile", "testContent", (err) => {
                                        if (err) {
                                            throw err;
                                        }

                                        function __mount(index) {
                                            let mount = mountingPoints[index];
                                            raw_dossier.mount(mount.path + "/" + mount.name, mount.seed, async (err) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                if (index === mountingPoints.length - 1) {
                                                    await raw_dossier.commitBatchAsync();
                                                    startTest();
                                                } else {
                                                    __mount(index + 1);
                                                }
                                            });
                                        }

                                        function startTest() {
                                            raw_dossier.listMountedDossiers("/temp/dossier1/folder", (err, mountedDossiers) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                assert.true(mountedDossiers.length === 2);
                                                testFinishCallback();
                                            });
                                        }

                                        __mount(0);
                                    });
                                });
                            });
                        });
                    });
                });
            });
            });
        });

    });
}, 5000);

