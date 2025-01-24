const express = require("express");
const supabase = require("./supabaseClient");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const port = 5500;

function generateCodeVerifier() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

app.use(cookieParser());
app.use(express.static("public"));

app.get("/login/github", async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: `http://localhost:${port}/auth/callback`,
        }
    });

    if (error) {
        return res.status(400).send("Error signing in: " + error.message);
    }

    res.redirect(data.url);
});

app.get("/auth/callback", async (req, res) => {
    const access_token = req.query.code;

    if (!access_token) {
        return res.status(400).send("No access_token received from GitHub");
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(access_token);

    if (error) {
        return res.status(400).send("Error during callback: " + error.message);
    }

    res.cookie("supabaseToken", data.session.access_token, {
        httpOnly: false,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    res.redirect("/");
});

app.get("/", (req, res) => {
    console.log(req.headers.cookie);
    res.sendFile("index.html");
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});