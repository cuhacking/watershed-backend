# Watershed (Under Construction :construction: :construction_worker:)

Watershed is a set of tools and APIs for managing events, such as a hackathon.

> In topography, a drainage divide, water divide, divide, ridgeline, **watershed**, water parting or height of land is elevated terrain that separates neighboring drainage basins. 
>
> – [Wikipedia](https://en.wikipedia.org/wiki/Drainage_divide)

## Getting Started
This project uses Yarn 2. In order to switch to Yarn 2, you'll need to run `yarn set version berry` (if you're on Yarn 1.22.0+).

This project is built on:
* Typescript
* Express
* TypeORM

## Running
Run `yarn` to install dependencies.

The package.json provides several useful commands for running the server:

* `yarn compile`: compiles the project

* `yarn build`: lints and compiles the project

* `yarn serve`: runs the compiled project

* `yarn lint`: lint the project

* `yarn start`: runs `build` and `serve`

* `yarn dev`: sets up the server for development (watches for changes)

## Configuration
Create a `.env` file in the root of your project with the following entries:
```
JWT_KEY=<some random key to be used for generating JWTs>
githubClientId=<your github client ID>
githubClientSecret=<your github client secret>
discordClientId=<your discord client ID>
discordClientSecret=<your discord client secret>
EXTERNAL_HOSTNAME=<the external hostname this will run on (e.g. http://localhost:8080, https://cuhacking.com)
FROM_EMAIL=<mailgun 'from' email>
MAILGUN_DOMAIN=<mailgun domain>
MAILGUN_API_KEY=<mailgun api key>
PASSWORD_RESET_LINK=<link to be sent in password reset email>
CONFIRM_LINK=<link to be sent in confirmation email>
CONFIRM_TEMPLATE=<path to email confirmation template file, relative to root. Should have {link} as a placeholder for the link to send>
PASSWORD_RESET_TEMPLATE=<path to password reset template file, relative to root. Should have {link} as a placeholder for the link to send>
RESUME_DIR=<path to store resume files>
SUBMISSION_DIR=<path to store submission repos>
```