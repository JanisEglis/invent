import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/_login" },
  callbacks: {
    async signIn({ profile }) {
      const allow = (process.env.ALLOWED_GH || "")
        .split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
      if (!allow.length) return true; // ja saraksts tukšs — atļaujam visiem
      const gh = (profile as any)?.login?.toLowerCase();
      return !!gh && allow.includes(gh);
    }
  }
});
