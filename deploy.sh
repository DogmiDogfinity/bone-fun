dfx stop
dfx start --background --clean

export ENVIRONMENT=local
dfx identity use default

echo "start build canisters..."
./build.sh bone_dog src/bone_dog/bone_dog.did
dfx generate
echo "build canisters success"
OWNER="principal \"$(dfx identity get-principal)\""
UserId="aaaaa-aa"
userid="principal \"$UserId\""

dfx deploy bone_main
bone_main_id="principal \"$(dfx canister id bone_main)\""

dfx canister deposit-cycles 40_000_000_000_000 $(dfx canister id bone_main)
