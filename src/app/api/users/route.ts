import registerSchema from "@/app/validation/register.schema";
import models from "@/backend/db/models";
import { Role } from "@/backend/db/models/user";
import { jsonResponse } from "@/backend/helpers/function.helpers";
import * as bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
   try {
      const body = await req.json();

      const validation = await registerSchema.validate(body);
      if (!validation) {
         return jsonResponse({
            success: false,
            error: "Validation failed",
            status: 400,
         });
      }

      // Check for existing email
      const isEmailExist = await models.User.findOne({
         attributes: ["email"],
         where: { email: body.email },
      });

      if (isEmailExist) {
         return jsonResponse({
            success: false,
            error: "Email already exists",
            status: 400,
         });
      }

      // Prepare user data with required fields
      const userData = {
         email: body.email,
         name: body.name,
         password: await bcrypt.hash(body.password, 10),
         role: body.role || Role.user, // Provide default role if not specified
      };

      const user = await models.User.create(userData);
      const { password, ...userWithoutPassword } = user.toJSON();

      return jsonResponse({
         success: true,
         data: userWithoutPassword,
      });
   } catch (e) {
      console.error("Registration error:", e); // Detailed error logging
      return jsonResponse({
         success: false,
         error: e instanceof Error ? e.message : "Unknown error",
         status: 500,
      });
   }
}

export async function GET(request: Request) {
   try {
      const { searchParams } = new URL(request.url);
      const id = Number(searchParams.get("id"));

      // Validate ID
      if (!id || isNaN(id)) {
         return NextResponse.json(
            { error: "Valid user ID required" },
            { status: 400 }
         );
      }

      // Find user
      const user = await models.User.findByPk(id);

      if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Return clean response
      return NextResponse.json({
         status: "success",
         data: user.get({ plain: true }),
      });
   } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
         { status: "error", message: "Internal server error" },
         { status: 500 }
      );
   }
}
