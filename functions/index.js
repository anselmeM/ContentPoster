const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { evaluateTriggers, TRIGGER_ACTIONS } = require("./triggerEngine");

admin.initializeApp();
const db = admin.firestore();

const APP_ID = process.env.APP_ID || "amplifyio-c5ad7";

// Initialize Express App for API routing
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * Middleware to verify Firebase Auth ID Token in Authorization header
 */
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/**
 * Route: Exchange Twitter OAuth 2.0 authorization code for tokens
 */
app.post("/auth/twitter/token", authenticateUser, async (req, res) => {
  const { code, redirectUri, codeVerifier } = req.body;
  const userId = req.user.uid;

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Twitter developer credentials not configured on server." });
  }

  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri || `${req.headers.origin}/auth/twitter/callback`,
    code_verifier: codeVerifier || "challenge"
  });

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
      body: params.toString()
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    // Write tokens securely to user connections subcollection in Firestore
    const connectionData = {
      connected: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      connectedAt: new Date().toISOString(),
      userId: userId
    };

    await db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("connections").doc("twitter").set(connectionData);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to exchange Twitter OAuth code:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Route: Exchange Facebook/Instagram OAuth code for access token
 */
app.post("/auth/facebook/token", authenticateUser, async (req, res) => {
  const { code, redirectUri } = req.body;
  const userId = req.user.uid;

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Facebook developer credentials not configured on server." });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri || `${req.headers.origin}/auth/facebook/callback`,
    code
  });

  try {
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error.message });
    }

    // Store tokens in Firestore connection document
    const connectionData = {
      connected: true,
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + ((tokenData.expires_in || 5184000) * 1000), // Default 60 days
      connectedAt: new Date().toISOString(),
      userId: userId
    };

    await db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("connections").doc("instagram").set(connectionData);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to exchange Facebook/Instagram OAuth code:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Export Express API
exports.api = onRequest({
  secrets: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"]
}, app);

/**
 * Helper to refresh Twitter Access Token using Refresh Token
 */
