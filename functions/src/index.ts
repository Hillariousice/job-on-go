import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

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
          return; // Job doesn't exist, nothing to do.
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
          return; // Job already closed
        }

        const applicantLimit = jobData.applicantLimit;

        // Only proceed if there's a numeric limit greater than 0
        if (
          typeof applicantLimit !== "number" ||
          applicantLimit <= 0
        ) {
          logger.info(
            `[${applicationId}] Job ID: ${jobId} has no applicant limit or limit is not positive (${applicantLimit}). No action needed.`
          );
          return;
        }

        // Count existing applications for this job
        const applicationsQuery = db
          .collection("applications")
          .where("jobId", "==", jobId);
        const applicationsSnapshot = await transaction.get(applicationsQuery); // Use transaction.get for reads within transaction
        const applicationsCount = applicationsSnapshot.size; // .size gives the count of documents

        logger.info(
          `[${applicationId}] Job ID: ${jobId} has applicant limit: ${applicantLimit}. Current applications: ${applicationsCount}.`
        );

        // Note: The current application `snap` is already created, so applicationsCount will include it.
        // Thus, we check if count is >= limit.
        if (applicationsCount >= applicantLimit) {
          logger.info(
            `[${applicationId}] Applicant limit reached for job ID: ${jobId}. Closing job. Limit: ${applicantLimit}, Count: ${applicationsCount}`
          );
          transaction.update(jobRef, {
            isClosed: true,
            status: "closed", // Optionally update a status field as well
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Keep track of when it was closed
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
      // Rethrowing the error might cause the function to retry, depending on settings.
      // For this scenario, if the transaction fails, retrying might be appropriate.
      throw error;
    }
  });
