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

    const projectId = "YOUR_DIALOGFLOW_PROJECT_ID"; // <<<< REPLACE THIS
    const credentials = {
      client_email: "your-service-account-email@your-project-id.iam.gserviceaccount.com", // <<<< REPLACE THIS
      private_key: "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\nYOUR_PRIVATE_KEY_CONTINUED\\n-----END PRIVATE KEY-----\\n", // <<<< REPLACE THIS (ensure newlines are \n)
    };

    if (projectId === "YOUR_DIALOGFLOW_PROJECT_ID" || credentials.private_key.includes("YOUR_PRIVATE_KEY_HERE")) {
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
