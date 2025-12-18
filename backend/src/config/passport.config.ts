import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { findByIdUserService } from "../services/user.service";
import { Env } from "./env.config";

passport.use(
  new JwtStrategy(
    {
      // Accept token from cookie OR Authorization header (Bearer)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // prefer cookie for web
          try {
            const token = req?.cookies?.accessToken;
            if (token) return token;
          } catch (e) {}
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: Env.JWT_SECRET,
      audience: ["user"],
      algorithms: ["HS256"],
    },
    async ({ userId }, done) => {
      try {
        const user = userId && (await findByIdUserService(userId));
        return done(null, user || false);
      } catch (error) {
        return done(null, false);
      }
    }
  )
);

export const passportAuthenticateJwt = passport.authenticate("jwt", {
  session: false,
});
