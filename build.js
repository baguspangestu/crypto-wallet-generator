const { execSync } = require("child_process");
const { name, version, pkg } = require("./package.json");
const fs = require("fs");

const buildDir = "build";

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

console.log(`Building Release for ${pkg.targets.join(", ")} ...`);

pkg.targets.forEach((target) => {
  const targets = target.split("-");
  const platform = targets[1] + "-" + targets[2];
  const outputName = `${name}-v${version}-${platform}`;
  const outputPath = `${buildDir}/${outputName}`;

  execSync(`npx pkg . --targets ${target} --output ${outputPath}`, {
    stdio: "inherit",
  });
});

console.log(`Build completed.`);
