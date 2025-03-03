const createError   = require( `http-errors` ),
      express       = require( `express` ),
      path          = require( `path` ),
      loginRouter   = require( `./routes/loginRoute` ),
      app           = express();


// Middleware setup
app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );
app.use( express.static( path.join( __dirname, `public` ) ) );

// Serve login.html as the default page
app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, `views`, `login.html`));
});

// Route setup
app.use( `/loginRoute`, loginRouter );

// Catch 404 and forward to error handler
app.use( function( req, res, next ) {
  next( createError( 404 ) );
});

// Error handler
app.use( function( err, req, res, next ) {
  res.status( err.status || 500 );
  res.json({ error: err.message });
});

module.exports = app;
