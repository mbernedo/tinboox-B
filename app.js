const express = require("express");
const mongojs = require("mongojs");
const kmeds = require("k-medoids");
const bodyParser = require("body-parser");
var ml = require('machine_learning');
var app = express();
var mysql = require('mysql');
var pool = mysql.createPool({
    host: "mysql.us.cloudlogin.co",
    user: "pachuco65_tesis",
    password: "password",
    database: "pachuco65_tesis",
    port: "3306"
});

app.set("port", (process.env.PORT || 3000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(app.get("port"), function () {
    console.log("Listo puerto 3000");
});

app.post("/registrar", function (req, res) {
    var rpta = {};
    var nombre = req.body.nombre;
    var apellido = req.body.apellido;
    var telefono = req.body.telefono;
    var email = req.body.email;
    var usuario = req.body.usuario;
    var password = req.body.password;
    var insert = {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        email: email,
        usuario: usuario,
        password: password
    };
    pool.query('INSERT INTO usuarios SET ?', insert, function (err, results, fields) {
        if (err) {
            console.log(err);
            rpta = {
                cod: 0,
                msg: "Error"
            };
            res.send(rpta);
        } else {
            rpta = {
                cod: 1,
                msg: "Bien"
            }
            res.send(rpta);
        }
    })
})

app.post("/login", function (req, res) {
    var rpta = {};
    var usuario = req.body.usuario;
    var password = req.body.password;
    pool.query('SELECT * FROM usuarios WHERE usuario=? AND password=?', [usuario, password], function (err, results, fields) {
        if (err) {
            console.log(err);
            rpta = {
                cod: 0,
                msg: "Error"
            };
            res.send(rpta);
        } else {
            if (results.length > 0) {
                rpta = {
                    idUser: results[0].idusuario,
                    cod: 1,
                    msg: "Bien"
                }
                res.send(rpta);
            } else {
                rpta = {
                    cod: 2,
                    msg: "Casi"
                }
                res.send(rpta);
            }
        }
    })
})

app.get("/getBooks", function (req, res) {
    var rpta = {};
    var datos = {};
    var obj = [];
    var idUser = req.query.idUser;
    pool.query("select l.idlibro as idlibro, l.titulo as titulo, g.nombre as genero, l.numeropag as numpag, " +
        "e.nombre as editorial, a.nombre as autor from libros l " +
        "join generos g on l.genero=g.idgenero " +
        "join editoriales e on l.editorial=e.ideditorial " +
        "join autores a on l.autor=a.idautor " +
        "where l.idlibro  not in (select idlibro " +
        "from usuariolibro where idusuario=?)", [idUser], function (err, results, fields) {
            if (err) {
                rpta = {
                    cod: 0,
                    msg: "Error"
                };
                res.send(rpta);
            } else {
                if (results.length > 0) {
                    results.forEach(function (item, index) {
                        datos = {
                            idBook: item.idlibro,
                            titulo: item.titulo,
                            genero: item.genero,
                            numpag: item.numpag,
                            editorial: item.editorial,
                            autor: item.autor
                        }
                        obj.push(datos);
                    });
                    rpta = {
                        cod: 1,
                        msg: "Bien",
                        data: obj
                    };
                    res.send(rpta);
                } else {
                    rpta = {
                        cod: 2,
                        msg: "Casi"
                    }
                    res.send(rpta);
                }
            }
        });
})

app.post("/valorar", function (req, res) {
    var user = req.body.usuario;
    var libro = req.body.libro;
    var rpta = {};
    var insert = {
        idusuario: user,
        idlibro: libro
    };
    pool.query("INSERT INTO usuariolibro SET ?", insert, function (err, results, fields) {
        if (err) {
            rpta = {
                cod: 0,
                msg: "Error"
            };
            res.send(rpta);
        } else {
            if (results.affectedRows > 0) {
                rpta = {
                    cod: 1,
                    msg: "Bien"
                }
                res.send(rpta);
            } else {
                rpta = {
                    cod: 2,
                    msg: "Casi"
                }
                res.send(rpta);
            }
        }
    })
})

app.get("/kmean", function (req, res) {
    var data = [];
    var obj = [];
    pool.query("SELECT ul.idusuariolibro, l.numeropag, l.genero, l.editorial, l.autor FROM usuariolibro ul " +
        "join libros l on ul.idlibro=l.idlibro order by ul.idusuariolibro", function (err, results, fields) {
            if (err) {
                res.send("error");
            } else {
                if (results.length > 0) {
                    results.forEach(function (item, index) {
                        data = [item.genero, item.numeropag, item.editorial];
                        obj.push(data);
                    });
                    var result = ml.kmeans.cluster({
                        data: obj,
                        k: 10,
                        epochs: 100,
                        distance: { type: "euclidean" }
                    });
                    var insert = [];
                    var obj2 = [];
                    var cluster = result.clusters;
                    cluster.forEach(function (clust, index) {
                        clust.forEach(function (val, index2) {
                            obj2 = [val + 1, index];
                            insert.push(obj2);
                        })
                    });
                    pool.query("DELETE FROM clusters", function (err, results, fields) {
                        if (err) {
                            console.log(err);
                        } else {
                            pool.query("ALTER TABLE clusters AUTO_INCREMENT=1", function (err, results, fields) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    pool.query("INSERT INTO clusters (idsuariolibro, cluster) VALUES ?", [insert], function (err, resul, field) {
                                        if (err) {
                                            res.send("error2");
                                        } else {
                                            res.send("ok");
                                        }
                                    })
                                }
                            })
                        }
                    });
                } else {
                    res.send("error3");
                }
            }
        })
})

