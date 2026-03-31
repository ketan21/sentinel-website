const MAX_LENGTHS = {
    name: 120,
    email: 200,
    address: 500,
    website: 240,
    message: 2000,
};

function json(body, init = {}) {
    return new Response(JSON.stringify(body), {
        ...init,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...(init.headers || {}),
        },
    });
}

function trimField(value, limit) {
    return String(value || "").trim().slice(0, limit);
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;");
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readPayload(request) {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return request.json();
    }

    if (contentType.includes("form-data") || contentType.includes("x-www-form-urlencoded")) {
        const formData = await request.formData();
        return Object.fromEntries(formData.entries());
    }

    return {};
}

function normalize(payload) {
    return {
        name: trimField(payload.name, MAX_LENGTHS.name),
        email: trimField(payload.email, MAX_LENGTHS.email),
        address: trimField(payload.address, MAX_LENGTHS.address),
        website: trimField(payload.website, MAX_LENGTHS.website),
        message: trimField(payload.message, MAX_LENGTHS.message),
    };
}

function validate(fields) {
    if (!fields.name || !fields.email || !fields.address) {
        return "Name, email, and address are required.";
    }

    if (!isValidEmail(fields.email)) {
        return "Enter a valid email address.";
    }

    if (!fields.website && !fields.message) {
        return "Provide either a business website or a message.";
    }

    return null;
}

function buildEmail(fields, origin) {
    const websiteLine = fields.website || "Not provided";
    const messageLine = fields.message || "Not provided";

    return {
        subject: `Sentinel Relay interest request from ${fields.name}`,
        text: [
            "New Sentinel Relay interest request",
            "",
            `Name: ${fields.name}`,
            `Email: ${fields.email}`,
            `Address: ${fields.address}`,
            `Website: ${websiteLine}`,
            `Message: ${messageLine}`,
            `Origin: ${origin}`,
        ].join("\n"),
        html: `
            <h1>New Sentinel Relay interest request</h1>
            <p><strong>Name:</strong> ${escapeHtml(fields.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
            <p><strong>Address:</strong><br>${escapeHtml(fields.address).replaceAll("\n", "<br>")}</p>
            <p><strong>Website:</strong> ${escapeHtml(websiteLine)}</p>
            <p><strong>Message:</strong><br>${escapeHtml(messageLine).replaceAll("\n", "<br>")}</p>
            <p><strong>Origin:</strong> ${escapeHtml(origin)}</p>
        `,
    };
}

export async function POST(request) {
    try {
        const payload = await readPayload(request);
        const fields = normalize(payload);
        const validationError = validate(fields);
        if (validationError) {
            return json({ error: validationError }, { status: 400 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        const toEmail = process.env.INTEREST_FORM_TO_EMAIL;
        const fromEmail =
            process.env.INTEREST_FORM_FROM_EMAIL || "Sentinel Relay Interest <onboarding@resend.dev>";

        if (!resendApiKey || !toEmail) {
            return json(
                {
                    error:
                        "Interest form is not configured yet. Set RESEND_API_KEY and INTEREST_FORM_TO_EMAIL in Vercel.",
                },
                { status: 500 },
            );
        }

        const origin = request.headers.get("origin") || request.headers.get("host") || "unknown";
        const email = buildEmail(fields, origin);

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                authorization: `Bearer ${resendApiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: fields.email,
                subject: email.subject,
                text: email.text,
                html: email.html,
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error("resend delivery failed", errorText);
            return json(
                {
                    error: "The request was received, but delivery is not configured correctly yet.",
                },
                { status: 502 },
            );
        }

        return json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("interest submission failed", error);
        return json(
            { error: "Unexpected server error while submitting the request." },
            { status: 500 },
        );
    }
}
