import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { SessionsClient } from "@google-cloud/dialogflow";
import * as corsLib from "cors"; // Use a different name to avoid conflict with a potential local 'cors' variable

// Initialize Firebase Admin SDK (if not already initialized for other functions)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// CORS middleware configuration
// It's important to restrict the origin in production environments
const corsOptions = {
  origin: true, // Allows all origins. For production, specify allowed origins.
};
const cors = corsLib(corsOptions);


// Dialogflow Proxy Function (HTTPS onRequest)
export const dialogflowProxy = functions.https.onRequest(async (request, response) => {
  // Handle CORS preflight requests and then the actual request
  cors(request, response, async () => {
    if (request.method !== "POST") {
      logger.warn("Received non-POST request to dialogflowProxy");
      response.status(405).send("Method Not Allowed");
      return;
    }

    const { queryText, sessionId } = request.body;

    if (!queryText || !sessionId) {
      logger.error("dialogflowProxy: Missing queryText or sessionId in request body.", request.body);
      response.status(400).send({ error: "Missing queryText or sessionId." });
      return;
    }

    // --- IMPORTANT: Replace with your Dialogflow Project ID and Service Account Credentials ---
    // 1. Replace these placeholder values with your actual Dialogflow project ID and service account details.
    // 2. For production, it's STRONGLY recommended to store these in Firebase environment configuration:
    //    firebase functions:config:set dialogflow.project_id="YOUR_PROJECT_ID"
    //    firebase functions:config:set dialogflow.client_email="YOUR_SERVICE_ACCOUNT_EMAIL"
    //    firebase functions:config:set dialogflow.private_key="YOUR_PRIVATE_KEY_CONTENT_AS_SINGLE_LINE"
    //    (For private_key, replace newlines with \n if pasting directly, or use a file path during config set if possible)
    // Then, access them in your function like this:
    // const dialogflowConfig = functions.config().dialogflow;
    // const projectId = dialogflowConfig?.project_id;
    // const credentials = {
    //   client_email: dialogflowConfig?.client_email,
    //   private_key: dialogflowConfig?.private_key?.replace(/\\n/g, '\n'), // Handle escaped newlines
    // };
    // If projectId or credentials are not found, handle the error appropriately.

    const projectId = "job-on-go"; // <<<< REPLACE THIS
    const credentials = {
      client_email: "dialogflow-agent-sa@job-on-go.iam.gserviceaccount.com", // <<<< REPLACE THIS
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIpKSULdEdzydJ\niE7F9znlR6gYB0F/Y0M+/830YG8pCkULDf0iDfrwoyR9n/Mmm8LXMET9rEqME86O\ne6+skO+iwzhHd0yLOntReKVTI4d8W2Q1S66+0NhTCGGvR19ysyeseXBHHsC8ZeDA\nQcIbmJSZWOU2mDjYhrTJRTJgYHEK9snmBsShZrXU6bdrR+wb+6aqteP9rtlNqrHu\ndHSBixcIc+hVB0n6enNiXpSkl8gytDDqEbkzSbxiU0TQbdleBRF+gs0WIaXqF2Bd\n9j2402M95fa3qEfZK8kzAGgWilx4z7l+LhoFGAlvV7idj6+ylLL/+XvyV13jp6Ao\ndhS9IxUNAgMBAAECggEAH/hP+wZj5C6OUYKlHpkaggSNbaq2ToB4BhFHdVFqVO08\nfBryAxucKPytw1CZs0StYpFf5NWvmStMxdpCbyo27MXTcVu6eBLM9HnXSeyG2ZNM\nX8ub3+6yEWTr/7xNIp8WSr6c29A0ILDRA4FW1wPUZazK9QyDPkkUhF+Au+eSC49n\n6D4+kShN5LmisS9d4PEzUKF6Y9YuY6W3H2Fx07044fsSDkOHjVXbw7QOid+aTvgb\n7XQTfl4Yq5VD73r1e6jx6SZwL+8UVcXp6vugMxT+6mai9x3ZhjcyXoFD1CfsJ4ay\njfHENoQkLgyU7DFHhWuqftyloiMCwXYMRxemkMrPsQKBgQDssh7ZvTqfr/0q7uGP\nTblXvoJLPAhwaw2wCpbVKgIe0xeaFSSSzjrDTdONdM9hvGFNEnHTIGKTIVE02Kp0\nuEBO++r9bPylW/JwK5xRzLV9KfgcRxunSuK8yDBRBf3FpeVkk42YOX8787d2seAv\n6MrjlZ29Bdr769wI2BRys7VLFQKBgQDZAcsLFQi/IHYnlfScRJqt5hDI3BzJv7zl\nIaRyqJGe1VLK+YZfC0QJbKSRJc05q9FnOt/Sy0RwyO8mAD+Dt7cqFaOO1VnmPeZi\nD2EWecLGmlUaMo4Oz7Lg6PogH/zTC/dC8YIEvH/EkSTZQi63MAyEpLaci+eaQWtT\nhqjoM2PAGQKBgCFjuyBiJkvyipcs3ZrWjwfGsyCj1ljtcR/dTovBgk0Q4Cp3QxKG\njxmP+ADjcoHKDjvOF0p+LgmtUIRQ8DLI7yF1PiAD6Nv2zYtvS3zqkMuYSQzMJyWB\nVdzlrJMxciwYi/SVMAtCSSWO6tmOnB6GC2DxcTACDHMvQXnp6XCI01FFAoGASDvv\nkV3MDorIqb6hsM6pSk91sNaMAp//SaocKkpwRpWtvIC4uLRwTk7KrMIPgS3vQ1R2\nop0kyAIqkNSuT7L8llajnezowtpB8Mw7vhaDvkYrI9BGNynt2i3S7JSZPMsT4EWx\nyM/SG+VQhb0g/btRv2lwm8V6L3+tMR125ewNPSkCgYEApHiemVp6Y0CBwQ3tQLOz\nq71x3i+QRhG/mReGv8Q+53YjSbRjduKpSOX0yRKbSSMguX1l3c8mycS8rgxQKdvv\nAFMvaK0nAGyy4WRxD3aitqmkHp7brQpML1Gzi52Tb2Y5bDY2dQ5xZjv7WvXsllTg\nZknR6eLsnStzuaQqMFq440E=\n-----END PRIVATE KEY-----\n", // <<<< REPLACE THIS (ensure newlines are \n)
    };

    if (projectId === "job-on-go" || credentials.private_key.includes("-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIpKSULdEdzydJ\niE7F9znlR6gYB0F/Y0M+/830YG8pCkULDf0iDfrwoyR9n/Mmm8LXMET9rEqME86O\ne6+skO+iwzhHd0yLOntReKVTI4d8W2Q1S66+0NhTCGGvR19ysyeseXBHHsC8ZeDA\nQcIbmJSZWOU2mDjYhrTJRTJgYHEK9snmBsShZrXU6bdrR+wb+6aqteP9rtlNqrHu\ndHSBixcIc+hVB0n6enNiXpSkl8gytDDqEbkzSbxiU0TQbdleBRF+gs0WIaXqF2Bd\n9j2402M95fa3qEfZK8kzAGgWilx4z7l+LhoFGAlvV7idj6+ylLL/+XvyV13jp6Ao\ndhS9IxUNAgMBAAECggEAH/hP+wZj5C6OUYKlHpkaggSNbaq2ToB4BhFHdVFqVO08\nfBryAxucKPytw1CZs0StYpFf5NWvmStMxdpCbyo27MXTcVu6eBLM9HnXSeyG2ZNM\nX8ub3+6yEWTr/7xNIp8WSr6c29A0ILDRA4FW1wPUZazK9QyDPkkUhF+Au+eSC49n\n6D4+kShN5LmisS9d4PEzUKF6Y9YuY6W3H2Fx07044fsSDkOHjVXbw7QOid+aTvgb\n7XQTfl4Yq5VD73r1e6jx6SZwL+8UVcXp6vugMxT+6mai9x3ZhjcyXoFD1CfsJ4ay\njfHENoQkLgyU7DFHhWuqftyloiMCwXYMRxemkMrPsQKBgQDssh7ZvTqfr/0q7uGP\nTblXvoJLPAhwaw2wCpbVKgIe0xeaFSSSzjrDTdONdM9hvGFNEnHTIGKTIVE02Kp0\nuEBO++r9bPylW/JwK5xRzLV9KfgcRxunSuK8yDBRBf3FpeVkk42YOX8787d2seAv\n6MrjlZ29Bdr769wI2BRys7VLFQKBgQDZAcsLFQi/IHYnlfScRJqt5hDI3BzJv7zl\nIaRyqJGe1VLK+YZfC0QJbKSRJc05q9FnOt/Sy0RwyO8mAD+Dt7cqFaOO1VnmPeZi\nD2EWecLGmlUaMo4Oz7Lg6PogH/zTC/dC8YIEvH/EkSTZQi63MAyEpLaci+eaQWtT\nhqjoM2PAGQKBgCFjuyBiJkvyipcs3ZrWjwfGsyCj1ljtcR/dTovBgk0Q4Cp3QxKG\njxmP+ADjcoHKDjvOF0p+LgmtUIRQ8DLI7yF1PiAD6Nv2zYtvS3zqkMuYSQzMJyWB\nVdzlrJMxciwYi/SVMAtCSSWO6tmOnB6GC2DxcTACDHMvQXnp6XCI01FFAoGASDvv\nkV3MDorIqb6hsM6pSk91sNaMAp//SaocKkpwRpWtvIC4uLRwTk7KrMIPgS3vQ1R2\nop0kyAIqkNSuT7L8llajnezowtpB8Mw7vhaDvkYrI9BGNynt2i3S7JSZPMsT4EWx\nyM/SG+VQhb0g/btRv2lwm8V6L3+tMR125ewNPSkCgYEApHiemVp6Y0CBwQ3tQLOz\nq71x3i+QRhG/mReGv8Q+53YjSbRjduKpSOX0yRKbSSMguX1l3c8mycS8rgxQKdvv\nAFMvaK0nAGyy4WRxD3aitqmkHp7brQpML1Gzi52Tb2Y5bDY2dQ5xZjv7WvXsllTg\nZknR6eLsnStzuaQqMFq440E=\n-----END PRIVATE KEY-----\n")) {
        logger.error("dialogflowProxy: Dialogflow project ID or credentials are still placeholders. Please update them.");
        response.status(500).send({ error: "Dialogflow service not configured by the administrator." });
        return;
    }
    // --- END OF PLACEHOLDER SECTION ---

    const sessionClient = new SessionsClient({ credentials, projectId });
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    // For CX use: sessionClient.projectLocationAgentSessionPath(projectId, 'global', sessionId);

    const dialogflowRequest = {
      session: sessionPath,
      queryInput: {
        text: {
          text: queryText,
          languageCode: "en-US", // Adjust language code as needed
        },
      },
    };

    try {
      logger.info(`dialogflowProxy: Sending request to Dialogflow: ${JSON.stringify(dialogflowRequest.queryInput)} for session: ${sessionId}`);
      const [dialogflowResponse] = await sessionClient.detectIntent(dialogflowRequest);
      logger.info("dialogflowProxy: Received response from Dialogflow.");

      if (dialogflowResponse.queryResult) {
        const fulfillmentText = dialogflowResponse.queryResult.fulfillmentText;
        logger.info(`dialogflowProxy: Fulfillment text: ${fulfillmentText}`);
        response.status(200).send({ fulfillmentText: fulfillmentText || "No fulfillment text received." });
      } else {
        logger.warn("dialogflowProxy: No queryResult in Dialogflow response.", dialogflowResponse);
        response.status(500).send({ error: "No queryResult from Dialogflow." });
      }
    } catch (error) {
      logger.error("dialogflowProxy: Error calling Dialogflow detectIntent:", error);
      response.status(500).send({ error: "Error communicating with Dialogflow.", details: (error as Error).message });
    }
  });
});