app.get("/getClusters", function (req, res) {
    var rpta = {};
    var datos = {};
    var obj = [];
    var idUser = req.query.idUser;
    var tipo = req.query.tipo;
    if (tipo = "kmean") {
        pool.query("select distinct u.idusuario, u.nombre, u.apellido from clusters c " +
            "join usuariolibro ul on c.idsuariolibro=ul.idusuariolibro " +
            "join usuarios u on ul.idusuario=u.idusuario " +
            "where c.cluster in (select DISTINCT c.cluster from clusters c " +
            "join usuariolibro ul on c.idsuariolibro=ul.idusuariolibro " +
            "where ul.idusuario=?) and ul.idusuario<>?", [idUser, idUser], function (err, results, fields) {
                if (err) {
                    rpta = {
                        cod: 0,
                        msg: "Error"
                    };
                    res.send(rpta);
                } else {
                    results.forEach(function (item, index) {
                        datos = {
                            idusuario: item.idusuario,
                            nombre: item.nombre,
                            apellido: item.apellido,
                            telefono: item.telefono
                        }
                        obj.push(datos);
                    });
                    rpta = {
                        cod: 1,
                        data: obj
                    }
                    res.send(rpta);
                }
            })
    } else if (tipo = "kmedoid") {
        pool.query("select distinct u.idusuario, u.nombre, u.apellido from clusters2 c " +
            "join usuariolibro ul on c.idusuariolibro=ul.idusuariolibro " +
            "join usuarios u on ul.idusuario=u.idusuario " +
            "where c.cluster in (select DISTINCT c.cluster from clusters2 c " +
            "join usuariolibro ul on c.idusuariolibro=ul.idusuariolibro " +
            "where ul.idusuario=?) and ul.idusuario<>?", [idUser, idUser], function (err, results, fields) {
                if (err) {
                    rpta = {
                        cod: 0,
                        msg: "Error"
                    };
                    res.send(rpta);
                } else {
                    results.forEach(function (item, index) {
                        datos = {
                            idusuario: item.idusuario,
                            nombre: item.nombre,
                            apellido: item.apellido,
                            telefono: item.telefono
                        }
                        obj.push(datos);
                    });
                    rpta = {
                        cod: 1,
                        data: obj
                    }
                    res.send(rpta);
                }
            })
    }
});

app.get("/getMyBooks", function (req, res) {
    var idUser = req.query.idusuario;
    var rpta = {};
    var datos = {};
    var obj = [];
    pool.query("SELECT l.idlibro, l.titulo, g.nombre as genero, l.numeropag as numpag, " +
        "e.nombre as editorial, a.nombre as autor FROM usuariolibro ul " +
        "join libros l on ul.idlibro=l.idlibro " +
        "join generos g on l.genero=g.idgenero " +
        "join editoriales e on l.editorial=e.ideditorial " +
        "join autores a on l.autor=a.idautor " +
        "WHERE idusuario=?", [idUser], function (err, results, fields) {
            if (err) {
                rpta = {
                    cod: 0,
                    msg: "Error"
                };
                res.send(rpta);
            } else {
                if (results.length > 0) {
                    results.forEach(function (item, index) {
                        datos = {
                            idBook: item.idlibro,
                            titulo: item.titulo,
                            genero: item.genero,
                            numpag: item.numpag,
                            editorial: item.editorial,
                            autor: item.autor
                        }
                        obj.push(datos);
                    });
                    rpta = {
                        cod: 1,
                        msg: "Bien",
                        data: obj
                    };
                    res.send(rpta);
                } else {
                    rpta = {
                        cod: 2,
                        msg: "Casi"
                    }
                    res.send(rpta);
                }
            }
        });
})

app.get("/kmedoid", function (req, res) {
    var data = [];
    var obj = [];
    pool.query("SELECT ul.idusuariolibro, u.idusuario as usuario, l.numeropag, l.genero, l.editorial, l.autor FROM usuariolibro ul " +
        "join libros l on ul.idlibro=l.idlibro " +
        "join usuarios u on ul.idusuario=u.idusuario order by ul.idusuariolibro", function (err, results, fields) {
            if (err) {
                res.send("error");
            } else {
                if (results.length > 0) {
                    results.forEach(function (item, index) {
                        data = [item.usuario, item.genero, item.numeropag, item.editorial];
                        obj.push(data);
                    });
                    const clusterer = kmeds.Clusterer.getInstance(obj, 10);
                    const clusteredData = clusterer.getClusteredData();
                    var insert = [];
                    var obj2 = [];
                    clusteredData.forEach(function (clust, index) {
                        clust.forEach(function (val, index2) {
                            obj2 = [val[0], index];
                            insert.push(obj2);
                        })
                    });
                    pool.query("DELETE FROM clusters2", function (err, results, fields) {
                        if (err) {
                            console.log(err);
                        } else {
                            pool.query("ALTER TABLE clusters2 AUTO_INCREMENT=1", function (err, results, fields) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    pool.query("INSERT INTO clusters2 (idusuariolibro, cluster) VALUES ?", [insert], function (err, resul, field) {
                                        if (err) {
                                            console.log(err);
                                            res.send("error2");
                                        } else {
                                            res.send("ok");
                                        }
                                    })
                                }
                            })
                        }
                    });
                } else {
                    res.send("error3");
                }
            }
        })
})
