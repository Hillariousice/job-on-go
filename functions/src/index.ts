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
    const dialogflowConfig = functions.config().dialogflow;
    const projectId = dialogflowConfig?.project_id;
    const credentials = {
      client_email: dialogflowConfig?.client_email,
      private_key: dialogflowConfig?.private_key?.replace(/\\n/g, '\n'), // Handle escaped newlines
    };

    if (!dialogflowConfig || !projectId || !credentials.client_email || !credentials.private_key) {
      logger.error(
        "dialogflowProxy: Dialogflow configuration is missing. " +
        "Please set dialogflow.project_id, dialogflow.client_email, and dialogflow.private_key in Firebase environment configuration. " +
        "Refer to Firebase and Dialogflow documentation for setup instructions."
      );
      response.status(500).send({ error: "Dialogflow service not configured by the administrator. Missing critical configuration." });
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

export const contactApplicantAndUpdateStatus = functions.https.onCall(async (data, context) => {
  logger.info("contactApplicantAndUpdateStatus: Function called with data:", data);

  // 1. Validate parameters
  const { applicationId, newStatus, emailSubject, emailBody } = data;
  if (!applicationId || !newStatus || !emailSubject || !emailBody) {
    logger.error("contactApplicantAndUpdateStatus: Missing required parameters.", data);
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters: applicationId, newStatus, emailSubject, and emailBody are required."
    );
  }

  // 2. Check authentication
  if (!context.auth) {
    logger.error("contactApplicantAndUpdateStatus: User not authenticated.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const companyRepUID = context.auth.uid;
  logger.info(`contactApplicantAndUpdateStatus: Authenticated user UID: ${companyRepUID}`);

  const applicationRef = db.collection("applications").doc(applicationId);
  const mailCollectionRef = db.collection("mail");

  try {
    // 3. Fetch application and job details, then applicant email
    const applicantEmail = await db.runTransaction(async (transaction) => {
      // 4. Fetch application document
      const appDoc = await transaction.get(applicationRef);
      if (!appDoc.exists) {
        logger.error(`contactApplicantAndUpdateStatus: Application not found: ${applicationId}`);
        throw new functions.https.HttpsError("not-found", `Application with ID ${applicationId} not found.`);
      }
      const appData = appDoc.data();
      if (!appData) {
        logger.error(`contactApplicantAndUpdateStatus: Application data undefined for ID: ${applicationId}`);
        throw new functions.https.HttpsError("internal", "Application data is undefined.");
      }
      logger.info(`contactApplicantAndUpdateStatus: Fetched application: ${applicationId}`, appData);


      // 5. Get jobId and applicantId from application
      const jobId = appData.jobId;
      const applicantId = appData.applicantId;
      if (!jobId || !applicantId) {
        logger.error(`contactApplicantAndUpdateStatus: Application ${applicationId} is missing jobId or applicantId.`);
        throw new functions.https.HttpsError("internal", "Application data is incomplete (missing jobId or applicantId).");
      }

      // 6. Fetch job document
      const jobRef = db.collection("jobs").doc(jobId);
      const jobDoc = await transaction.get(jobRef);
      if (!jobDoc.exists) {
        logger.error(`contactApplicantAndUpdateStatus: Job not found: ${jobId} for application ${applicationId}`);
        throw new functions.https.HttpsError("not-found", `Job with ID ${jobId} not found.`);
      }
      const jobData = jobDoc.data();
      if (!jobData) {
        logger.error(`contactApplicantAndUpdateStatus: Job data undefined for ID: ${jobId}`);
        throw new functions.https.HttpsError("internal", "Job data is undefined.");
      }
      logger.info(`contactApplicantAndUpdateStatus: Fetched job: ${jobId}`, jobData);

      // 7. Authorization Check: Verify job ownership
      // Assuming jobData.userId stores the UID of the company representative who posted the job
      if (jobData.userId !== companyRepUID) {
        logger.error(
          `contactApplicantAndUpdateStatus: Permission denied. User ${companyRepUID} is not the owner of job ${jobId}. Expected owner: ${jobData.userId}`
        );
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to modify this application."
        );
      }
      logger.info(`contactApplicantAndUpdateStatus: User ${companyRepUID} authorized for job ${jobId}.`);

      // 8. Fetch applicant's user document (assuming 'users' collection)
      const userRef = db.collection("users").doc(applicantId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        logger.error(`contactApplicantAndUpdateStatus: Applicant user document not found: ${applicantId}`);
        throw new functions.https.HttpsError("not-found", `Applicant user with ID ${applicantId} not found.`);
      }
      const userData = userDoc.data();
      if (!userData || !userData.email) {
        logger.error(`contactApplicantAndUpdateStatus: Applicant user data for ${applicantId} is missing email.`);
        throw new functions.https.HttpsError("internal", "Applicant user data does not contain an email address.");
      }
      logger.info(`contactApplicantAndUpdateStatus: Fetched applicant user: ${applicantId}`, { email: userData.email });

      // 9. Update application status (INSIDE the transaction)
      const currentStatusHistory = appData.statusHistory || [];
      const newStatusEntry = {
        status: newStatus,
        date: admin.firestore.Timestamp.now(), // Use server timestamp for consistency
        updatedBy: companyRepUID,
      };
      transaction.update(applicationRef, {
        status: newStatus,
        statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusHistory: [...currentStatusHistory, newStatusEntry],
      });
      logger.info(`contactApplicantAndUpdateStatus: Application update for ${applicationId} added to transaction.`);

      return userData.email; // Return applicant's email for use after transaction
    });

    // If the transaction completed successfully, appData is updated and applicantEmail is available.
    logger.info(`contactApplicantAndUpdateStatus: Transaction successful. Application ${applicationId} status updated to ${newStatus}.`);

    // 10. Create email document in 'mail' collection
    const mailDoc = {
      to: [applicantEmail],
      message: {
        subject: emailSubject,
        html: emailBody,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      applicationId: applicationId, // For tracking
      statusUpdatedTo: newStatus,   // For tracking
    };
    await mailCollectionRef.add(mailDoc);
    logger.info(`contactApplicantAndUpdateStatus: Email queued for applicant ${applicantEmail} regarding application ${applicationId}.`, mailDoc);

    // 11. Return success
    return {
      success: true,
      message: "Application status updated and email queued successfully.",
    };
  } catch (error) {
    logger.error("contactApplicantAndUpdateStatus: Error processing request:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError directly
    }
    // For other errors, wrap them in a generic internal error
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while processing your request.",
      (error as Error).message // Optionally include original error message for debugging in logs
    );
  }
});


// Note: If there were other functions in the original index.ts, they should be preserved.
// This overwrite includes the previous handleNewApplication function as an example.
// If the original index.ts was empty or only had comments, this is fine.
// If it had other functions, they would need to be merged back in.
// For this task, I'm assuming the previous state was either empty or I'm correctly including all necessary functions.
// The `read_files` for `index.ts` in the previous step showed only comments and a sample function.
// So, this structure (admin init, cors, dialogflowProxy, handleNewApplication) should be correct.
