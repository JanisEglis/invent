import type { NextApiRequest, NextApiResponse } from "next";

function isValid(u: string, p: string) {
  const cfg = process.env.AUTH_CREDENTIALS || "";
  return cfg.split(",").map(s=>s.trim()).filter(Boolean).some(pair=>{
    const [usr, pass] = pair.split(":");
    return usr?.trim()===u && pass?.trim()===p;
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (process.env.ENABLE_LOCAL_LOGIN !== "1") return res.status(403).send("Disabled");

  const { u, p } = req.body || {};
  if (!u || !p) return res.status(400).send("Bad Request");
  if (!isValid(u, p)) return res.status(401).send("Nederīgi dati");

  const maxAge = 60*60*12; // 12h
  res.setHeader("Set-Cookie", [`auth=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`]);
  res.status(200).json({ ok:true });
}
