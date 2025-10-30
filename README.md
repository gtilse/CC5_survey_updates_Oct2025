# Client Culture 

Client Culture is an app built for professionals, such as lawyers and accountants, to ask their customers feedback on how they perform using the [Net Promotor Score (NPS)](https://en.wikipedia.org/wiki/Net_Promoter).

This app is built with:

- Angular 8.x
- PHP
- AWS

Contributors:

- Greg Tilse - Founder - [email](mailto:gtilse@clientculture.com.au)
- Tabraiz - Lead Software Engineer - [Github](https://github.com/Tabraiz) (tjavaid@clientculture.com.au)
- Jan Werkhoven - Advisor [Github](https://github.com/janwerkhoven) (jw@floatplane.dev)
- Tony - Developer (gbgodlike1211@gmail.com)

---

## Setting up your local

Though these instructions are written for **Mac OS**, the approach will be the same for **Linux** and **Windows**. The only thing that may differ are the tools. If you need help getting set up, reach out to Tabraiz or Jan (see above emails).

### 1. Install Brew

In your terminal, check if you have [Brew](https://brew.sh/):

```
brew -v
```

If no version appears, install it:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

### 2. Install Git

Check if you have [Git](https://git-scm.com):

```
git --version
```

If not, install it:

```
brew install git
```

### 3. Install PHP

Check if you have [PHP](https://www.php.net/):

```
php -v
```

We need PHP v5.6.x or higher. If not, install or upgrade it:

```
brew install php
brew upgrade php
```

### 4. Install NVM

Check if you have [Node Version Manager](https://github.com/nvm-sh/nvm):

```
nvm --version
```

If not, install it:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

### 5. Clone this repo

Clone this code repository to your local using [SSH](https://docs.github.com/en/enterprise/2.15/user/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent):

```
git clone git@github.com:gtilse/ClientCulture4.git
```

Alternatively use HTTPS (not recommended):

```
git clone https://github.com/gtilse/ClientCulture4.git
```

Move into the newly created directory:

```
cd ClientCulture4/
```

### 6. Install Node

To make sure everyone in our team uses the exact same version of [Node](https://nodejs.org/en/), we have locked down the Node version with [NVM](https://github.com/nvm-sh/nvm) in the `.nvmrc` file. NVM allows you to have multiple Node projects on your device, all locked down to different version of Node.

To install and use the Node version specified in this project, run the following command:

```
nvm install
```

### 7. Install our Node dependencies

With Node installed you'll have access to [NPM](https://www.npmjs.com/) and you can install the Node dependencies our app depends on:

```
npm install
```

### 8. Install our PHP dependencies

Go into `src/api/` and install all PHP dependencies:

```
cd src/api/
php composer.phar install
cd ../../
```

### 9. Sanity check

If all was installed, you should be able to fire up Angular:

```
npm run start
```

Open [http://localhost:4200](http://localhost:4200) and you should see the login screen of Client Culture.

If yes, you're ready to start coding! :muscle:

---

### Running local server

> ### This completes the setup part of the Client Culture application. Next we discuss running the application on your machine.

There are two approaches – set up locally with a test database (recommended) or connect to the AWS EC2 instance.

1. Set up locally with a test database
Contact Greg Tilse for a copy of a test database to work with using MySQLWorkbench (mailto:gtilse@clientculture.com.au).


2. Connect to the AWS EC2 instance
- Locally map a port to AWS EC2 instance by running the command (note – at present we are not using this approach)

```
ssh -i KlientKulture.pem -Ng  -L 3308:127.0.0.1:3306 ec2-user@ec2-13-55-139-221.ap-southeast-2.compute.amazonaws.com
```

Please note that you would require the SSH key file for this. Please contact [Greg Tilse](mailto:gtilse@clientculture.com.au) for access to the key file.

Open the file `<project-folder>/src/api/common.php`. At the top of the file set `DEV=TRUE` and in the **If** block set the following code and save the file:

```php
if(DEV) {
  define("MYSQL_PORT",3308);
  define("MYSQL_HOST","127.0.0.1");
}
```

This will set the MYSQL port to 3308 which is in turn mapped to the AWS EC2 instance.

- Open the file `<project-folder>/src/environments/environment.ts` which looks like below:

```javascript
export const environment = {
  production: false,
  rootPath: "http://localhost/~Tabraiz/ClientCulture/src",
  apiPath: "http://localhost/~Tabraiz/ClientCulture/src/api/root.php",
  fileUploadAPIPath:
    "http://localhost/~Tabraiz/ClientCulture/src/api/misc/upload.php",
  csvFileProcessPath:
    "http://localhost/~Tabraiz/ClientCulture/src/api/misc/process_csv.php",
};
```

You would need to set the local path to the PHP code that runs on `localhost`. Please ensure that all paths are set to valid locations and save this file.

> ### This completes the code setup part of the application. Next step is to run the application locally on your machine.

- Open terminal and navigate to `<project-folder>`. Run the command `ng serve --open --live-reload=false`. This may take a bit of time and if all goes well a new browser window/tab will open with the application login page displayed.

- To build the application for production run the command `ng build --prod --buildOptimizer=false`. Note the `buildOptimizer=false` flag which must be set when building for production as some older user interface components do not work when this flag is set to true.

> ### This is it!!! Good luck.

### Git workflow

These are the branches we use:

- `production` is what users now see in production
- `master` is what devs work on, it's often ahead of `production`
- `feature/...` is a feature you are working on, branched of `master`
- `fix/...` is a fix you are working on, branched of `master`

To start a new feature:

```
git checkout master
git pull
git checkout -b feature/foo
git push --set-upstream origin feature/foo
```

To commit:

```
git add -p
git commit -m "Good message"
git push
```

Once your feature is complete, make a pull request (PR) to `master`:

```
git hub pull-request master feature/foo
```

Tip: Use [hub CLI](https://github.com/github/hub) to speed up your workflow.

Once you have a PR, please have it reviewed and approved by another dev, ideally Tabraiz. With PRs, other devs get a chance to learn from your work, ask questions and will spot things you have missed. If nobody has time to review, review yourself, then merge ahead. Avoid merging branches from command line. Using PRs gives us a clean track record of everything that went into `master` and why (the PR description).

Finally, when it's a good time to release all new features and bugs (e.g. when few users are online), then bring `production` up-to-date with `master` with another PR.

```
git hub pull-request production master
```

Ideally, merging into `production` automatically runs tests and deploys to our remote server. But we aren't there yet. So please run the deploy commands locally.

```
git checkout production
git pull
./deploy.sh ???
```

### Local database

# Testing

Warning: We don't have tests yet!

To run unit tests:

```
ng test
```

To run integration tests:

```
ng e2e
```

# Production

Warning: We don't yet have a deploy pipeline.

To deploy:

```
./deploy.sh ???
```

To roll back:

```
./rollback.sh ???
```

# Project Status Update

Update date – 23 August 2020

Components:
Version 1 was Klient Kulture. The company then changed its name to Client Culture.
Version 3 is the version in production used by users.
Version 4.1 is in development. Tabraiz has done significant development on v4.1.
Assisted now by Tony who has been taking the lead. Tony has mainly been working on implementing new design changes (see Figma 4.1). eg New "feedback" page and  changes to dashboard.
Survey development: Version 4 has significant changes to the survey component of the app developed by Tabraiz. 

