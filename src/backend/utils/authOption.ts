import * as yup from 'yup';
import * as bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import User from '../db/models/user';
import { signJwtAccessToken } from '@/backend/jwt';
import authschema from '@/app/validation/auth.schema';
import CredentialsProvider from 'next-auth/providers/credentials';

export const options: NextAuthOptions = {
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        name: { label: 'Name', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        if (!credentials) {
          return null;
        }

        const { email, password } = credentials;

        try {
          authschema.validateSync({ email, password }, { abortEarly: false });

          const user = await User.findOne({
            where: { email: email },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          if (!user.password || !bcrypt.compare(password, user.password)) {
            throw new Error('Invalid email or password');
          }

          const { password: pass, ..._userWithoutPass } = user.toJSON();
          const userWithoutPass = {
            ..._userWithoutPass,
          };

          const accessToken = signJwtAccessToken(userWithoutPass);
          return {
            ...userWithoutPass,
            accessToken,
          };
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            let errors = {};
            error.inner.forEach((result) => {
              errors = { ...errors, [result.path as any]: result.message };
            });

            throw new Error(
              JSON.stringify({
                success: false,
                error: errors,
              })
            );
          }

          throw new Error(
            JSON.stringify({
              success: false,
              error: (error as Error).message,
              status: 500,
            })
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const { token: tokenData } = token as any;
      if (user && token) {
        const { id, role } = user as any;
        return { token: tokenData, user: { id, role } };
      }
      return token;
    },
    async session({ session, token }) {
      return { ...session, user: findUser(token) as any };
    },
  },
};

function findUser(object: Record<string, any>): any | null {
  for (const key in object) {
    if (key === 'user' && object.user && object.user.role) {
      return object[key];
    } else if (typeof object[key] === 'object') {
      const result = findUser(object[key]);
      if (result) {
        return result;
      }
    }
  }
  return null;
}
