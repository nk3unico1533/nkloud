import fs from "fs";
import crypto from "crypto";

const USERS_DB = "./users.json";

export function initDB() {
  if (!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB, "[]");

  global.DB = {
    load() {
      return JSON.parse(fs.readFileSync(USERS_DB));
    },
    save(data) {
      fs.writeFileSync(USERS_DB, JSON.stringify(data, null, 2));
    },

    async register(email, password) {
      const users = this.load();

      if (users.find((u) => u.email === email))
        return { success: false, msg: "Email already exists" };

      const token = crypto.randomBytes(24).toString("hex");

      const newUser = { email, password, token };
      users.push(newUser);

      this.save(users);

      return { success: true, token };
    },

    async login(email, password) {
      const users = this.load();

      const user = users.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) return { success: false, msg: "Invalid credentials" };

      return { success: true, token: user.token };
    }
  };
}

export function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token)
    return res.status(401).json({ error: "Auth token required" });

  const users = global.DB.load();
  const user = users.find((u) => u.token === token);

  if (!user) return res.status(403).json({ error: "Invalid token" });

  req.user = user;
  next();
}
