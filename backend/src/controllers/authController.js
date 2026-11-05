const { createAuthClient, isConfigured } = require("../config/supabase");

// Seed demo users for immediate testing and quick TL demo
const DEMO_USERS = {
  "admin@company.com": { password: "password123", name: "System Admin", role: "admin" },
  "reception@company.com": { password: "password123", name: "Desk Receptionist", role: "receptionist" },
  "sales@company.com": { password: "password123", name: "Sales Executive", role: "sales" },
  "purchase@company.com": { password: "password123", name: "Purchase Officer", role: "purchase" },
  "store@company.com": { password: "password123", name: "Store Warehouse Keeper", role: "store" }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Supabase Auth if configured
    if (isConfigured) {
      const authClient = createAuthClient();
      const { data, error } = await authClient.auth.signInWithPassword({ email: cleanEmail, password });
      if (!error && data?.session) {
        // fetch role from profiles
        const { supabase } = require("../config/supabase");
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        return res.json({
          success: true,
          session: data.session,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name || data.user.email,
            role: profile?.role || "sales"
          }
        });
      }
    }

    // 2. Demo User Fallback (Exact login credentials for all 5 roles)
    const demoUser = DEMO_USERS[cleanEmail];
    if (demoUser && demoUser.password === password) {
      return res.json({
        success: true,
        session: {
          access_token: `demo_token_${demoUser.role}`,
          refresh_token: `demo_refresh_${demoUser.role}`
        },
        user: {
          id: `demo_${demoUser.role}_id`,
          email: cleanEmail,
          name: demoUser.name,
          role: demoUser.role
        }
      });
    }

    return res.status(401).json({ success: false, message: "Invalid email or password." });
  } catch (err) {
    console.error("Login controller error:", err);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { login, getMe };
