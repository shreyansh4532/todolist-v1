//jshint esversion:6
const dotenv = require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
 // const workItems = [];

app.get("/", function(req, res) {


  Item.find(function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully saved items to database");
        }
      })
      res.redirect("/");
        }
        else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

// const day = date.getDate();
});

// CREATING CUSTOM LISTS
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

// For using the about route. <PROBLEM>
  // if (customListName === "about") {
  //   res.redirect("/" + customListName);
  // }

List.findOne({name: customListName}, (err, foundList) => {
  if (!err) {

    if (!foundList) {
      // Create a new list if no list were found.
      const list = new List({
        name: customListName,
        items: defaultItems
      });

    list.save();
    res.redirect("/" + customListName)
    }
    else {
      //Show an existing list if the list exists.
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  }
})

});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });

  if (listName === "Today") {

        newItem.save();
        res.redirect("/");

  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });

  }

});

// DELETING CHECKED LIST ITEM.
app.post("/delete", function(req, res) {
const checkedId = req.body.checkbox;
const listName = req.body.listName;

if (listName === "Today") {

  Item.findByIdAndRemove(checkedId, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Deleted the todolist item.");
      res.redirect("/")
    }
  })

}

else {
  List.findOneAndUpdate( {name: listName}, { $pull: {items: {_id: checkedId}} }, function(err, foundList) {
    if (!err) {
      res.redirect("/" + listName);
    }
  });
}



});

// Handeling the "/about" route.
app.get("/about", function(req, res){
  res.render("about");
});

//Listening on port 3000.
const port = process.env.PORT;
app.listen(port, function() {
  console.log(`Server started on port ${port}...`);
});
