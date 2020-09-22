const app = require("express")();
const bodyParser = require("body-parser");
const assert = require("assert");
const mongodb = require("mongodb");
const client = new mongodb.MongoClient("mongodb://localhost:27017", {
  useUnifiedTopology: true,
});
const dbName = "projectSU";
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept,Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  next();
});

app.post("/register", function (req, res, next) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").countDocuments(function (er, out) {
      assert.equal(null, er);
      db.collection("accounts")
        .find({})
        .skip(out > 0 ? out - 1 : 0)
        .toArray((err, result) => {
          assert.equal(null, err);
          if (req.body.pwd1 == req.body.pwd2) {
            const data = {
              userId: result.length ? result[0].userId + 1 : 1,
              profile: {
                userName: req.body.userName,
                password: req.body.pwd1,
                log: false,
              },
              records: [],
            };
            db.collection("accounts").insertOne(data, function (err, out) {
              assert.equal(null, err);
              res.send("Account created");
            });
          } else {
            res.send("Password doesn't match");
          }
        });
    });
  });
});

app.post("/login", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").findOne(
      { "profile.userName": req.body.userName },
      function (err, out) {
        assert.equal(null, err);
        if (out == null) {
          res.send("You don't have a account");
        } else if (out.profile.password == req.body.password) {
          db.collection("accounts").updateOne(
            { "profile.userName": req.body.userName },
            { $set: { "profile.log": true } },
            (err, det) => {
              assert.equal(null, err);
              res.send({ id: out.userId, userName: req.body.userName });
            }
          );
        } else {
          res.send("Invalid credentials");
        }
      }
    );
  });
});

app.get("/:user/details", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").findOne(
      { userId: Number(req.params.user) },
      { projection: { _id: 0, "profile.password": 0 } },
      function (err, out) {
        res.send(out);
      }
    );
  });
});

app.post("/:user/deb_form", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").findOne(
      { userId: Number(req.params.user) },
      function (err, out) {
        assert.equal(null, err);
        console.log(out);
        if (out != null && out.profile.log) {
          const data = {
            debID: out.records.length
              ? out.records[out.records.length - 1].debID + 1
              : 1,
            userName: req.body.userName,
            email: req.body.email,
            phone: req.body.phone,
            pledgedAmount: req.body.deb_amount,
            pledgedDate: new Date().toUTCString().slice(5, 16),
            recievedAmount: null,
            recievedDate: null,
            status: "pledged",
            comment: null,
          };
          db.collection("accounts").updateOne(
            { userId: Number(req.params.user) },
            { $push: { records: data } },
            function (err, result) {
              assert.equal(null, err);
              res.send("created");
            }
          );
        } else {
          res.send("You are unauthorized");
        }
      }
    );
  });
});

app.put("/:user/editdetails/:id", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").findOne(
      { userId: Number(req.params.user) },
      function (err, out) {
        assert.equal(null, err);
        if (out.profile.log) {
          let status = null;
          const id = Number(req.params.id) - 1;
          const pled = out.records[id].pledgedAmount;
          if (pled == req.body.deb_amount) status = "Recieved";
          else if (pled > req.body.deb_amount) status = "Reduced";
          else if (pled < req.body.deb_amount) status = "Increased";
          out.records[id].recievedAmount = req.body.deb_amount;
          (out.records[id].recievedDate = new Date()
            .toUTCString()
            .slice(5, 16)),
            (out.records[id].status = status);
          out.records[id].comment = req.body.notes;
          db.collection("accounts").findOneAndUpdate(
            { userId: Number(req.params.user) },
            { $set: { records: out.records } },
            function (err, result) {
              assert.equal(null, err);
              console.log(out, result);
              res.send("Edited");
            }
          );
        } else {
          res.send("You are unauthorized");
        }
      }
    );
  });
});

app.delete("/:user/deldetails/:id", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").findOne(
      { userId: Number(req.params.user) },
      function (err, out) {
        assert.equal(null, err);
        if (out.profile.log) {
          db.collection("accounts").update(
            { userId: Number(req.params.user) },
            { $pull: { records: { debID: Number(req.params.id) } } },
            function (err, result) {
              assert.equal(null, err);
              console.log(out);
              res.send("deleted");
            }
          );
        } else {
          res.send("You are unauthorized");
        }
      }
    );
  });
});

app.post("/:user/logout", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("accounts").updateOne(
      { userId: Number(req.params.user) },
      { $set: { "profile.log": false } },
      function (err, out) {
        assert.equal(null, err);
        res.send("Logout");
      }
    );
  });
});
app.listen(1234, function () {
  console.log("Port is hearing at 1234");
});
