#!/usr/bin/env bash

PAC_NAME=$1
DID_PATH=$2

if [[ -z $PAC_NAME ]]
then
  echo "running build all..."
  cargo run --bin $PAC_NAME --features $ENVIRONMENT
  cargo build --target wasm32-unknown-unknown --release --features $ENVIRONMENT
else
  cargo run --bin $PAC_NAME --features $ENVIRONMENT > src/$PAC_NAME/$PAC_NAME.did
  cargo build --target wasm32-unknown-unknown --release -p $PAC_NAME --features $ENVIRONMENT
  version=$(ic-wasm --version | awk '{print $2}')

  if [[ "$(printf '%s\n' "0.5.0" "$version" | sort -V | head -n 1)" == "0.5.0" ]]; then
      echo "Executing because version is 0.5.0 or higher"
      ic-wasm ./target/wasm32-unknown-unknown/release/$PAC_NAME.wasm -o ./target/wasm32-unknown-unknown/release/$PAC_NAME-opt.wasm shrink
      ic-wasm ./target/wasm32-unknown-unknown/release/$PAC_NAME.wasm -o ./target/wasm32-unknown-unknown/release/$PAC_NAME-opt.wasm optimize O3
  else
      echo "Executing because version is lower than 0.5.0"
      ic-wasm ./target/wasm32-unknown-unknown/release/$PAC_NAME.wasm -o ./target/wasm32-unknown-unknown/release/$PAC_NAME-opt.wasm shrink --optimize O3
  fi
  ic-wasm target/wasm32-unknown-unknown/release/$PAC_NAME-opt.wasm  -o ./target/wasm32-unknown-unknown/release/$PAC_NAME-opt-did.wasm  metadata candid:service -f  $DID_PATH -v public

  gzip -f -9 target/wasm32-unknown-unknown/release/$PAC_NAME-opt-did.wasm
  rm target/wasm32-unknown-unknown/release/$PAC_NAME.wasm
fi
