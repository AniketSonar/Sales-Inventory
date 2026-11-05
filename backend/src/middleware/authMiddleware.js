const supabase = require("../config/supabase");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication token required." });
    }

    const token = authHeader.split(" ")[1];

    // Demo/Development Token Support
    if (token.startsWith("demo_token_")) {
      const role = token.replace("demo_token_", "");
      req.user = {
        id: `demo_${role}_id`,
        name: `${role.toUpperCase()} User`,
        email: `${role}@company.com`,
        role: role
      };
      return next();
    }

    if (!supabase) {
      return res.status(500).json({ success: false, message: "Database not configured." });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.email,
      role: profile?.role || "sales"
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, message: "Internal server error during authentication." });
  }
};

module.exports = authenticate;
