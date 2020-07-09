# Blockchain's PrAgmatic  Knowledge Explorer  (BAKE)

BAKE is a tool for bootstrapping knowledge of tools being used in Blockchain-based projects on top of Neo4J Graph Database. In BAKE, you can register new information through exposed JSON APIs or through importing fixture/predefined-csv format in CLI. You can explore the data through exposed JSON APIs or through Neo4J clients.

## Getting started

To set up and configure the tool, please ensure the following packages and configuration are prepared:
- Python 3.8.0
- Docker or Neo4J database server (tested with 3.5.14)

### Starting neo4j host

Execute `docker run -p=7474:7474 -p=7687:7687 --volume=data:/data --volume=logs:/logs neo4j:3.5.14` to start the docker server locally.

The new neo4j via Docker would need to setup new pass word. To setup, visit neo4j at `localhost:7474` and fill username and password as: `neo4j` and `neo4j`, and then fill in new password `123123123`.

### Prepare and start the server

1. Exec `pyenv virtualenv 3.8.0 bake` (alternatively, following other ways to setup local virtualenv)
2. Exec `pip install -r requirements.txt`
3. Exac `python manage.py migrate`
3. Exec `python manage.py install_labels` to install/apply labels to neo4j DB
5. Exec `python manage.py runserver 0.0.0.0:8080`
6. Access API docs at `http://localhost:8080/api/docs/`

### Directory structure

The source code consists of the following main folders:

- `bake/bake`:
  - `wsgi.py` consists of wsgi app configuration
  - `settings.py` app settings and connecting URL definition to Neo4J DB
- `bake/core`:
  - `management/commands`: consists of current CLI scripts and new commands can be added here
  - `migrations`: for app management database migrations (not needed for the current version)
  - `models.py`: ORM wrappers definition for Neo4J objects
  - `serializers.py`: JSON Serializer for ORM wrapper, then being used in Rest APIs
  - `urls.py`: URL mappers
  - `utils`: utility functions for reuse inside app
  - `views.py`: data manipulation and controlling logic
- `data.csv`: data collected from respondents for boostrapping with real use cases
- `fixtures.json`: pre-defined generic data for bootstrapping generic data
- `requirements.txt`: python packages used in BAKE
- `fabfile.py`: deployment script

## Staging/Production deployment

The following setting has been used to deploy staging-like version.

### Prerequisites

- Neo4J Graph Database 3.5.14
- Python 3.8.0
- Nginx
- Ubuntu 18.04
- Gunicorn
- Ports opened at `80` for APIs and `7474` for Neo4J connection

### Init the server configuration

#### Steps

```
sudo apt install python3.8
sudo apt-get install python3-pip
pip3 install virtualenv virtualenvwrapper

mkdir bake
cd bake
mkvirtualenv -p python3.8 venv
workon venv
git clone git@github.com:rdsea/kalbi.git ./repo
cd repo/bake
pip install -r requirements.txt
python manage.py migrate

sudo vim /etc/systemd/system/bake.service # and use the correct configuration template
sudo vim /etc/systemd/system/bake.socket # and use the correct configuration template
sudo systemctl daemon-reload
sudo systemctl enable bake.socket
sudo systemctl enable bake.service
sudo systemctl start bake.socket
sudo systemctl start bake.service

sudo vim /etc/nginx/site-enabled/bake # and use the correct configuration template


# The following should be run when there is new update
NEO4J_BOLT_URL=correct_URL_goes here python manage.py install_labels
NEO4J_BOLT_URL=correct_URL_goes here python manage.py seed
NEO4J_BOLT_URL=correct_URL_goes here python manage.py import

```

#### Server configuration file templates
Nginx

```
server {
    listen 80;
    server_name ts.reversely.fi;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        root /home/deploy/bake/repo/bake;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/bake.sock;
    }
}
```

Systemd BAKE service

```
[Unit]
Description=bake daemon
Requires=bake.socket
After=network.target

[Service]
User=deploy
Group=www-data
Environment="NEO4J_BOLT_URL=correct url"
WorkingDirectory=/home/deploy/bake/repo/bake
ExecStart=/home/deploy/.envs/venv/bin/gunicorn \
          --access-logfile - \
          --workers 2 \
          --bind unix:/run/bake.sock \
          bake.wsgi:application

[Install]
WantedBy=multi-user.target
```

Systemd BAKE socket

```
[Unit]
Description=bake socket

[Socket]
ListenStream=/run/bake.sock

[Install]
WantedBy=sockets.target
```

### Running the deployment

Make sure:
- the public key is setup in the server
- `fabfile.py` use the correct IP address

Exec `fab dd-stag`

## FAQs

1. Server configuration

```
# socket and services
etc/systemd/system/bake.socket
etc/systemd/system/bake.service
# nginx configuration
/etc/nginx/sites-enabled/bake

```

2. Applying new labels

`NEO4J_BOLT_URL='bolt://neo4j:123123123@localhost:7687' python manage.py install_labels`

3. How to register/update information in the server

Script to generate static data:

```
python manage.py seed
```

Script to import from survey:
```
python manage.py import 
```

## Built With

* [Python](https://www.python.org/) - Runtime Environment
* [Pip](https://pypi.org/project/pip/) - Python package installer
* [Django](https://www.djangoproject.com/) - Web framework
* [Swagger](https://swagger.io/) - API documentation
* [Neo4J](https://neo4j.com/)
* [Docker](https://www.docker.com/)

## License
Copyright 2019-, by Service Engineering Analytics team (http://rdsea.github.io/).
Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
