# Project Title

Georef API - An express app that exposes [Georef](https://github.com/aescobarr/djangoref) data through a RestFul API. Georef API is built using [Express](https://expressjs.com/).

This project is tightly related to [Georef](https://github.com/aescobarr/djangoref) and is not meant to work as a separate piece since it uses Georef underlying database.

## Getting Started

These instructions will help you set up a basic working development environment on a Ubuntu 18.04 LTS system. It assumes [Git](https://git-scm.com/) is installed and running in the host machine.

Clone the repository, and run

npm install

To run the app, do

node app.js

(or some variant)


### Prerequisites

We assume that Georef is installed in its dev form in the machine, with all its dependencies. Take a look at the [docs](https://github.com/aescobarr/djangoref/blob/master/README.md).

Express is a [Node.js](https://nodejs.org/) framework, so we need to install Node. It can be installed from packages:
```
sudo apt install nodejs
```

We also need the [Node.js package manager](https://www.npmjs.com/), which can also be installed from packages:

```
sudo apt install npm
```

### Installing

Clone the repository like this:
```
git clone https://github.com/aescobarr/djangoref_api.git
```

Then from the newly cloned folder we need to install the dependencies using npm:
```
npm install
```

#### Previous steps

Before starting the app, we need to:

* Create an API user in Georef
* Fill the config file with the appropiate values
* Create the API tables in our Georef setup

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
  secret: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', //a long convoluted string used internally in auth stuff
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

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
