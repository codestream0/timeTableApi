# File to auto configure typescript project
# make sure NODE is installed
#   init node project
npm init -y
# dev dependencies
npm i -D typescript ts-node
# typescript configs
touch tsconfig.json
echo "{
    \"compilerOptions\": {
      \"module\": \"commonjs\",
      \"noImplicitReturns\": true,
      \"noUnusedLocals\": true,
     \"outDir\": \"lib\",
      \"sourceMap\": true,
      \"strict\": true,
      \"target\": \"es2017\",
      \"resolveJsonModule\": true,
      \"skipLibCheck\": true,
      \"lib\": [\"es5\", \"es6\", \"dom\", \"dom.iterable\"]
    },
    \"compileOnSave\": true,
    \"include\": [
      \"src\"
    ]
  }
  " >> tsconfig.json
#   echo " \"scripts\": {
#       \"test\": \"echo \"Error: no test specified\" && exit 1\",
#     \"scripts\": \"tsc\"
#   }, " >> package.json

mkdir src 
cd src 
touch index.ts 
echo "console.log(\"hello TS\");" >> index.ts

cd ..

echo "Setup done ! ... enjoy 😉";
rm -rf typescript_config.sh;