const express = require("express");
const mongojs = require("mongojs");
const bodyParser = require("body-parser");
var app = express();
var db = mongojs("mongodb://mbernedo:password@ds123534.mlab.com:23534/timboox", ["usuarios"]);

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
    db.usuarios.insert(insert, function (err, docs) {
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
    var login = {
        usuario: usuario,
        password: password
    };
    db.usuarios.findOne(login, function (err, doc) {
        if (err) {
            console.log(err);
            rpta = {
                cod: 0,
                msg: "Error"
            };
            res.send(rpta);
        } else {
            if (doc !== null) {
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