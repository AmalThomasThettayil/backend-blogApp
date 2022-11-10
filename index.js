const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors")
dotenv.config()
const dbConnect = require("./config/db/dbConnect");
const userRoutes = require("./route/users/usersRoute");
const { errorHandler, notFound } = require("./middlewares/error/errorHandler");
const postRoute = require("./route/posts/postRoute");
const app = express();

const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs');
const commentRouter = require("./route/comments/commentRoute");
const emailRouter = require("./route/email/emailRoute");
const categoryRoute = require("./route/category/categoryRoute");
const swaggerDocument = YAML.load('./swagger.yaml');

//db 
dbConnect();

//swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//middleware
app.use(express.json())

//cors
app.use(cors())

//users route
app.use("/api", userRoutes)

//post route
app.use("/api/posts", postRoute);

//comment route
app.use("/api/comments", commentRouter);

//email route
app.use("/api/email", emailRouter);

// category route
app.use("/api/category", categoryRoute);

//error handler
app.use(notFound)
app.use(errorHandler)
//server
const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`server is running on port: ${PORT}`))

//NW5I0Tq1DUCv898K

