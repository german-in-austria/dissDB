# Diss DB

## Getting Started

### 1. Start a PostgreSQL container
like this:
`docker run --name my-postgres -e POSTGRES_PASSWORD=passwort -e POSTGRES_USER=user -e POSTGRES_DB=dissdb postgres`

Use ` -p 5432:5432` to expose a port for easy access through a GUI like pgAdmin.

### 2. Start the Diss DB App with a container-link and an exposed port
`docker run -p 3333:80 --env-file=.env --link my-postgres:postgres dioe/diss-db`

### 3. Setup the App/Database
run these commands from inside the container:
 - `python3.5 /home/docker/code/app/manage.py makemigrations`
 - `python3.5 /home/docker/code/app/manage.py migrate auth`
 - `python3.5 /home/docker/code/app/manage.py migrate`
 - `python3.5 /home/docker/code/app/manage.py createsuperuser`


#### Environment Variables
All the Environment Variables can be found in the [default.env](default.env) file.
