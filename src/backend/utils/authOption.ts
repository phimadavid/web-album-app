import * as yup from 'yup';
import * as bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import User, { Role } from '../db/models/user';
import { signJwtAccessToken } from '@/backend/jwt';
import authschema from '@/app/validation/auth.schema';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const options: NextAuthOptions = {
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_ID!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        // console.log('NextAuth authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials) {
          console.log('No credentials provided');
          return null;
        }

        const { email, password } = credentials;

        try {
          console.log('Validating credentials with schema');
          authschema.validateSync({ email, password }, { abortEarly: false });

          // console.log('Looking for user with email:', email);
          const user = await User.findOne({
            where: { email: email },
          });

          if (!user) {
            console.log('User not found');
            throw new Error('Invalid email or password');
          }

          // console.log('User found, comparing passwords');
          // console.log('User password exists:', !!user.password);
          // console.log('User password length:', user.password ? user.password.length : 0);
          // console.log('Input password length:', password ? password.length : 0);
          
          // Check if user has a password (not OAuth user)
          if (!user.password) {
            console.log('User has no password (likely OAuth user)');
            throw new Error('Invalid email or password');
          }
          
          // Perform password comparison
          const passwordMatch = await bcrypt.compare(password, user.password);
          // console.log('Password comparison result:', passwordMatch);
          
          if (!passwordMatch) {
            console.log('Password comparison failed');
            throw new Error('Invalid email or password');
          }

          const { password: pass, ..._userWithoutPass } = user.toJSON();
          const userWithoutPass = {
            ..._userWithoutPass,
          };

          // console.log('Authentication successful for user:', userWithoutPass.email);
          const accessToken = signJwtAccessToken(userWithoutPass);
          return {
            ...userWithoutPass,
            accessToken,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user already exists in database
          let existingUser = await User.findOne({
            where: { email: user.email },
          });

          if (!existingUser && user.name && user.email) {
            // Create new user for Google OAuth
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              role: Role.user,
              password: null, // Null password for OAuth users
              googleId: account.providerAccountId,
              image: user.image,
            });
          }

          if (existingUser) {
            // Add database user info to the user object for later use
            (user as any).dbId = existingUser.id.toString();
            (user as any).dbRole = existingUser.role;
          }
          
          return true;
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user) {
        // For Google OAuth users, store user info in token
        const dbUser = user as any;
        token.user = {
          id: dbUser.dbId,
          role: dbUser.dbRole,
          name: user.name,
          email: user.email,
        };
        
        // Generate access token for Google users
        const accessToken = signJwtAccessToken({
          id: dbUser.dbId,
          role: dbUser.dbRole,
          name: user.name,
          email: user.email,
        });
        token.accessToken = accessToken;
      } else if (user && account?.provider === 'credentials') {
        // For credentials provider - store user info in token
        token.user = {
          id: (user as any).id,
          role: (user as any).role,
          name: user.name,
          email: user.email,
        };
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        // For both Google OAuth and credentials users
        return {
          ...session,
          user: {
            ...session.user,
            id: (token.user as any).id,
            role: (token.user as any).role,
            accessToken: token.accessToken,
          } as any,
        };
      }
      return session;
    },
  },
};
