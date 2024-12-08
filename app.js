const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");
const Review = require("./models/review.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extenned: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.engine('ejs', ejsMate);

const validatonListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(404, error);
    } else {
        next();
    };
};

mongoose.connect('mongodb://127.0.0.1:27017/wanderlust')
    .then(() => console.log('Connected!'));

//Index Route    
app.get("/listings", wrapAsync(async (req, res) => {
    const allListing = await Listing.find({});
    res.render("listings/index.ejs", { allListing });
}));

//New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

//Create Route
app.post("/listings", validatonListing, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//Edit Route
app.get("/listings/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
});

//Update Route
app.put("/listings/:id", async (req, res) => {
    if (!req.body.listen) {
        throw new ExpressError(404, "Send valid data for listing");
    }
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect("/listings");
});

//Delete Route
app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
});

//Reviews
//post Route
app.post("/listings/id:/reviews", async (req, res) => {
    let listing = Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await listing.save();
    await newReview.save();

    res.redirect("/listings");
})

//Show Route
app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
});

// app.get("/testlisting", async (req, res) => {
//     let samplelisting = new Listing({
//         title: "My new villa",
//         descripction: "My ttle book",
//         price: "2000",
//         location: "Odisha"
//     });
//     await samplelisting.save();
//     console.log("sample was saved");
//     res.send("sucessful");
// });

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Somting went wrong!" } = err;
    res.render("listings/error.ejs", { err });
    // res.status(statusCode).send(message);
});


app.get("/", (req, res) => {
    res.send("hy");
});


app.listen("8080", (req, res) => {
    console.log("it is work");
});