/**
 * Skye | Grounded Intimacy - Serverless Backend
 * Updated with detailed Console Logging for Cloudflare Dashboard debugging.
 */

export async function onRequestPost(context) {
  // LOG: Signal that the function has started running
  console.log("------------------------------------------------");
  console.log("[New Request] Started processing enquiry form.");

  try {
    // 1. Parse Data
    let data;
    try {
      data = await context.request.json();
      // LOG: Confirm we received data (don't log sensitive info like full messages)
      console.log(`[Data Received] From: ${data.name} (${data.email}), Theme: ${data.theme}`);
    } catch (parseError) {
      console.error("[Error] Failed to parse JSON body:", parseError.message);
      throw new Error("Invalid form data.");
    }

    const { name, email, message, theme, consentSensitive, orderData, capacity } = data;

    // 2. Compliance Check
    if (consentSensitive !== true) {
      console.warn("[Blocked] User did not consent to sensitive info collection.");
      return new Response(JSON.stringify({ error: "Consent denied." }), { status: 403 });
    }

    // 3. Environment Check (Crucial for debugging)
    const targetEmail = context.env.PRACTITIONER_EMAIL; 
    const apiKey = context.env.RESEND_API_KEY;

    // LOG: Check if keys exist (prints 'Yes' or 'No', not the actual secret key)
    console.log(`[Env Check] Target Email: ${targetEmail ? targetEmail : 'MISSING'}`);
    console.log(`[Env Check] Resend API Key: ${apiKey ? 'Present' : 'MISSING'}`);

    if (!targetEmail || !apiKey) {
        throw new Error("Server Environment Variables are missing. Check Cloudflare Settings.");
    }

    // 4. Parse Order Data (if any)
    let orderHtml = "";
    if (orderData && orderData.length > 5) {
        try {
            const items = JSON.parse(orderData);
            const total = items.reduce((sum, item) => sum + item.price, 0);
            console.log(`[Order Processing] Found ${items.length} items. Total: $${total}`);
            orderHtml = `
                <div style="background:#f9f9f9; padding:15px; border:1px solid #eee; margin: 15px 0;">
                    <h3>🛍️ Boutique Request</h3>
                    <ul>${items.map(i => `<li>${i.name} ($${i.price})</li>`).join('')}</ul>
                    <p><strong>Total Value: $${total.toFixed(2)}</strong></p>
                </div>
            `;
        } catch (e) { 
            console.warn("[Warning] Failed to parse order data JSON:", e.message);
        }
    }

    // 5. Construct Email Body
    const adminBody = `
      <h1>New Website Enquiry</h1>
      <p><strong>Context Mode:</strong> ${theme}</p>
      <p><strong>Capacity Issue:</strong> ${capacity}</p>
      ${orderHtml}
      <hr>
      <h3>Message</h3>
      <p>${message}</p>
      <hr>
      <p><strong>Client:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
    `;

    // 6. Send Email A (Admin)
    console.log("[Resend] Attempting to send Admin email...");
    
    const resA = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Grounded Intimacy <queries@qss.blue>', 
        to: targetEmail,
        subject: `[New Enquiry] ${name} (${theme})`,
        html: adminBody,
        reply_to: email 
      })
    });

    // LOG: Result of Admin Email
    if (!resA.ok) {
        const errText = await resA.text();
        console.error(`[Resend Error] Admin email failed. Status: ${resA.status}. Reason: ${errText}`);
        throw new Error(`Resend API Error: ${errText}`);
    } else {
        console.log("[Resend] Admin email sent successfully.");
    }

    // 7. Send Email B (Receipt)
    console.log("[Resend] Attempting to send Client Receipt email...");
    
    const resB = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Grounded Intimacy <queries@qss.blue>',
        to: email,
        subject: `Received: Your enquiry to Grounded Intimacy`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Thank you, ${name}.</h2>
            <p>I have received your enquiry via the Grounded Intimacy website.</p>
            ${orderHtml ? `<p><strong>Order Request Received:</strong> I will review your request and send a secure invoice if suitable.</p>` : ''}
            <p>I typically respond within 48 hours. Please note that this service is educational and experiential.</p>
            <p>Warm regards,<br>Skye</p>
          </div>
        `
      })
    });

    if(resB.ok) {
        console.log("[Resend] Client receipt sent successfully.");
    } else {
        console.warn("[Resend Warning] Client receipt failed, but Admin email worked.");
    }

    console.log("[Success] Workflow complete. Returning 200 OK.");
    console.log("------------------------------------------------");

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    // This LOG is the most important one if things fail
    console.error("!!! [CRITICAL FAILURE] !!!");
    console.error(err.message);
    console.log("------------------------------------------------");
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}