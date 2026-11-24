# Feedback collector setup (one time, about 3 minutes)

The site sends reports to this Google Apps Script, which adds each one as a row in a Google Sheet called **Stepwise feedback** in your Google Drive. People sending feedback don't need an account. The script doesn't receive their IP address, and it only gets their name or email if they type it in themselves.

1. Go to **https://script.new** (signed in to your Google account). A new Apps Script project opens.
2. Delete what's in the editor, paste in all of [`Code.gs`](Code.gs), and press **Ctrl+S**. Name the project `Stepwise feedback`.
3. In the function menu at the top choose **setup**, then click **Run**. Google asks you to authorize it:
   **Review permissions** → choose your account → **Advanced** → **Go to Stepwise feedback (unsafe)** → **Allow**.
   ("Unsafe" only means Google hasn't reviewed your own script.) The log then shows a link to the new sheet.
4. Click **Deploy → New deployment**. Click the gear next to "Select type" and pick **Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
   Then click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Put that URL in `src/config.ts` as `FEEDBACK_URL` (or paste it to Claude), then run `npm run deploy`.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