// Example of another function (handleNewApplication) - Keep existing functions if any
export const handleNewApplication = functions.firestore
  .document("applications/{applicationId}")
  .onCreate(async (snap, context) => {
    const applicationData = snap.data();
    const applicationId = context.params.applicationId;

    if (!applicationData) {
      logger.error(`[${applicationId}] No data found for new application.`);
      return null;
    }

    const jobId = applicationData.jobId;
    if (!jobId) {
      logger.error(
        `[${applicationId}] Application data missing 'jobId'.`,
        applicationData
      );
      return null;
    }

    logger.info(
      `[${applicationId}] Processing new application for job ID: ${jobId}`
    );

    const jobRef = db.collection("jobs").doc(jobId);

    try {
      await db.runTransaction(async (transaction) => {
        const jobDoc = await transaction.get(jobRef);

        if (!jobDoc.exists) {
          logger.warn(
            `[${applicationId}] Job document not found for job ID: ${jobId}. No action taken.`
          );
          return;
        }

        const jobData = jobDoc.data();
        if (!jobData) {
          logger.error(
            `[${applicationId}] Job data is undefined for job ID: ${jobId}.`
          );
          return;
        }

        if (jobData.isClosed === true) {
          logger.info(
            `[${applicationId}] Job ID: ${jobId} is already closed. No action needed.`
          );
          return;
        }

        const applicantLimit = jobData.applicantLimit;

        if (
          typeof applicantLimit !== "number" ||
          applicantLimit <= 0
        ) {
          logger.info(
            `[${applicationId}] Job ID: ${jobId} has no applicant limit or limit is not positive (${applicantLimit}). No action needed.`
          );
          return;
        }

        const applicationsQuery = db
          .collection("applications")
          .where("jobId", "==", jobId);
        const applicationsSnapshot = await transaction.get(applicationsQuery);
        const applicationsCount = applicationsSnapshot.size;

        logger.info(
          `[${applicationId}] Job ID: ${jobId} has applicant limit: ${applicantLimit}. Current applications: ${applicationsCount}.`
        );

        if (applicationsCount >= applicantLimit) {
          logger.info(
            `[${applicationId}] Applicant limit reached for job ID: ${jobId}. Closing job. Limit: ${applicantLimit}, Count: ${applicationsCount}`
          );
          transaction.update(jobRef, {
            isClosed: true,
            status: "closed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          logger.info(
            `[${applicationId}] Applicant limit not yet reached for job ID: ${jobId}. Limit: ${applicantLimit}, Count: ${applicationsCount}.`
          );
        }
      });

      logger.info(
        `[${applicationId}] Successfully processed application for job ID: ${jobId}.`
      );
      return null;
    } catch (error) {
      logger.error(
        `[${applicationId}] Error processing application for job ID: ${jobId}:`,
        error
      );
      throw error;
    }
  });

// Note: If there were other functions in the original index.ts, they should be preserved.
// This overwrite includes the previous handleNewApplication function as an example.
// If the original index.ts was empty or only had comments, this is fine.
// If it had other functions, they would need to be merged back in.
// For this task, I'm assuming the previous state was either empty or I'm correctly including all necessary functions.
// The `read_files` for `index.ts` in the previous step showed only comments and a sample function.
// So, this structure (admin init, cors, dialogflowProxy, handleNewApplication) should be correct.
