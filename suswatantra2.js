const app=require("express")()
const bodyParser=require("body-parser")
const assert=require("assert")
const mongodb=require("mongodb")
const client=new mongodb.MongoClient("mongodb://localhost:27017",{useUnifiedTopology:true})
const dbName="suswatantra"
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,Authorization");
    next();
})

app.post("/login",function(req,res){
    client.connect((err,cli)=>{
        assert.equal(null, err)
        const db=cli.db(dbName)
        db.collection("incharge").findOne({userName:req.body.userName}, function(err,out){
            assert.equal(null, err)
            if(out==null){
                res.send("There is no account with the name "+req.body.userName)
            }
            else if(out.password==req.body.password){
                res.send("Login successfully")
            }
            else{
                res.send("Invalid password")
            }
        })
    })
})

app.post("/debenture",function(req,res){
    client.connect((err,cli)=>{
        assert.equal(null, err)
        assert.equal(null, err)
        const db=cli.db(dbName)
        const date=new Date().toDateString().slice(4)
        db.collection("debentures").countDocuments(function(err,out){
            assert.equal(null, err)
            db.collection("debentures").find({}).skip((out>0)?out-1:0).toArray(function(err,details){
                assert.equal(null, err)                
                const data={
                    userID:(details.length)?details[0].userID+1:1,
                    userName:req.body.userName,
                    phone:req.body.phone,
                    email:req.body.email,
                    pledgedAmount:req.body.debAmount,
                    pldegedDate:date,
                    recievedAmount:null,
                    recievedDate:null,
                    status:"pledged",
                    comment:null
                }
                if (req.body.debType=="book"){
                    db.collection("debentures").insertOne(data, function(err,out){
                        assert.equal(null, err)
                        res.send(req.body.userName+" added a new debenture of amount "+req.body.debAmount)        
                    })
                }                
            })
        })
    })
})

app.put("/edit/:id",function(req,res){
    client.connect((err,cli)=>{
        assert.equal(null, err)
        const db=cli.db(dbName)
        const date=new Date().toDateString().slice(4)
        db.collection("debentures").findOne({userID:Number(req.params.id)}, function(err,out){
            assert.equal(null, err)
            let status=null
            if(out.pledgedAmount==req.body.debAmount)
            status="Recieved"
            else if(out.pledgedAmount>req.body.debAmount)
            status="Reduced"
            else if(out.pledgedAmount<req.body.debAmount)
            status="Incresed"
            const data={
                userName:req.body.userName,
                phone:req.body.phone,
                email:req.body.email,
                recievedAmount:req.body.debAmount,
                recievedDate:date,
                status:status,
                comment:req.body.notes
            }
            db.collection("debentures").updateOne({userID:Number(req.params.id)}, {$set:data}, function(err,out){
                assert.equal(null, err)
                console.log(out)
                res.send("Edited successfully")
            })
        })        
    })
})

app.post("/details",function(req,res){
    client.connect((err,cli)=>{
        assert.equal(null, err)
        const db=cli.db(dbName)
        db.collection("debentures").aggregate([{$group:{_id:null,totalPledged:{$sum:"$pledgedAmount"},totalRecieved:{$sum:"$recievedAmount"}}}]).toArray((err,result)=>{
            if(err) throw err                        
            db.collection("debentures").find({},{projection:{_id:0}}).toArray((err,out)=>{
                assert.equal(null, err)        
                // const extra={
                //     _id:null,
                //     count:out.length,
                //     totalPledged:result[0].totalPledged,
                //     totalRecieved:result[0].totalRecieved
                // }        
                result[0].count=out.length
                out.push(result[0])
                res.send(out)
            })
        })
    })
})

app.delete("/delete/:id",function(req,res){
    client.connect((err,cli)=>{
        assert.equal(null, err)
        const db=cli.db(dbName)
        db.collection("debentures").deleteOne({userID:Number(req.params.id)}, function(err,out){
            assert.equal(null, err)
            res.send("Delted successfully")
        })
    })
})

app.listen(3430, function(){
    console.log("server hearing at port 3430")
    client
})