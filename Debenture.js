const express = require("express");
const app = express();
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const assert = require("assert");
const increment = require("mongodb-autoincrement");
const url = "mongodb://localhost:27017";
const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
const dbName = "DebentureForms";
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
app.post("/deb_form", (req, resp) => {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = client.db(dbName);
    const date = new Date().toDateString().slice(4);
    increment.getNextSequence(db, "DebAccount", function (err, incr) {
      var pass = req.body.UserName;
      db.collection("DebAccount").insertOne(
        {
          userId: incr,
          userName: req.body.userName,
          phone: req.body.phone,
          email: req.body.email,
          pledgedDate: date,
          pledgedAmount: req.body.deb_amount,
          recievedAmount: null,
          recievedDate: null,
          status: "pledged",
          notes: null,
        },
        function (err, output) {
          if (err) throw err;
          resp.send(
            "Congratulations " +
              req.body.userName +
              " !! you added a new debenture"
          );
        }
      );
    });
  });
});
app.get("/details", (req, resp) => {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = client.db(dbName);
    db.collection("DebAccount")
      .find({}, { projection: { _id: 0 } })
      .toArray((err, out) => {
        if (err) throw err;
        resp.send(out);
      });
  });
});
app.post("/login", (req, resp) => {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = client.db(dbName);
    db.collection("DebUser").findOne({ userName: req.body.userName }, function (
      err,
      output
    ) {
      if (err) throw err;
      console.log(output);
      if (output == null) {
        resp.send("You don't have a account");
      } else if (output.password == req.body.password) {
        resp.send("Login Successful.....User Credentials Matched");
      } else {
        resp.send("Invalid credentials");
      }
    });
  });
});
app.put("/editdetails/:id", (req, resp) => {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = client.db(dbName);
    const date = new Date().toDateString().slice(4);
    db.collection("DebAccount").findOne(
      { userId: Number(req.params.id) },
      function (err, out) {
        var status = null;
        if (out.pledgedAmount == req.body.deb_amount) {
          status = "Recieved";
        } else if (out.pledgedAmount > req.body.deb_amount) {
          status = "Reduced";
        } else if (out.pledgedAmount < req.body.deb_amount) {
          status = "Increased";
        }
        db.collection("DebAccount").updateOne(
          { userId: Number(req.params.id) },
          {
            $set: {
              userName: req.body.userName,
              phone: req.body.phone,
              email: req.body.email,
              recievedAmount: req.body.deb_amount,
              recievedDate: date,
              status: status,
              notes: req.body.notes,
            },
          },
          function (err, out) {
            if (err) throw err;
            resp.send(
              "Edited Successfully the debenture of: " + req.body.userName
            );
          }
        );
      }
    );
  });
});
app.delete("/deldetails/:id", (req, resp) => {
  client.connect((err, cli) => {
    assert.equal(null, err);
    const db = client.db(dbName);
    db.collection("DebAccount").findOne(
      { userId: Number(req.params.id) },
      function (err, out) {
        if (err) throw err;
        db.collection("DebAccount").deleteOne(
          { userId: Number(req.params.id) },
          function (err, out) {
            if (err) throw err;
            resp.send("Deleted the debenture Succesfully!!");
          }
        );
      }
    );
  });
});
app.listen("2733", () => {
  console.log("server started on 2733");
});