const refreshTwitterToken = async (userId, refreshToken) => {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`
    },
    body: params.toString()
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  const updatedData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
    updatedAt: new Date().toISOString()
  };

  await db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("connections").doc("twitter").update(updatedData);

  return data.access_token;
};

/**
 * Live API publisher for Twitter / X
 */
const publishToTwitter = async (token, content) => {
  const payload = { text: content };
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Twitter API posting error");
  }
  return result;
};

/**
 * Live API publisher for Instagram (via Facebook Graph)
 */
const publishToInstagram = async (token, userId, imageUrl, caption) => {
  // Create Instagram media container
  const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${userId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: caption,
      access_token: token
    })
  });
  
  const container = await containerResponse.json();
  if (container.error) {
    throw new Error(container.error.message);
  }

  // Publish media container
  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${userId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token
    })
  });

  const publish = await publishResponse.json();
  if (publish.error) {
    throw new Error(publish.error.message);
  }
  return publish;
};

/**
 * Scheduled Cloud Function running every 5 minutes
 */
exports.evaluateScheduledPosts = onSchedule({
  schedule: "every 5 minutes",
  secrets: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"]
}, async (event) => {
  console.log(`[Scheduler] Starting post trigger evaluation...`);
  let publishedCount = 0;

  try {
    const postsQuery = db.collectionGroup("posts")
      .where("status", "==", "draft");
    
    const snapshot = await postsQuery.get();
    
    if (snapshot.empty) {
      console.log("[Scheduler] No draft posts found to evaluate.");
      return null;
    }

    console.log(`[Scheduler] Evaluating ${snapshot.size} draft posts...`);

    for (const doc of snapshot.docs) {
      const postData = doc.data();
      const post = { id: doc.id, ...postData };
      
      const triggerResult = evaluateTriggers(post);
      
      if (triggerResult && triggerResult.action === TRIGGER_ACTIONS.PUBLISH) {
        console.log(`[Scheduler] Trigger fired for post ${post.id}: ${triggerResult.reason}`);
        
        // Parse userId from document path
        const pathParts = doc.ref.path.split("/");
        const userId = pathParts[3];

        let publishSuccess = false;
        let publishResult = null;
        let errorMessage = "";

        try {
          // Fetch token from Firestore
          const connDoc = await db.collection("artifacts").doc(APP_ID).collection("users").doc(userId).collection("connections").doc(post.platform).get();
          
          if (connDoc.exists) {
            const connData = connDoc.data();
            let token = connData.accessToken;

            // Check if Twitter token is expired and needs refresh
            if (post.platform === "twitter" && connData.expiresAt && Date.now() >= connData.expiresAt && connData.refreshToken) {
              console.log(`[Scheduler] Twitter token expired. Refreshing token for user ${userId}...`);
              token = await refreshTwitterToken(userId, connData.refreshToken);
            }

            // Publish to live API
            if (post.platform === "twitter") {
              publishResult = await publishToTwitter(token, post.title);
              publishSuccess = true;
            } else if (post.platform === "instagram" && post.image) {
              const igUserId = connData.userId || userId;
              publishResult = await publishToInstagram(token, igUserId, post.image, post.title);
              publishSuccess = true;
            } else {
              errorMessage = `Publishing is not configured or unsupported for platform: ${post.platform}`;
            }
          } else {
            errorMessage = `Platform account not connected. Please connect ${post.platform} in settings.`;
          }
        } catch (apiError) {
          console.error(`[Scheduler] Direct API publishing failed for post ${post.id}:`, apiError);
          errorMessage = apiError.message || String(apiError);
        }

        const postRef = doc.ref;
        if (publishSuccess) {
          await postRef.update({
            status: "published",
            publishedAt: new Date().toISOString(),
            triggerExecuted: {
              ...triggerResult,
              executedAt: new Date().toISOString(),
              result: publishResult
            },
            updatedAt: new Date().toISOString()
          });
          console.log(`[Scheduler] Direct published post ${post.id} successfully.`);
          publishedCount++;
        } else {
          // Revert to draft status and store error details
          await postRef.update({
            status: "draft",
            publishError: errorMessage,
            updatedAt: new Date().toISOString()
          });
          console.warn(`[Scheduler] Failed to publish post ${post.id}. Reverted to draft. Error: ${errorMessage}`);
        }
      }
    }

    console.log(`[Scheduler] Auto-publish sweep finished. Published ${publishedCount} posts.`);
    return null;

  } catch (error) {
    console.error("[Scheduler] Error running scheduled trigger checks:", error);
    throw new Error("Trigger check execution failed");
  }
});

/**
 * Helper function to calculate the next run time for exports
 */
const calculateNextRun = (frequency, time) => {
  const now = new Date();
  const [hours, minutes] = (time || "09:00").split(":").map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case "weekly":
      nextRun.setDate(nextRun.getDate() + 7);
      break;
      
    case "monthly":
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
      
    default:
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
  }
  
  return nextRun.toISOString();
};

/**
 * Format post data into the requested export file format
 */
const generateReportContent = (posts, format, scheduleName) => {
  const headers = ["ID", "Title", "Content", "Platform", "Status", "Date", "Time", "Likes", "Comments", "Shares", "Views"];

  if (format === "json") {
    return JSON.stringify(posts, null, 2);
  }

  if (format === "csv") {
    const csvRows = posts.map(p => {
      const likes = p.engagement?.likes || 0;
      const comments = p.engagement?.comments || 0;
      const shares = p.engagement?.shares || 0;
      const views = p.engagement?.views || 0;
      return [
        p.id,
        p.title || "",
        p.content || "",
        p.platform || "",
        p.status || "",
        p.date || "",
        p.time || "",
        likes,
        comments,
        shares,
        views
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
    });
    return [headers.join(","), ...csvRows].join("\n");
  }

  if (format === "excel") {
    // Generate simple openable HTML spreadsheet
    const rows = posts.map(p => {
      const likes = p.engagement?.likes || 0;
      const comments = p.engagement?.comments || 0;
      const shares = p.engagement?.shares || 0;
      const views = p.engagement?.views || 0;
      return `<tr>
        <td>${p.id}</td>
        <td>${p.title || ""}</td>
        <td>${p.content || ""}</td>
        <td>${p.platform || ""}</td>
        <td>${p.status || ""}</td>
        <td>${p.date || ""}</td>
        <td>${p.time || ""}</td>
        <td>${likes}</td>
        <td>${comments}</td>
        <td>${shares}</td>
        <td>${views}</td>
      </tr>`;
    });

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Analytics Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <h3>${scheduleName} - Generated ${new Date().toLocaleString()}</h3>
        <table border="1">
          <thead>
            <tr bgcolor="#eeeeee">${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  // Fallback: Text summary report for PDF
  const totalLikes = posts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0);

  const platformBreakdown = posts.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {});

  const breakdownText = Object.entries(platformBreakdown)
    .map(([plat, count]) => `  • ${plat}: ${count} posts`)
    .join("\n");

  const postDetails = posts.map((p, i) => {
    const likes = p.engagement?.likes || 0;
    const comments = p.engagement?.comments || 0;
    const shares = p.engagement?.shares || 0;
    const views = p.engagement?.views || 0;
    return `${i + 1}. ${p.title || "(Untitled)"} [${p.platform}] - Status: ${p.status}
   Scheduled: ${p.date || "N/A"} ${p.time || "N/A"}
   Likes: ${likes} | Comments: ${comments} | Shares: ${shares} | Views: ${views}
   Content: ${p.content || "(No caption)"}
   `;
  }).join("\n");

  return `================================================================================
Content Cadence - Analytics Report: ${scheduleName}
Generated: ${new Date().toLocaleString()}
================================================================================

Summary:
  • Total Posts Evaluated: ${posts.length}
  • Total Likes: ${totalLikes}
  • Total Comments: ${totalComments}
  • Total Shares: ${totalShares}
  • Total Views: ${totalViews}

Platform Breakdown:
${breakdownText || "  (No posts evaluated)"}

================================================================================
Individual Post Metrics:
================================================================================
${postDetails || "(No posts available)"}
`;
};

/**
 * Scheduled Cloud Function to process scheduled exports
 */
exports.processScheduledExports = onSchedule({
  schedule: "every 15 minutes"
}, async (event) => {
  console.log(`[Exports] Starting scheduled exports evaluation...`);
  const now = new Date().toISOString();
  let processedCount = 0;

  try {
    const snapshot = await db.collectionGroup("scheduled_exports")
      .where("enabled", "==", true)
      .get();

    if (snapshot.empty) {
      console.log("[Exports] No active scheduled export configurations found.");
      return null;
    }

    for (const docSnap of snapshot.docs) {
      const scheduleData = docSnap.data();
      const nextRun = scheduleData.nextRun;

      // Evaluate if due (filtering locally in JS to avoid composite index overhead)
      if (nextRun && nextRun <= now) {
        console.log(`[Exports] Export job "${scheduleData.name}" is due. Processing...`);

        // Parse path: users/{userId}/{appId}/scheduled_exports/{docId}
        const pathParts = docSnap.ref.path.split("/");
        const userId = pathParts[1];
        const appId = pathParts[2];
        const docId = docSnap.id;

        try {
          // Fetch user posts
          const postsSnapshot = await db.collection("artifacts")
            .doc(appId)
            .collection("users")
            .doc(userId)
            .collection("posts")
            .get();

          const posts = postsSnapshot.docs.map(p => ({ id: p.id, ...p.data() }));
          console.log(`[Exports] Found ${posts.length} posts for user ${userId}. Generating report...`);

          // Format content
          const format = scheduleData.format || "csv";
          const content = generateReportContent(posts, format, scheduleData.name);

          let contentType = "text/plain";
          if (format === "json") contentType = "application/json";
          else if (format === "csv") contentType = "text/csv";
          else if (format === "excel") contentType = "application/vnd.ms-excel";
          else if (format === "pdf") contentType = "application/pdf";

          // Save file to default storage bucket
          const bucket = admin.storage().bucket();
          const cleanName = scheduleData.name.replace(/[^a-zA-Z0-9]/g, "_");
          const fileName = `exports/${userId}/${docId}/${cleanName}_${Date.now()}.${format}`;
          const fileRef = bucket.file(fileName);

          await fileRef.save(content, {
            metadata: { contentType }
          });

          // Build a direct download URL using firebasestorage path
          const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
          console.log(`[Exports] Report uploaded to Storage: ${fileName}`);

          // Add in-app notification for the user
          await db.collection("artifacts")
            .doc(appId)
            .collection("users")
            .doc(userId)
            .collection("notifications")
            .add({
              type: "system_alert",
              title: "Export Generated",
              message: `Your scheduled export "${scheduleData.name}" has been generated in ${format.toUpperCase()} format.`,
              data: {
                exportId: docId,
                name: scheduleData.name,
                format: format,
                downloadUrl: downloadUrl,
                timestamp: Date.now()
              },
              read: false,
              userId: userId,
              timestamp: Date.now(),
              createdAt: new Date().toISOString()
            });

          // Calculate next run time and update schedule document
          const nextRunTime = calculateNextRun(scheduleData.frequency, scheduleData.time);
          await docSnap.ref.update({
            lastRun: new Date().toISOString(),
            nextRun: nextRunTime,
            updatedAt: new Date().toISOString()
          });

          console.log(`[Exports] Export job ${docId} processed successfully. Next run: ${nextRunTime}`);
          processedCount++;

        } catch (jobError) {
          console.error(`[Exports] Failed to process export job ${docId}:`, jobError);
        }
      }
    }

    console.log(`[Exports] Evaluation finished. Processed ${processedCount} due exports.`);
    return null;
  } catch (err) {
    console.error("[Exports] Critical error in exports evaluator:", err);
    throw err;
  }
});

