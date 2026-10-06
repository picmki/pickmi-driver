const { createGraphqlClient } = require('/Users/karthikp/.npm/_npx/e25a38a8cc65d08e/node_modules/eas-cli/build/commandUtils/context/contextUtils/createGraphqlClient');
const { gql } = require('/Users/karthikp/.npm/_npx/e25a38a8cc65d08e/node_modules/@urql/core');
const fs = require('fs');

const state = JSON.parse(fs.readFileSync('/Users/karthikp/.expo/state.json', 'utf8'));
const client = createGraphqlClient({ sessionSecret: state.auth.sessionSecret });

async function run() {
  const query = gql`
    query GetAppCredentials($appId: String!) {
      app {
        byId(appId: $appId) {
          id
          name
          slug
          ownerAccount {
            name
          }
          androidAppCredentials {
            id
            applicationIdentifier
            androidAppBuildCredentialsList {
              id
              name
              isDefault
              androidKeystore {
                id
                keyAlias
                keystorePassword
                keyPassword
              }
            }
          }
        }
      }
    }
  `;

  try {
    console.log("Fetching credentials for MobileApp (4ecc15ea-142d-4f0b-a354-66c2cbb829d3)...");
    const res1 = await client.query(query, { appId: "4ecc15ea-142d-4f0b-a354-66c2cbb829d3" }).toPromise();
    console.log("Res1 Data:", JSON.stringify(res1.data, null, 2));
    if (res1.error) console.log("Res1 Error:", JSON.stringify(res1.error, null, 2));

    console.log("\nFetching credentials for pickmi-driver (13fe6dc0-ca34-419b-9d8c-de3b788bdcb0)...");
    const res2 = await client.query(query, { appId: "13fe6dc0-ca34-419b-9d8c-de3b788bdcb0" }).toPromise();
    console.log("Res2 Data:", JSON.stringify(res2.data, null, 2));
    if (res2.error) console.log("Res2 Error:", JSON.stringify(res2.error, null, 2));

  } catch (err) {
    console.error("Error:", err);
  }
}

run();
