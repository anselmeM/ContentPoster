const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { evaluateTriggers, TRIGGER_ACTIONS } = require("./triggerEngine");

admin.initializeApp();
const db = admin.firestore();

// We default to 'content-cadence-app' but in production it could be different
// If you have multiple environments, you can fetch this from process.env or a document
const APP_ID = process.env.APP_ID || "amplifyio-c5ad7";

/**
 * Scheduled function that runs every 5 minutes.
 * Scans all users for draft posts with active triggers and auto-publishes them
 * if their conditions or dates are met.
 */
exports.evaluateScheduledPosts = onSchedule("every 5 minutes", async (event) => {
  console.log(`[Scheduler] Starting post trigger evaluation...`);
  let publishedCount = 0;

  try {
    // In Firestore Admin SDK, we can query across all subcollections using collectionGroup
    // Or we can query the specific users -> posts trees. 
    // Since our posts live at: artifacts/{appId}/users/{userId}/posts/{postId}
    // A collectionGroup query on 'posts' will find all posts across all users
    const postsQuery = db.collectionGroup("posts")
      .where("status", "==", "draft");
    
    const snapshot = await postsQuery.get();
    
    if (snapshot.empty) {
      console.log("[Scheduler] No draft posts found to evaluate.");
      return null;
    }

    console.log(`[Scheduler] Evaluating ${snapshot.size} draft posts...`);

    const batch = db.batch();
    const updatePromises = [];

    snapshot.forEach((doc) => {
      const postData = doc.data();
      const post = { id: doc.id, ...postData };
      
      // Evaluate the post
      const triggerResult = evaluateTriggers(post);
      
      if (triggerResult && triggerResult.action === TRIGGER_ACTIONS.PUBLISH) {
        console.log(`[Scheduler] Trigger fired for post ${post.id}: ${triggerResult.reason}`);
        
        // Mark post as scheduled/published
        const postRef = doc.ref;
        batch.update(postRef, {
          status: "scheduled",
          publishedAt: new Date().toISOString(),
          triggerExecuted: {
            ...triggerResult,
            executedAt: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        });
        
        // TODO: Call actual Social Media APIs here securely using Google Secret Manager
        console.log(`[Scheduler] Dummy Social Media API publish triggered for post ${post.id}`);
        
        publishedCount++;
      }
    });

    if (publishedCount > 0) {
      await batch.commit();
      console.log(`[Scheduler] Successfully auto-published ${publishedCount} posts.`);
    } else {
      console.log(`[Scheduler] No posts met their trigger conditions.`);
    }
    
    return null;

  } catch (error) {
    console.error("[Scheduler] Error evaluating triggers:", error);
    throw new Error("Trigger evaluation failed");
  }
});
