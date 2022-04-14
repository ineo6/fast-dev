const { join } = require("path");
const getRepoInfo = require("git-repo-info");
const inquirer = require("inquirer");
const { yParser, execa, chalk } = require("./utils");
const exec = require("./utils/exec");
const getPackages = require("./utils/getPackages");
const isNextVersion = require("./utils/isNextVersion");

const cwd = process.cwd();
const args = yParser(process.argv.slice(2));
const lernaCli = require.resolve("lerna/cli");

function printErrorAndExit(message) {
  console.error(chalk.red(message));
  process.exit(1);
}

function logStep(name) {
  console.log(`${chalk.gray(">> Release:")} ${chalk.magenta.bold(name)}`);
}

async function release() {
  if (!args.skipGitStatusCheck && !args.publishOnly) {
    const gitStatus = execa.sync("git", ["status", "--porcelain"]).stdout;
    if (gitStatus.length) {
      printErrorAndExit(`Your git status is not clean. Aborting.`);
    }
  } else {
    logStep(
      "git status check is skipped, since --skip-git-status-check is supplied"
    );
  }

  let updated = null;

  if (!args.publishOnly) {
    // Get updated packages
    logStep("check updated packages");
    const updatedStdout = execa.sync(lernaCli, ["changed"]).stdout;
    updated = updatedStdout
      .split("\n")
      .map(pkg => {
        if (pkg === "app") return null;
        else return pkg.split("/")[1];
      })
      .filter(Boolean);

    if (!updated.length) {
      printErrorAndExit("Release failed, no updated package is updated.");
    }

    // Clean
    logStep("clean");

    // Build
    if (!args.skipBuild) {
      logStep("build");
      await exec("npm", ["run", "build:deps"]);
    } else {
      logStep("build is skipped, since args.skipBuild is supplied");
    }

    // Bump version
    logStep("bump version with lerna version");
    await exec(lernaCli, [
      "version",
      "--exact",
      "--no-commit-hooks",
      "--no-git-tag-version",
      "--no-push"
    ]);

    const currVersion = require("../lerna").version;

    // Commit
    const commitMessage = `release: v${currVersion}`;
    logStep(`git commit with ${chalk.blue(commitMessage)}`);
    await exec("git", ["commit", "--all", "--message", commitMessage]);

    // Git Tag
    logStep(`git tag v${currVersion}`);
    await exec("git", ["tag", `v${currVersion}`]);

    // Push
    logStep(`git push`);
    const { branch } = getRepoInfo();
    await exec("git", ["push", "origin", branch, "--tags"]);
  }

  // Publish
  const ignorePkgs = ["app"];
  const packages = getPackages().filter(pkg => !ignorePkgs.includes(pkg));

  const pkgs = args.publishOnly ? packages : updated;
  logStep(`publish packages: ${chalk.blue(pkgs.join(", "))}`);
  const currVersion = require("../lerna").version;
  const isNext = isNextVersion(currVersion);

  for (const [index, pkg] of pkgs.entries()) {
    const pkgPath = join(cwd, "packages", pkg);
    const { name, version } = require(join(pkgPath, "package.json"));
    if (version === currVersion) {
      console.log(
        `[${index + 1}/${pkgs.length}] Publish package ${name} ${
          isNext ? "with next tag" : ""
        }`
      );
      let cliArgs = isNext ? ["publish", "--tag", "next"] : ["publish"];
      // one-time password from your authenticator
      if (args.otp) {
        const { otp } = await inquirer.prompt({
          name: "otp",
          type: "input",
          message: "This operation requires a one-time password:",
          validate: msg => !!msg
        });
        cliArgs = cliArgs.concat(["--otp", otp]);
      }
      const { stdout } = execa.sync("npm", cliArgs, {
        cwd: pkgPath
      });
      console.log(stdout);
    }
  }

  logStep("done");
}

release().catch(err => {
  console.error(err);
  process.exit(1);
});
