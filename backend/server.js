require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const { Pool } = require("pg");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test Route
app.get("/", (req, res) => {
  res.send("KPL API Running");
});

// Database Test
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===========================
   USERS
=========================== */

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, first_name, last_name, full_name, email, created_at FROM users ORDER BY user_id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Register new user
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    // Parse full name into first and last name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Insert user
    const result = await pool.query(
      `
      INSERT INTO users
      (
        first_name,
        last_name,
        full_name,
        email,
        password_hash
      )
      VALUES
      (
        $1,$2,$3,$4,$5
      )
      RETURNING user_id, first_name, last_name, full_name, email, created_at
      `,
      [
        firstName,
        lastName,
        name,
        email,
        passwordHash,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    // Handle unique constraint violation for email
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    res.status(500).json({
      error: err.message,
    });
  }
});

// Login user
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Compare password
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Create user (existing endpoint - kept for backward compatibility)
app.post("/api/users", async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      vibhaag,
      gender,
      dob,
      mobile,
      email,
      city,
      address,
      occupation,
    } = req.body;

    const full_name =
      `${first_name} ${middle_name || ""} ${last_name}`
        .replace(/\s+/g, " ")
        .trim();

    const result = await pool.query(
      `
      INSERT INTO users
      (
        first_name,
        middle_name,
        last_name,
        full_name,
        vibhaag,
        gender,
        dob,
        mobile,
        email,
        city,
        address,
        occupation,
        password_hash
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *
      `,
      [
        first_name,
        middle_name,
        last_name,
        full_name,
        vibhaag,
        gender,
        dob,
        mobile,
        email,
        city,
        address,
        occupation,
        "", // placeholder password
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===========================
   EVENTS
=========================== */

app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM events ORDER BY event_id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const {
      event_name,
      event_type,
      description,
      venue,
      start_date,
      end_date,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO events
      (
        event_name,
        event_type,
        description,
        venue,
        start_date,
        end_date
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6
      )
      RETURNING *
      `,
      [
        event_name,
        event_type,
        description,
        venue,
        start_date,
        end_date,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===========================
   CRICKET PROFILE
=========================== */

app.post("/api/cricket-profile", async (req, res) => {
  try {
    const {
      user_id,
      batting_style,
      bowling_style,
      is_wicketkeeper,
      tshirt_number,
      tshirt_name,
      tshirt_size,
      cricket_experience_years,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO cricket_profiles
      (
        user_id,
        batting_style,
        bowling_style,
        is_wicketkeeper,
        tshirt_number,
        tshirt_name,
        tshirt_size,
        cricket_experience_years
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      RETURNING *
      `,
      [
        user_id,
        batting_style,
        bowling_style,
        is_wicketkeeper,
        tshirt_number,
        tshirt_name,
        tshirt_size,
        cricket_experience_years,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===========================
   EVENT REGISTRATION
=========================== */

app.post("/api/register-event", async (req, res) => {
  try {
    const { user_id, event_id } = req.body;

    const result = await pool.query(
      `
      INSERT INTO registrations
      (
        user_id,
        event_id
      )
      VALUES
      (
        $1,$2
      )
      RETURNING *
      `,
      [user_id, event_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===========================
   START SERVER
=========================== */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});