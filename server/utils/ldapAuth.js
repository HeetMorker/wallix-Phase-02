const ldap = require("ldapjs");
const LDAPConfig = require("../models/ldapConfig.model");

// Global exception handler
process.on("uncaughtException", (err) => {
  if (err.code === "ECONNRESET") {
    console.error("Global Handler: Caught ECONNRESET error:", err.message);
  } else {
    console.error("Unhandled Exception:", err);
  }
});

// 🔐 Authenticate using DN & password (main function used in login)
async function authenticateUser(dn, password, callback) {
  try {
    const config = await LDAPConfig.findOne();

    if (!config || !config.server || !config.port) {
      console.error("🚫 LDAP server/port missing in LDAPConfig");
      return callback(new Error("LDAP configuration missing"));
    }

    const ldapUrl = `ldap://${config.server}:${config.port}`;
    console.log("🔧 Connecting to LDAP at:", ldapUrl);

    const ldapClient = ldap.createClient({
      url: ldapUrl,
      connectTimeout: 5000,
      timeout: 10000,
      reconnect: false,
    });

    ldapClient.on("error", (err) => {
      console.error("LDAP client error:", err.message);
      safeDestroy(ldapClient);
      return callback(err);
    });

    // Attempt to bind
    ldapClient.bind(dn, password, (err) => {
      if (err) {
        console.error("❌ LDAP bind failed:", err.message);
        return safeCleanup(ldapClient, err, callback);
      }

      console.log("✅ LDAP bind successful for user:", dn);
      return safeCleanup(ldapClient, null, callback);
    });
  } catch (error) {
    console.error("🔥 Exception in authenticateUser:", error.message);
    return callback(error);
  }
}

// 🔄 Cleanup logic
function safeCleanup(client, error, callback) {
  client.unbind((unbindErr) => {
    if (unbindErr) {
      console.error("Error during unbind:", unbindErr.message);
    }
    safeDestroy(client);
    return callback(error);
  });
}

function safeDestroy(client) {
  try {
    client.destroy();
  } catch (err) {
    console.error("Destroy error:", err.message);
  }
}

// 🧪 Optional function if used elsewhere
async function authenticate(dn, password, callback) {
  return authenticateUser(dn, password, callback);
}

module.exports = {
  authenticate,
  authenticateUser,
};
