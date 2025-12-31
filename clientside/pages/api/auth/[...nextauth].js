import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const googleClientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
const hasGoogleCredentials = Boolean(googleClientId && googleClientSecret);

export const authOptions = {
  providers: hasGoogleCredentials
    ? [
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl) {
          return url;
        }
      } catch (err) {
        console.error("Error parsing redirect URL:", err);
      }

      return baseUrl;
    },
  },
};

const handler = (req, res) => {
  if (!hasGoogleCredentials) {
    res.status(500).json({
      error:
        "Google OAuth credentials are missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.",
    });
    return;
  }

  return NextAuth(req, res, authOptions);
};

export default handler;