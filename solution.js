import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


// create a new client
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "aims",
  password: "b210525cs",
  port: 5432,
});

const app = express();
const port = 3000;

// Connect to the database
db.connect();


let responseDetails = [];
db.query("SELECT * FROM alumni", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    responseDetails = res.rows;
  }
});


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentQuestion = {};

// GET login page
app.get("/login", async (req, res) => {
  res.render("login.ejs");
});

// GET updateCompany page
app.get("/alumni/updateCompany", async (req, res) => {
  res.render("updateCompany.ejs");
});
app.post("/alumni/updateCompany", async (req, result) => {
  console.log(req.body);
  const { username, password, companyname, sector,rating , role,experience,location,currentworking } = req.body;
  const currentlyworking = currentworking === "Y" ? true : false;

  console.log(req.body);
  db.query(`SELECT * FROM company WHERE companyname = $1`, [companyname], (err, res) => {
    if (err) {
      console.log("Error in finding company");
    }
    else{
      if(res.rows.length > 0){
        db.query(`INSERT INTO workedin (experience, role, location, rating, currentworking,alumniusername , companyname) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [experience, role, location, rating, currentlyworking, username, companyname], (err, res) => {
          if (err) {
            console.log("Error inserting into workedin");
          }
          else{
            console.log(res);
            result.redirect("/alumni");
          }});
    }
    else{
      db.query(`INSERT INTO company (companyname, sector, rating) VALUES ($1, $2, $3) RETURNING *`, [ companyname, sector, rating], (err, res) => {
        if (err) {
    
          console.log("Error in inserting company");
          console.log(err);
          console.log(currentlyworking);
        } else {
          console.log(res);
          db.query(`INSERT INTO workedin (experience, role, location, rating, currentworking,alumniusername , companyname) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [experience, role, location, rating, currentlyworking, username, companyname], (err, res) => {
            if (err) {
              console.log("Error inserting into workedin");
              db.query('DELETE FROM company WHERE companyname = $1 RETURNING *', [companyname], (err, res) =>{
                if (err) {
                  console.log("Error in delete", err.stack);
                } else {
    
                  console.log(res);  
                }     
              });
            } else {
              console.log(res);
              result.redirect("/alumni");
            }
          });
        
        }
      });
    }}


});
});

let alumnidetails = {};
// POST login request
app.post("/login", async (req, result) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query("SELECT * FROM users WHERE username = $1 AND password = $2",[username,password], (err, res) => {
    if (err) {
      console.log("Error executing query", err.stack);
    } else {
      if (res.rows.length > 0) {
        db.query("SELECT * FROM alumni WHERE username = $1",[username], (err, res) => {
          if (err) {
            console.log("Error executing query", err.stack);
          } else {
            if (res.rows.length > 0) {
              alumnidetails = res.rows[0];
              result.redirect("/alumni");
            } else {

              result.redirect("/student");
            }
          }
        });
      } else {
        result.redirect("/login");
      }
    }
  });
});


