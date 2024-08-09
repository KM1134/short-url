
const express=require("express");
const path=require("path");
const cookieParser=require("cookie-parser");

const {connectToMongoDB}=require("./connect");
const{restrictToLoggedinUserOnly,checkAuth}=require("./middlewares/auth");
const URL=require("./models/url");

const urlRoute=require("./routes/url");
const staticRoute=require("./routes/staticRouter");
const userRoute=require("./routes/user");
const app=express();
const PORT=8001;

connectToMongoDB(" mongodb://127.0.0.1:27017/url-shortner").then(()=>console.log("Mongodb connected"));
        
app.use(express.json());  
app.use(express.urlencoded({extended:false}));//to parse form
app.use(cookieParser());  

app.set("view engine","ejs");
app.set("views",path.resolve("./views"))

app.use("/url",restrictToLoggedinUserOnly,urlRoute);
app.use("/",checkAuth,staticRoute);
app.use("/user",userRoute);

app.get("/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    try {
        const entry = await URL.findOneAndUpdate(
            { shortId }, // filter object
            { 
                $push: {
                    visitHistory: { 
                        timestamp: Date.now() 
                    } 
                } 
            },
            { new: true } // options object to return the updated document
        );

        if (!entry) {
            return res.status(404).send("Short URL not found");
        }

        res.redirect(entry.redirectURL);
    } catch (error) {
        console.error('Error updating visit history:', error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

app.listen(PORT,()=>console.log(`Server started at port:${PORT}`));

