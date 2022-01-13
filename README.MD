# Ali-Bey API

Ali-Bey API - Exposes [Ali-Bey](https://github.com/aescobarr/mcnb-alibey) data through a REST API, built using [Express](https://expressjs.com/).

This project is tightly related to [Ali-Bey](https://github.com/aescobarr/mcnb-alibey) and is not meant to work as a separate piece since it uses Ali-Bey's underlying database.

## Getting Started

These instructions will help you set up a basic working development environment on a Ubuntu 18.04 LTS system. It assumes [Git](https://git-scm.com/) is installed and running in the host machine.


### Prerequisites

We assume that Ali-Bey is installed in its dev form in the machine, with all its dependencies. Take a look at the [docs](https://github.com/aescobarr/mcnb-alibey/blob/master/README.md).

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
git clone https://github.com/aescobarr/mcnb-alibey-api.git
```

Then from the newly cloned folder we need to install the dependencies using npm:
```bash
npm install
```

#### Previous steps

Before starting the app, we need to:

* Create an API user in Ali-Bey
* Fill the config file with the appropiate values
* Create the API tables in our Ali-Bey setup

##### API User

The API User is a normal Ali-Bey user. To create it log on to your current Ali-Bey install with and admin user and create a new user. Then, go to the public.auth_user table in the PostgreSQL database and look up your user. Copy the fields user_name and password, you will need to put these values in the test section of the config file.

##### Config files

In the freshly cloned repo we have an example configuration file [config.js.example](https://github.com/aescobarr/mcnb-alibey-api/blob/master/config.js.example). This file contains a config javascript object with the following structure:
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
  database_host: 'localhost',             //ip address of the machine hosting the Ali-Bey PostgreSQL database
  database_port: 5432,                    //The port in which PostgreSQL listens for incoming connections (usually 5432)
  database_name: 'my_database',           //The name of the Ali-Bey PostgreSQL database 
  database_user: 'my_user',               //The name of the user which will connect to the database
  database_password: 'my_password',       //The password of the above user
  test_user_name: 'test_user',            //This key is only used in the 'test' enviroment. It has to be the user_name field defined in the auth_user Postgresql table
  test_user_pwd: 'test_password',         //This key is only used in the 'test' enviroment. It has to be the password field defined in the auth_user Postgresql table
  running_port: 8080,                     //The API listens to connections in this port
}
```

##### API Tables

The API uses certain denormalized tables to accelerate some queries. These API tables are created via scripts that are included in the Ali-Bey project. The scripts are:
 * [Geometry API table](https://github.com/aescobarr/mcnb-alibey/blob/master/scripts/geometries_api.py)
 * [Toponyms API table](https://github.com/aescobarr/mcnb-alibey/blob/master/scripts/toponims_api.py)
 * [Toponym versions API table](https://github.com/aescobarr/mcnb-alibey/blob/master/scripts/toponimsversio_api.py)

To run these scripts, perform the following steps (we assume that the user that owns the Ali-Bey project folder is called alibey):
```bash
# become alibey
su georef
# go to Ali-Bey project folder 
cd /home/alibey/georef
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

## API Endpoints

This is a list of all API endpoints, with a brief explanation of which HTTP method is expected, associated parameters and expected results.

### GET '/api/auth'

This is the authentication endpoint. Authentication uses JSON Web Token: i.e. the authentication endpoint receives a password and username which is verified against the django auth_user table. If the proposed username/password combination is valid, auth supplies a Token which can be presented in the header in any access to an API endpoint. All other API endpoints will validate this token and grant or refuse access accordingly.

Parameters:
* user (mandatory) - a valid username
* pwd (mandatory) - a valid password
  

#### Example:

GET /api/auth.htm?user=georef_api&pwd=secret

```json
{
    "success": true,
    "message": "OK",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTU3MDE5MDQ1NywiZXhwIjoxNTcwMjc2ODU3fQ.doHdM5p0V9qUoRPax0tVdOLukO1Sph2D2kgustbp83A"
}
```
The obtained token must be included in the header of all calls, with the key "token" or "x-access-token" and the value returned in the "token" key of a valid response to auth.

### GET '/api/toponimspartnom'

Obtains a list of toponyms in json format. By default, toponyms are ordered by name.

Parameters:
* Sorting:
    * sort (optional) - Possible values are 'data'/'nom'/'aquatic'/'tipus'.
    * dir (optional) - 'desc' for descending, 'asc' for ascending.
* Pagination:
    * results (optional) - It is an integer, and it limits the number of returned results.
    * startIndex (optional) - Also an integer. Index of the first returned result inside the set of all available results.
* Filter:
    * idtipus (optional) - This is a filter parameter. If supplied with a valid idtipus, it will only return toponyms of the specified type.
    * query (optional) - This is a filter parameter. It will be partially matched against the toponym name.

#### Example:

GET /api/toponimspartnom?results=20&dir=desc&query=urgen
```json
{
    "totalRecords": 1,
    "success": true,
    "recordsReturned": 1,
    "dir": "desc",
    "sort": "nom",
    "records": [
        {
            "id": "54455252455354524530343130335A757267656E6133302F31302F32303036",
            "nomtoponim": "Zurgena",
            "nom": "Zurgena - Espanya (municipi) (Terrestre)",
            "aquatic": false,
            "tipus": "municipi",
            "idtipus": "mz_tipustoponim_2",
            "datacaptura": "2012-10-15T22:00:00.000Z",
            "coordenadaxcentroide": -2.031512,
            "coordenadaycentroide": 37.360383,
            "incertesa": 8080.84
        }
    ]
}
```

### GET '/api/tipustoponim'

Returns a list of toponym types, ordered by name.

Parameters:
* Sorting:    
    * dir (optional) - 'desc' for descending, 'asc' for ascending.
* Pagination:
    * results (optional) - It is an integer, and it limits the number of returned results.
    * startIndex (optional) - Also an integer. Index of the first returned result inside the set of all available results.

#### Example:

GET /api/tipustoponim?results=5&startIndex=5
```json
{
    "totalRecords": 33,
    "success": true,
    "recordsReturned": 5,
    "startIndex": "5",
    "records": [
        {
            "id": "mprieto203233081715184642",
            "nom": "ciutat autònoma"
        },
        {
            "id": "mz_tipustoponim_3",
            "nom": "comarca"
        },
        {
            "id": "furibe86507472442252703205",
            "nom": "comtat"
        },
        {
            "id": "mprieto18104846131021302470",
            "nom": "comuna"
        },
        {
            "id": "mz_tipustoponim_5",
            "nom": "comunitat autònoma"
        }
    ]
}
```

### GET '/api/toponimsgeo'

Given an input geometry of type polygon specified in [Well Known Text format](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry), returns all toponyms contained in this geometry by using the Postgis [ST_WITHIN](https://postgis.net/docs/ST_Within.html) function.

Parameters:
* wkt (mandatory) - A string containing the WKT representation of a polygon. The polygon coordinates must be specified in WGS84 latitude longitude pairs (see example)

#### Example:

GET /api/toponimsgeo.htm?wkt=POLYGON((-2.384033203125005 37.022291107711915,-2.498016357421943 37.02558034854766,-2.5117492675781863 36.932330061503755,-2.4018859863281485 36.847757665258285,-2.2810363769531334 36.88071909009696,-2.2082519531250164 36.99706886366319,-2.278289794921957 37.05956083025189,-2.384033203125005 37.022291107711915))
```json
{
    "totalRecords": 5,
    "success": true,
    "message": "OK",
    "records": [
        {
            "id": "furibe227145761585268611058",
            "nom": "Viator - Espanya (municipi) (Terrestre)",
            "aquatic": false,
            "tipus": "municipi",
            "incertesa": 4022.44,
            "nomToponim": "Viator",
            "dataCaptura": "2012-10-15T22:00:00.000Z",
            "coordXCentroide": -2.399692,
            "coordYCentroide": 36.896489
        },
        {
            "id": "furibe227106906841543311042",
            "nom": "Turrillas - Espanya (municipi) (Terrestre)",
            "aquatic": false,
            "tipus": "municipi",
            "incertesa": 4957.82,
            "nomToponim": "Turrillas",
            "dataCaptura": "2012-10-15T22:00:00.000Z",
            "coordXCentroide": -2.261681,
            "coordYCentroide": 37.02636
        },
        {
            "id": "544552524553545245303430373450656368696E6133302F31302F32303036",
            "nom": "Pechina - Espanya (municipi) (Terrestre)",
            "aquatic": false,
            "tipus": "municipi",
            "incertesa": 6407.03,
            "nomToponim": "Pechina",
            "dataCaptura": "2012-10-15T22:00:00.000Z",
            "coordXCentroide": -2.398777,
            "coordYCentroide": 36.941614
        },
        {
            "id": "544552524553545245303430323442656E61686164757832372F31302F32303036",
            "nom": "Benahadux - Espanya (municipi) (Terrestre)",
            "aquatic": false,
            "tipus": "municipi",
            "incertesa": 4837.35,
            "nomToponim": "Benahadux",
            "dataCaptura": "2012-10-15T22:00:00.000Z",
            "coordXCentroide": -2.471333,
            "coordYCentroide": 36.91781
        },
        {
            "id": "544552524553545245303430373852696F6A6133302F31302F32303036",
            "nom": "Rioja - Espanya (municipi) (Terrestre)",
            "aquatic": false,
            "tipus": "municipi",
            "incertesa": 4554.12,
            "nomToponim": "Rioja",
            "dataCaptura": "2012-10-15T22:00:00.000Z",
            "coordXCentroide": -2.433998,
            "coordYCentroide": 36.970119
        }
    ]
}
```

### GET '/api/toponim'

General detal view for toponym. Given an id as parameter, returns the detailed information of a single toponym.

Parameters:
* id(mandatory) - A string containing a valid toponym id. Multiple comma separated toponym ids are allowed.

#### Example:

GET /api/toponim.htm?id=mlozano3502127189329321892
```json
{
    "totalRecords": 1,
    "success": true,
    "message": "OK",
    "recordsReturned": 1,
    "id": "mlozano3502127189329321892",
    "aquatic": "No",
    "nomToponim": "Àfrica Occidental",
    "tipus": "accident geogràfic",
    "nom": "Àfrica Occidental -  (accident geogràfic) (Terrestre)",
    "versions": [
        {
            "id": "mlozano3502127190772681893",
            "nom": "Àfrica Occidental -  (accident geogràfic) (Terrestre)",
            "nomToponim": "Àfrica Occidental",
            "tipus": "accident geogràfic",
            "versio": 1,
            "qualificadorversio": null,
            "recursCaptura": null,
            "sistrefrecurs": null,
            "dataCaptura": "Data no establerta",
            "coordXOriginal": "",
            "coordYOriginal": "",
            "coordz": null,
            "incertesaz": null,
            "georeferenciatPer": "Lozano, María Fernanda",
            "observacions": "",
            "coordXCentroide": 0.800386514397298,
            "coordYCentroide": 13.6410663264243,
            "incertesaCoord": 17.9723950938248,
            "idtoponim": "mlozano3502127189329321892"
        }
    ],
    "llinatge": [
        {
            "id": "mlozano3506592866400701903",
            "nom": "Àfrica"
        }
    ]
}
```

### GET '/api/arbre'

Toponyms have a tree structure; each toponym has one or more children toponyms to indicate a "contains" or "belongs to" relationship. For instance, Western Africa is a child of Africa. This endpoint lists all children from a given root. 

Parameters:
* root(mandatory) - A string containing a valid toponym id which indicates the root of the tree which will be returned
* max_depth(optional) - The depth parameter is an integer that limits the depth of the tree. If max_depth=0, only the toponym identified by the 'root' parameter will be returned. If max_depth=1, the toponym indicated by root and its direct children. If max_depth=2, toponym indicated by root, its direct children and the children of direct children (grandchildren?), etc.

#### Example:

GET /api/arbre.htm?root=mlozano3506592866400701903&max_depth=1
```json
{
    "records": {
        "id": "mlozano3506592866400701903",
        "nom": "Àfrica -  (continent) (Terrestre)",
        "aquatic": false,
        "tipus": "continent",
        "idtipus": "furibe53448869648908722504",
        "datacaptura": null,
        "coordenadaxcentroide": 19.6420318201855,
        "coordenadaycentroide": 4.94129223848315,
        "incertesa": 40.5450511588554,
        "nomToponim": "Àfrica",
        "fills": [ //The children are here
            {
                "id": "mlozano3502127189329321892",
                "nom": "Àfrica Occidental -  (accident geogràfic) (Terrestre)",
                "aquatic": false,
                "tipus": "accident geogràfic",
                "idtipus": "mz_tipustoponim_7",
                "datacaptura": null,
                "coordenadaxcentroide": 0.800386514397298,
                "coordenadaycentroide": 13.6410663264243,
                "incertesa": 17.9723950938248,
                "nomToponim": "Àfrica Occidental",
                "fills": []
            },
            /* A lot of ommitted results */
            /* ... */
            {
                "id": "oandres182343084713568095",
                "nom": "Uganda - Uganda (estat) (Terrestre)",
                "aquatic": false,
                "tipus": "estat",
                "idtipus": "mz_tipustoponim_6",
                "datacaptura": null,
                "coordenadaxcentroide": 32.3899055996886,
                "coordenadaycentroide": 1.27593176671081,
                "incertesa": 3.85662190899941,
                "nomToponim": "Uganda",
                "fills": []
            }
        ]
    }
}
```

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

Finally, we run the tests from the shell with the npm run command. From the root folder of the Ali-Bey API project, type:
```bash
npm run test
```

The tests are predefined calls to the API endpoints. The tests should be successful if:
 * The test scripts can access the api normally
 * The api can connect to the database without problems
 * The results pulled from the database are consistent with the expected results

## Deployment

In production, we recommend using some sort of process manager to control the Node.js app. We like [PM2](http://pm2.keymetrics.io/), and also we recommend using some front server like [Apache](https://httpd.apache.org/) or [Nginx](https://www.nginx.com/) and tunnel the access to the app as a proxy through these servers.

## Built With

* [Node.js](https://nodejs.org) 
* [Express](https://expressjs.com/)

## Authors

Developed by [Agustí Escobar](https://github.com/aescobarr).

## License

This software is licensed under [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

