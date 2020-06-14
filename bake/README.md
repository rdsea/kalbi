# Blockchain's PrAgmatic  Knowledge Explorer  (BAKE)

## How to dev

### Starting neo4j host

Exec `docker run -p=7474:7474 -p=7687:7687 --volume=data:/data --volume=logs:/logs neo4j:3.5.14`

Filling username and password as: `neo4j` and `neo4j`, and then fill in new password `123123123`

### Prep and start the server

1. Exec `pyenv virtualenv 3.8.0 bake`
2. Exec `pip install -r requirements.txt`
3. Exec `python manage.py install_labels` to install labels to neo4j DB
4. Exec `python manage.py runserver 0.0.0.0:8080`
5. Access API docs at `http://localhost:8080/api/docs/`

### survey link

old link: https://ductm310.typeform.com/to/sSZAiJ
new link: https://www.surveymonkey.com/r/8P568WG

### How to register/update information

Script to generate static data:

```
python manage.py seed
```

Script to import from survey:
```
python manage.py import 
# TODO: need to add more
```


### Host credentials and FAQs

```
Domain: ts.reversely.fi
API docs: http://ts.reversely.fi/api/docs/

user: deploy
pass: ****
```

1. Setting venv

```
cd /home/deploy/thesis/SE-in-blockchain/src/bake
workon venv

```

2. Server configuration

```
# socket and services
etc/systemd/system/thesis.socket
etc/systemd/system/thesis.service
# nginx configuration
/etc/nginx/sites-enabled/thesis

```

3. Applying new labels

`NEO4J_BOLT_URL='bolt://neo4j:123123123@localhost:7687' python manage.py install_labels`
