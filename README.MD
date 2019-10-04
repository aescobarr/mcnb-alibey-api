# Georef API

Georef API - An express app that exposes [Georef](https://github.com/aescobarr/djangoref) data through a REST API. Georef API is built using [Express](https://expressjs.com/).

This project is tightly related to [Georef](https://github.com/aescobarr/djangoref) and is not meant to work as a separate piece since it uses Georef underlying database.

## Getting Started

These instructions will help you set up a basic working development environment on a Ubuntu 18.04 LTS system. It assumes [Git](https://git-scm.com/) is installed and running in the host machine.


### Prerequisites

We assume that Georef is installed in its dev form in the machine, with all its dependencies. Take a look at the [docs](https://github.com/aescobarr/djangoref/blob/master/README.md).

Express is a [Node.js](https://nodejs.org/) framework, so we need to install Node. It can be installed from packages:
```bash
sudo apt install nodejs
```

We also need the [Node.js package manager](https://www.npmjs.com/), which can also be installed from packages:

```bash
sudo apt install npm
```

### Installing

Clone the repository like this:
```bash
git clone https://github.com/aescobarr/djangoref_api.git
```

Then from the newly cloned folder we need to install the dependencies using npm:
```bash
npm install
```

#### Previous steps

Before starting the app, we need to:

* Create an API user in Georef
* Fill the config file with the appropiate values
* Create the API tables in our Georef setup

##### API User

The API User is a normal Georef user. To create it log on to your current Georef install with and admin user and create a new user. Then, go to the public.auth_user table in the PostgreSQL database and look up your user. Copy the fields user_name and password, you will need to put these values in the test section of the config file.

##### Config files

In the freshly cloned repo we have an example configuration file [config.js.example](https://github.com/aescobarr/djangoref_api/blob/master/config.js.example). This file contains a config javascript object with the following structure:
```javascript
var config = {
  production: {
    ...
  },
  test = {
    ...
  },
  dev = {
    ...
  },
  other_environment = {
    ...
  },
  ...
};
```

Each of the keys in config (production, test, etc) represents one of the possible environments in which the API can be run. You can add as many environments as needed, but each of the keys needs the following items:
```javascript
some_environment: {
  secret: 'some_secret',                  //a long convoluted string used internally in auth stuff
  database_host: 'localhost',             //ip address of the machine hosting the Georef PostgreSQL database
  database_port: 5432,                    //The port in which PostgreSQL listens for incoming connections (usually 5432)
  database_name: 'my_database',           //The name of the Georef PostgreSQL database 
  database_user: 'my_user',               //The name of the user which will connect to the database
  database_password: 'my_password',       //The password of the above user
  test_user_name: 'test_user',            //This key is only used in the 'test' enviroment. It has to be the user_name field defined in the auth_user Postgresql table
  test_user_pwd: 'test_password',         //This key is only used in the 'test' enviroment. It has to be the password field defined in the auth_user Postgresql table
  running_port: 8080,                     //The API listens to connections in this port
}
```

##### API Tables

The API uses certain denormalized tables to accelerate some queries. These API tables are created via scripts that are included in the Georef project. The scripts are:
 * [Geometry API table](https://github.com/aescobarr/djangoref/blob/master/scripts/geometries_api.py)
 * [Toponims API table](https://github.com/aescobarr/djangoref/blob/master/scripts/toponims_api.py)
 * [Toponim versions API table](https://github.com/aescobarr/djangoref/blob/master/scripts/toponimsversio_api.py)

To run these scripts, perform the following steps (we assume that the user that owns the Georef project folder is called georef):
```bash
# become georef
su georef
# go to Georef project folder 
cd /home/georef/georef
# activate georef python virtual environment (we assume it's called georef)
workon georef
# execute each script
python scripts/geometries_api.py
python scripts/toponims_api.py
python scripts/toponimsversio_api.py
```
The auxiliary tables created are static, and the responsibility to refresh these tables falls on the system admin. The recommended approach is to create cron jobs to do so. More on this in the deployment section.

##### Starting the API and npm run scripts

You can start the API by issuing the following command from the API root folder:
```bash
NODE_ENV=[environment_name] node app.js
```
Where [environment_name] is one of the environments described in the config file. If the environment_name supplied is not found in the config file, default env is used.

For dev, we recommend using the dev npm run script, which is invoked like this:
```bash
npm run devstart
```
This initiates the app using the development environment, using the [Node.js inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/).

There are two additional scripts defined in package.json:
```bash
npm run test
```
Runs the [Mocha](https://mochajs.org/) test suite for this app.
```bash
npm run lint
```
Runs a linter against the source files. The rules are defined in .eslintrc.json, feel free to make them tighter or looser according to your preferences.

## The API itself

This is a list of all API endpoints, with a brief explanation of which HTTP method is expected, associated parameters and expected results.

### GET '/api/auth'

Parameters:

| Name | Mandatory? | Possible values  | 
|------|------------|------------------|
| user |     yes    | A valid username |
| pwd  |     yes    | A valid password |
  

This is the authentication endpoint. Authentication uses JSON Web Token: i.e. the authentication endpoint receives a password and username which is verified against the django auth_user table. If the proposed username/password combination is valid, auth supplies a Token which can be presented in the header in any access to an API endpoint. All other API endpoints will validate this token and grant or refuse access accordingly.

get '/api/toponimspartnom'

get '/api/tipustoponim'

get '/api/toponimsgeo'

get '/api/toponim'

get '/api/arbre'

get '/api/comment'

post '/api/comment_new'

post '/api/comment_edit'

post '/api/comment_delete'


## Running the tests

All tests validate and pull results from a test database, so the first thing we need to do is create this test database and fill it with test data. To simplify things, we will do everything as the postgres user but you could create a separate user to perform the tests with; just remember to assign the appropiate permissions so it can read and access the test database without problems.

Create a test PostgreSQL database. In this example we'll call it georef_api_test. From the shell, as postgres user do:
```bash
createdb georef_api_test
```

We need to enable this new database spatially, we do it like so:
```bash
# log to the database using your postgres user
psql -U postgres -W -d georef_api_test
# once in psql interactive shell, enable Postgis in the current database
create extension postgis;
create extension postgis_topology;
# go back to shell
\q
```

Finally, restore the test database provided in the repo georef_test.sql. From the shell type:
```bash
psql -U postgres -W -d georef_api_test -f georef_test.sql
```
This will create all the needed tables and fill in test data.

Don't forget to create a test entry in config.js, with the necessary credentials to connect to the database. The mock data include a test user with a weak password. The 'test' entry should look something like this:
```javascript
test: {
  secret: 'some_secret',
  database_host: 'localhost',
  database_port: 5432,
  database_name: 'georef_api_test',
  database_user: 'postgres', 
  database_password: 'postgres_user_password', //Put here your own password
  test_user_name: 'georef_api', //You don't need to change this. This user already exists in the mock data
  test_user_pwd: 'secret', //You don't need to change this either. 
  running_port: 8080,
}
```

Finally, we run the tests from the shell with the npm run command. From the root folder of the Georef API project, type:
```bash
npm run test
```

The tests are predefined calls to the API endpoints. The tests should be successful if:
 * The test scripts can access the api normally
 * The api can connect to the database without problems
 * The results pulled from the database are consistent with the expected results

## Deployment

TODO!

## Built With

TODO!

## Contributing

TODO!

## Versioning

TODO!

## Authors

TODO!

## License

TODO!

## Acknowledgments

TODO!
