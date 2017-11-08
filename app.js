const express = require("express");
const mongojs = require("mongojs");
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
        user: usuario,
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
    pool.query("select l.idlibro as idlibro, l.titulo as titulo, g.nombre as genero from libros l " +
        "join generos g on l.genero=g.idgenero " +
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
                            genero: item.genero
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

var data = [];
var obj = [];
pool.query("SELECT ul.idusuario, ul.idlibro, l.numeropag, l.genero, l.editorial, l.autor FROM usuariolibro ul " +
    "join libros l on ul.idlibro=l.idlibro", function (err, results, fields) {
        if (err) {
            console.log(err);
        } else {
            if (results.length > 0) {
                results.forEach(function (item, index) {
                    data = [item.idusuario, item.idlibro, item.numeropag, item.genero, item.editorial, item.autor];
                    obj.push(data);
                });
                var result = ml.kmeans.cluster({
                    data: obj,
                    k: 5,
                    epochs: 100,
                    distance: { type: "euclidean" }
                });
                console.log("means: ", result.clusters);
            } else {
                console.log("casi");
            }
        }
    })