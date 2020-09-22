const app = require("express")();
const bodyParser = require("body-parser");
const assert = require("assert");
const mongodb = require("mongodb");
const client = new mongodb.MongoClient("mongodb://localhost:27017", {
  useUnifiedTopology: true,
});
const dbName = "suswatantra";
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

app.post("/login", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("incharge").findOne(
      { userName: req.body.userName },
      function (err, out) {
        assert.equal(null, err);
        if (out == null) {
          res.send("You don't have a account"); //.send("No account")
        } else if (out.password == req.body.password) {
          db.collection("incharge").updateOne(
            { userName: req.body.userName },
            { $set: { log: true } },
            (err, out) => {
              assert.equal(null, err);
              res.send("Login successfully");
            }
          );
        } else {
          res.send("Invalid credentials");
        }
      }
    );
  });
});

app.post("/deb_form", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    assert.equal(null, err);
    const db = cli.db(dbName);
    const date = new Date().toUTCString().slice(5, 16);
    db.collection("incharge").findOne({}, function (err, det) {
      assert.equal(null, err);
      console.log(req.body);
      if (det.log) {
        db.collection("debentures").countDocuments(function (err, out) {
          assert.equal(null, err);
          db.collection("debentures")
            .find({})
            .skip(out > 0 ? out - 1 : 0)
            .toArray(function (err, details) {
              assert.equal(null, err);
              const data = {
                userId: details.length ? details[0].userId + 1 : 1,
                userName: req.body.userName,
                phone: req.body.phone,
                email: req.body.email,
                pledgedAmount: req.body.debAmount,
                pledegedDate: date,
                recievedAmount: null,
                recievedDate: null,
                status: "pledged",
                comment: null,
              };
              if (req.body.debType == "book") {
                db.collection("debentures").insertOne(data, function (
                  err,
                  out
                ) {
                  assert.equal(null, err);
                  // res.send("Created");
                  console.log(out);
                });
              }
              res.send("Created");
            });
        });
      } else {
        res.send("you are unauthorized");
      }
    });
  });
});

app.put("/editdetails/:id", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    const date = new Date().toUTCString().slice(5, 16);
    db.collection("incharge").findOne({}, function (err, det) {
      assert.equal(null, err);
      if (det.log) {
        if (req.body.debType == "purchase") {
          db.collection("debentures").findOne(
            { userId: Number(req.params.id) },
            function (err, out) {
              assert.equal(null, err);
              //console.log(out)
              if (out != null) {
                let status = null;
                if (out.pledgedAmount == req.body.debAmount)
                  status = "Recieved";
                else if (out.pledgedAmount > req.body.debAmount)
                  status = "Reduced";
                else if (out.pledgedAmount < req.body.debAmount)
                  status = "Incresed";
                const data = {
                  userName: req.body.userName,
                  phone: req.body.phone,
                  email: req.body.email,
                  recievedAmount: req.body.debAmount,
                  recievedDate: date,
                  status: status,
                  comment: req.body.notes,
                };
                db.collection("debentures").updateOne(
                  { userId: Number(req.params.id) },
                  { $set: data },
                  function (err, out) {
                    assert.equal(null, err);
                    //console.log(out)
                    res.status(202).send("Edited successfully");
                  }
                );
              } else res.status(404).send("Not Found");
            }
          );
        }
      } else {
        res.status(403).send("You are unauthorized");
      }
    });
  });
});

app.get("/details", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("incharge").findOne({}, function (err, det) {
      assert.equal(null, err);
      if (det.log) {
        db.collection("debentures")
          .aggregate([
            {
              $group: {
                _id: null,
                totalPledged: { $sum: "$pledgedAmount" },
                totalRecieved: { $sum: "$recievedAmount" },
              },
            },
          ])
          .toArray((err, result) => {
            if (err) throw err;
            //console.log(result)
            db.collection("debentures")
              .find({}, { projection: { _id: 0 } })
              .toArray((err, out) => {
                assert.equal(null, err);
                if (result.length) {
                  result[0].count = out.length;
                  out.push(result[0]);
                }
                res.status(202).send(out);
              });
          });
      } else {
        res.status(403).send("You are unauthorized");
      }
    });
  });
});

app.delete("/deldetails/:id", function (req, res) {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = cli.db(dbName);
    db.collection("incharge").findOne({}, function (err, det) {
      assert.equal(null, err);
      if (det.log) {
        db.collection("debentures").deleteOne(
          { userId: Number(req.params.id) },
          function (err, out) {
            assert.equal(null, err);
            if (out.deletedCount) res.status(202).send("Deleted successfully");
            else res.status(404).send("Doesn't exist");
          }
        );
      } else {
        res.status(403).send("You are unauthorized");
      }
    });
  });
});

app.listen(2733, function () {
  console.log("server hearing at port 3430");
});
