import * as z from "zod";
import { GenderEnum } from "../../enum/user.enum.js";

export const signUpSchema = z
  .object({
    userName: z
      .string({ error: "Username is required" })
      .min(3, { message: "Username must be at least 3 characters" })
      .max(50, { message: "Username must be at most 50 characters" })
      .trim(),

    email: z.email({ message: "Invalid email format" }).toLowerCase().trim(),

    password: z
      .string({ error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),

    rePassword: z.string({ error: "Confirm password is required" }),

    age: z
      .number({ error: "Age is required" })
      .min(18, { message: "Age must be at least 18" })
      .max(100, { message: "Age must be at most 100" }),

    phone: z.string().trim().optional(),

    address: z.string().trim().optional(),

    gender: z.enum(GenderEnum).optional(),
  })
  .strict()
  .refine((data) => data.password === data.rePassword, {
    message: "Passwords don't match",
    path: ["rePassword"],
  });

export type SignupI = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email("Please enter a valid email").trim().toLowerCase(),

  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
});

export type SigninI = z.infer<typeof signInSchema>;

export const updateProfileSchema = z.object({
  firstName: z
    .string({
      error: "firstName is required",
    })
    .min(3, "firstName must be at least 3 characters")
    .max(30, "firstName must be at most 30 characters")
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "firstName can only contain letters, numbers, spaces, - and _",
    ),

  lastName: z
    .string({
      error: "lastName is required",
    })
    .min(3, "lastName must be at least 3 characters")
    .max(30, "lastName must be at most 30 characters")
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "lastName can only contain letters, numbers, spaces, - and _",
    ),

  age: z
    .number({
      error: "Age is required",
    })
    .int("Age must be an integer")
    .min(18, "You must be at least 18 years old"),

  phone: z
    .string()
    .regex(
      /^01[0125][0-9]{8}$/,
      "Please enter a valid Egyptian mobile number starting with 010, 011, 012 or 015 followed by 8 digits",
    )
    .optional()
    .or(z.literal("")),

  gender: z
    .enum(GenderEnum, { error: "Gender must be either male or female" })
    .optional(),
});

export type updateProfileI = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string({
      error: "Old Password is required",
    }),

    newPassword: z
      .string({
        error: "newPassword is required",
      })
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string({
      error: "Confirm password is required",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type updatePasswordI = z.infer<typeof updatePasswordSchema>;

export const confirmEmailSchema = z.object({
  email: z.email("Email Is Reuquierd"),
  otp: z
    .string({
      error: "Otp is required",
    })
    .length(6, "Otp must be exactly 6 characters"),
});

export type confirmEmailI = z.infer<typeof confirmEmailSchema>;

export const emailSchema = z.object({
  email: z.email("Email is required"),
});

export type EmailI = z.infer<typeof emailSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.email({ message: "Invalid email format" }).toLowerCase().trim(),
    newPassword: z
      .string({ error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),

    rePassword: z.string({ error: "Confirm password is required" }),
  })
  .strict()
  .refine((data) => data.newPassword === data.rePassword, {
    message: "Passwords don't match",
    path: ["rePassword"],
  });

export type ResetPasswordI = z.infer<typeof resetPasswordSchema>;