//post request for alumni registration
app.post("/register/alumni", async (req, result) => {
  let { username, password, alumniname, yearofgrad, department,email, linkedin ,phonenumber } = req.body;
  phonenumber=req.body.phoneNumber;
  db.query(`INSERT INTO users (username , password) VALUES ($1, $2) RETURNING *`, [username, password], (err, res) => {
    if (err) {
      console.log("Error executing query", err.stack);
    } else {
      console.log(res);

      db.query(`INSERT INTO alumni (username , alumniname, yearofgrad, department, email, linkedin, phonenumber) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [username, alumniname, yearofgrad, department, email, linkedin, phonenumber], (err, res) => {
        if (err) {
          console.log("Error executing query", err.stack);
          db.query('DELETE FROM users WHERE username = $1 RETURNING *', [username], (err, res) =>{
            if (err) {
              console.log("Error executing query", err.stack);
            } else {
              console.log(res);  
            }     
          });
        } else {
          console.log(res);
          result.redirect("/login");
        }
      });
    }
});
});


//post request for student registration
app.post("/register/student", async (req, result) => {
  const { username, password, firstname, lastname, rollno, branch } = req.body;
  console.log(req.body);
   db.query(`INSERT INTO users (username , password) VALUES ($1, $2) RETURNING *`, [username, password], (err, res) => {
    if (err) {
      console.log("Error executing query", err.stack);
    } else {
      console.log("res");

      db.query(`INSERT INTO student (username , firstname, lastname, rollnumber, branch) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [username, firstname, lastname, rollno, branch], (err, res) => {
        if (err) {
          console.log("Error executing query", err.stack);
          db.query('DELETE FROM users WHERE username = $1 RETURNING *', [username], (err, res) =>{
            if (err) {
              console.log("Error executing query", err.stack);
            } else {
              console.log(res);  
            }     
          });
        } else {
          console.log(res);
          result.redirect("/login");
        }
    });
    }

})});
// GET home page
app.get("/", async (req, result) => {

  db.query("SELECT COUNT(alumniusername),companyname FROM workedin GROUP BY companyname", (err, res) => {
    if (err) {
      
      console.error("Error in get /", err.stack);
    } else {
    console.log(res.rows);
  result.render("home.ejs",{details:res.rows});
}
});
});
let status = "none";
let average = "0";
// GET search home page
app.get("/student", async (req, res) => {
  console.log(currentQuestion);
  res.render("index.ejs", { question: responseDetails, status: status, average : average});
});

//Get alumni home page

app.get("/alumni", async (req, res) => {
  console.log(currentQuestion);
  res.render("alumni.ejs", { alumni: alumnidetails });
});

// GET student register page
app.get("/register/student", async (req, res) => {
  //console.log(currentQuestion);
  res.render("registerStudent.ejs");
});

// GET alumni register page
app.get("/register/alumni", async (req, res) => {
  res.render("registerAlumni.ejs");
});

app.get("/company/alumni", async (req, result) => {
  const alumniname = req.query.alumniname;
  console.log(alumniname);

  db.query(`SELECT * FROM workedin,company,alumni WHERE alumniname = $1 AND alumniusername = username AND company.companyname = workedin.companyname`,[alumniname], (err, res) => {
    if (err) {
      console.log("Error executing query", err.stack);
    }
    else{
      console.log(res.rows);
      responseDetails = res.rows;
      status = "company";
      result.redirect('/student');
    }
  });
});
app.get("/company", (req, result) => {
  const companyName = req.query.companyname;
  
  db.query(`SELECT * FROM workedin,alumni WHERE companyname = $1 AND username = alumniusername`,[companyName], (err, res) => {
    if (err) {
      console.log("Error executing query", err.stack);
    }
    else{
      console.log(res.rows);
      responseDetails = res.rows;
      status = "alumni";
      result.redirect('/student');
    }
  });
});
// POST a search query
app.post("/search", (req, result) => {
  let searchQuery = req.body.searchQuery ;
  console.log(req.body);
  const searchType = req.body.searchType;
  let searchAttribute = "alumniname";
  if (searchType === "alumni") {

    searchAttribute = "alumniname";
    status = "alumni";
  }
  else {

    searchAttribute = "companyname";
    status = "company";
    db.query(`SELECT AVG(rating) FROM workedin WHERE companyname = $1 GROUP BY companyname`,[searchQuery], (err, res) => {
      if (err) {
        console.log("Error executing query", err.stack);
      } else {
        console.log("The average is ",res.rows);
        if(res.rows.length > 0)
          average = res.rows[0].avg;
      }
    });
  }
  searchQuery = searchQuery + "%";
  db.query(`SELECT * FROM ${searchType} WHERE ${searchAttribute} LIKE $1`,[searchQuery], (err, res) => {
    if (err) {
      console.log("Error executing query", err.stack);
    } else {

      responseDetails = res.rows;
      console.log(responseDetails);
      result.redirect("/student");
    }
  });
});

//Show that server is running on port 3000
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
